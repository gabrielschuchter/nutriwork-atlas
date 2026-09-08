import { createHash } from "node:crypto"
import { consumeRateLimit } from "./atlas-identification.js"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TITLE_MAX = 160
const DESCRIPTION_MAX = 2000
const BODY_MAX = 4096
const WEBHOOK_REDIRECT_STATUSES = new Set([301, 302, 307, 308])
const WEBHOOK_REDIRECT_HOSTS = new Set(["script.google.com", "script.googleusercontent.com"])
const SAFE_UPSTREAM_CODES = new Set([
  "busy",
  "configuration",
  "invalid_request",
  "rate_limited",
  "unauthorized",
])

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

function safeCode(value, fallback = "unknown") {
  return typeof value === "string" && /^[a-z_]+$/.test(value) ? value : fallback
}

function logEvent(logger, level, event, fields = {}) {
  const write = logger?.[level]
  if (typeof write !== "function") return
  write.call(logger, JSON.stringify({ event: `atlas_suggestions.${event}`, ...fields }))
}

function traceIdFor(submissionId) {
  return createHash("sha256").update(submissionId).digest("hex").slice(0, 12)
}

async function postToWebhook(url, payload, fetcher) {
  const request = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(25000),
    redirect: "manual",
  }
  let target = url
  let nextRequest = request
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetcher(target, nextRequest)
    if (!WEBHOOK_REDIRECT_STATUSES.has(response.status)) return response
    const location = response.headers?.get?.("location")
    if (!location) throw new Error("webhook_redirect_missing")
    const redirected = new URL(location, target)
    if (redirected.protocol !== "https:" || !WEBHOOK_REDIRECT_HOSTS.has(redirected.hostname))
      throw new Error("webhook_redirect_invalid")
    target = redirected.toString()
    nextRequest =
      response.status === 301 || response.status === 302
        ? {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: request.signal,
            redirect: "manual",
          }
        : request
  }
  throw new Error("webhook_redirect_limit")
}

export function createSuggestionHandler({
  env = process.env,
  fetcher = fetch,
  limit = consumeRateLimit,
  logger = console,
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
    const traceId = traceIdFor(body.submissionId)
    const webhookUrlValid = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(
      url || "",
    )
    const secretConfigured = Boolean(secret && secret.length >= 32)
    if (!webhookUrlValid || !secretConfigured) {
      logEvent(logger, "error", "configuration_invalid", {
        traceId,
        webhookUrlConfigured: Boolean(url),
        webhookUrlValid,
        secretConfigured,
      })
      return reply(res, 503, { ok: false, code: "submission_unavailable" })
    }

    let stage = "webhook_request"
    try {
      const response = await postToWebhook(
        url,
        {
          type: "suggestion",
          title,
          description,
          submissionId: body.submissionId,
          secret,
        },
        fetcher,
      )
      logEvent(logger, "info", "webhook_response", {
        traceId,
        status: Number.isInteger(response.status) ? response.status : null,
        ok: response.ok === true,
        contentType: response.headers?.get?.("content-type") || "unknown",
      })
      if (!response.ok) {
        stage = "webhook_http"
        throw new Error("upstream_http")
      }
      stage = "webhook_json"
      let result
      try {
        result = await response.json()
      } catch (error) {
        logEvent(logger, "error", "webhook_invalid_json", {
          traceId,
          error: safeCode(error?.name, "parse_error"),
        })
        throw new Error("upstream_invalid_json")
      }
      const upstreamCode = SAFE_UPSTREAM_CODES.has(result?.code) ? result.code : "unknown"
      logEvent(logger, "info", "webhook_result", {
        traceId,
        ok: result?.ok === true,
        code: upstreamCode,
      })
      if (result?.ok !== true) {
        stage = "webhook_rejected"
        logEvent(logger, "warn", "failed", { traceId, stage, code: upstreamCode })
        return reply(res, result?.code === "rate_limited" ? 429 : 503, {
          ok: false,
          code: result?.code === "rate_limited" ? "rate_limited" : "submission_unavailable",
        })
      }
      logEvent(logger, "info", "completed", { traceId })
      return reply(res, 200, { ok: true })
    } catch (error) {
      logEvent(logger, "error", "failed", {
        traceId,
        stage,
        error: safeCode(error?.message, safeCode(error?.name)),
      })
      return reply(res, 503, { ok: false, code: "submission_unavailable" })
    }
  }
}
