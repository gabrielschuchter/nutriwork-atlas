import { createHash } from "node:crypto"
import { consumeRateLimit } from "./atlas-identification.js"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TITLE_MAX = 160
const DESCRIPTION_MAX = 2000
const BODY_MAX = 4096

function reply(res, status, payload) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.setHeader("Cache-Control", "no-store")
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.end(JSON.stringify(payload))
}

function readText(value, maximum) {
  if (typeof value !== "string") return null
  const text = value.trim()
  return text && text.length <= maximum ? text : null
}

export function createSuggestionHandler({
  env = process.env,
  fetcher = fetch,
  limit = consumeRateLimit,
} = {}) {
  return async function suggest(req, res) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST")
      return reply(res, 405, { ok: false, code: "method_not_allowed" })
    }
    const origin = req.headers.origin
    const host = req.headers.host
    try {
      if (origin && new URL(origin).host !== host) throw new Error("origin")
      if (req.headers["sec-fetch-site"] === "cross-site") throw new Error("origin")
    } catch {
      return reply(res, 403, { ok: false, code: "invalid_origin" })
    }
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers["content-type"] || ""))
      return reply(res, 415, { ok: false, code: "invalid_content_type" })
    if (Number(req.headers["content-length"]) > BODY_MAX)
      return reply(res, 413, { ok: false, code: "payload_too_large" })

    const address = String(
      req.headers["x-vercel-forwarded-for"] || req.socket?.remoteAddress || "unknown",
    )
    if (!limit("suggestion:" + createHash("sha256").update(address).digest("hex"))) {
      res.setHeader("Retry-After", "600")
      return reply(res, 429, { ok: false, code: "rate_limited" })
    }

    let body
    try {
      if (req.body !== undefined) {
        const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body)
        if (Buffer.byteLength(raw) > BODY_MAX)
          return reply(res, 413, { ok: false, code: "payload_too_large" })
        body = JSON.parse(raw)
      } else {
        const chunks = []
        let size = 0
        for await (const chunk of req) {
          size += Buffer.byteLength(chunk)
          if (size > BODY_MAX) return reply(res, 413, { ok: false, code: "payload_too_large" })
          chunks.push(Buffer.from(chunk))
        }
        body = JSON.parse(Buffer.concat(chunks).toString("utf8"))
      }
    } catch {
      return reply(res, 400, { ok: false, code: "invalid_request" })
    }

    const title = readText(body?.title, TITLE_MAX)
    const description = readText(body?.description, DESCRIPTION_MAX)
    if (!title || !description || !UUID.test(body?.submissionId || ""))
      return reply(res, 400, { ok: false, code: "invalid_request" })

    const url = env.ATLAS_SHEETS_WEBHOOK_URL
    const secret = env.ATLAS_SHEETS_WEBHOOK_SECRET
    if (
      !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url || "") ||
      !secret ||
      secret.length < 32
    )
      return reply(res, 503, { ok: false, code: "submission_unavailable" })

    try {
      const response = await fetcher(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "suggestion",
          title,
          description,
          submissionId: body.submissionId,
          secret,
        }),
        signal: AbortSignal.timeout(25000),
        redirect: "follow",
      })
      if (!response.ok) throw new Error("upstream")
      const result = await response.json()
      if (result?.ok !== true)
        return reply(res, result?.code === "rate_limited" ? 429 : 503, {
          ok: false,
          code: result?.code === "rate_limited" ? "rate_limited" : "submission_unavailable",
        })
      return reply(res, 200, { ok: true })
    } catch {
      return reply(res, 503, { ok: false, code: "submission_unavailable" })
    }
  }
}
