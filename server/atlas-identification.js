import { createHash } from "node:crypto"
import { normalizeEmail } from "../plugins/atlas-ui/identification.js"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const WINDOW_MS = 10 * 60 * 1000
const buckets = new Map()

export function consumeRateLimit(key, now = Date.now(), store = buckets) {
  for (const [id, bucket] of store) {
    if (bucket.expires <= now) store.delete(id)
  }
  const bucket = store.get(key) || { count: 0, expires: now + WINDOW_MS }
  if (bucket.count >= 30 || (!store.has(key) && store.size >= 2048)) return false
  bucket.count += 1
  store.set(key, bucket)
  return true
}

function reply(res, status, payload) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.setHeader("Cache-Control", "no-store")
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.end(JSON.stringify(payload))
}

export function createIdentificationHandler({
  env = process.env,
  fetcher = fetch,
  limit = consumeRateLimit,
} = {}) {
  return async function identify(req, res) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST")
      return reply(res, 405, { ok: false, code: "method_not_allowed" })
    }
    // Browsers must call the same-origin JSON endpoint, never the Google webhook.
    const origin = req.headers.origin
    const host = req.headers.host
    try {
      if (origin && new URL(origin).host !== host) throw new Error("origin")
      if (req.headers["sec-fetch-site"] === "cross-site") throw new Error("origin")
    } catch {
      return reply(res, 403, { ok: false, code: "invalid_origin" })
    }
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers["content-type"] || "")) {
      return reply(res, 415, { ok: false, code: "invalid_content_type" })
    }
    if (Number(req.headers["content-length"]) > 1024) {
      return reply(res, 413, { ok: false, code: "payload_too_large" })
    }
    // Ephemeral, bounded IP hashes only; never sent to Google or written to logs.
    const address = String(
      req.headers["x-vercel-forwarded-for"] || req.socket?.remoteAddress || "unknown",
    )
    if (!limit(createHash("sha256").update(address).digest("hex"))) {
      res.setHeader("Retry-After", "600")
      return reply(res, 429, { ok: false, code: "rate_limited" })
    }
    let body
    try {
      if (req.body !== undefined) {
        const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body)
        if (Buffer.byteLength(raw) > 1024)
          return reply(res, 413, { ok: false, code: "payload_too_large" })
        body = JSON.parse(raw)
      } else {
        const chunks = []
        let size = 0
        for await (const chunk of req) {
          size += Buffer.byteLength(chunk)
          if (size > 1024) return reply(res, 413, { ok: false, code: "payload_too_large" })
          chunks.push(Buffer.from(chunk))
        }
        body = JSON.parse(Buffer.concat(chunks).toString("utf8"))
      }
    } catch {
      return reply(res, 400, { ok: false, code: "invalid_request" })
    }
    const email = normalizeEmail(body?.email)
    if (!email) return reply(res, 400, { ok: false, code: "invalid_email" })
    if (typeof body.visitId !== "string" || !UUID.test(body.visitId)) {
      return reply(res, 400, { ok: false, code: "invalid_request" })
    }
    const url = env.ATLAS_SHEETS_WEBHOOK_URL
    const secret = env.ATLAS_SHEETS_WEBHOOK_SECRET
    if (
      !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url || "") ||
      !secret ||
      secret.length < 32
    ) {
      return reply(res, 503, { ok: false, code: "registration_unavailable" })
    }
    try {
      const response = await fetcher(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, visitId: body.visitId, secret }),
        signal: AbortSignal.timeout(15000),
        redirect: "follow",
      })
      if (!response.ok) throw new Error("upstream")
      const result = await response.json()
      if (result?.ok !== true) {
        return reply(res, result?.code === "rate_limited" ? 429 : 503, {
          ok: false,
          code: result?.code === "rate_limited" ? "rate_limited" : "registration_unavailable",
        })
      }
      return reply(res, 200, { ok: true, email })
    } catch {
      // Do not log upstream bodies, addresses, passwords or configuration.
      return reply(res, 503, { ok: false, code: "registration_unavailable" })
    }
  }
}
