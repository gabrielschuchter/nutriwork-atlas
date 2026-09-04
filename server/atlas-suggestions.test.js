import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { createSuggestionHandler } from "./atlas-suggestions.js"

async function request({
  body,
  fetcher = async () => ({ ok: true, json: async () => ({ ok: true }) }),
  env,
  limit = () => true,
} = {}) {
  const result = { headers: {} }
  const res = {
    setHeader(key, value) {
      result.headers[key] = value
    },
    end(value) {
      result.body = JSON.parse(value)
      result.status = this.statusCode
    },
  }
  await createSuggestionHandler({
    env: env || {
      ATLAS_SHEETS_WEBHOOK_URL: "https://script.google.com/macros/s/test/exec",
      ATLAS_SHEETS_WEBHOOK_SECRET: "test-secret-not-real-".repeat(3),
    },
    fetcher,
    limit,
  })(
    {
      method: "POST",
      body: { submissionId: randomUUID(), ...body },
      headers: { host: "localhost:4321", "content-type": "application/json" },
      socket: { remoteAddress: "test" },
    },
    res,
  )
  return result
}

describe("sugestões do roadmap", () => {
  it("encaminha apenas o payload necessário ao webhook", async () => {
    const result = await request({
      body: { title: "Nova relação", description: "Mostrar mais contexto." },
      fetcher: async (_, options) => {
        const payload = JSON.parse(options.body)
        assert.deepEqual(Object.keys(payload).sort(), [
          "description",
          "secret",
          "submissionId",
          "title",
          "type",
        ])
        assert.equal(payload.type, "suggestion")
        assert.equal(payload.title, "Nova relação")
        assert.equal(payload.description, "Mostrar mais contexto.")
        assert.ok(options.signal)
        return { ok: true, json: async () => ({ ok: true }) }
      },
    })
    assert.equal(result.status, 200)
    assert.deepEqual(result.body, { ok: true })
    assert.equal(result.headers["Cache-Control"], "no-store")
  })

  it("preserva o POST quando o Apps Script redireciona a requisição", async () => {
    const calls = []
    const result = await request({
      body: { title: "Nova relação", description: "Mostrar mais contexto." },
      fetcher: async (url, options) => {
        calls.push({ url, options })
        if (calls.length === 1)
          return {
            status: 302,
            ok: false,
            headers: {
              get: (name) =>
                name === "location" ? "https://script.googleusercontent.com/echo" : null,
            },
          }
        return { status: 200, ok: true, json: async () => ({ ok: true }) }
      },
    })
    assert.equal(result.status, 200)
    assert.equal(calls.length, 2)
    assert.equal(calls[1].options.method, "POST")
    assert.equal(calls[1].options.redirect, "manual")
  })

  it("valida título, descrição e idempotency key antes do upstream", async () => {
    for (const body of [
      { title: "", description: "Descrição" },
      { title: "Título", description: "" },
      { title: "x".repeat(161), description: "Descrição" },
      { title: "Título", description: "x".repeat(2001) },
      { title: "Título", description: "Descrição", submissionId: "not-a-uuid" },
    ]) {
      const result = await request({
        body,
        fetcher: () => {
          throw new Error("must not call")
        },
      })
      assert.equal(result.status, 400)
    }
  })

  it("bloqueia origem externa, abuso e configuração ausente", async () => {
    const originResult = { headers: {} }
    const originRes = {
      setHeader(key, value) {
        originResult.headers[key] = value
      },
      end(value) {
        originResult.body = JSON.parse(value)
        originResult.status = this.statusCode
      },
    }
    await createSuggestionHandler({ limit: () => true })(
      {
        method: "POST",
        body: { title: "Título", description: "Descrição", submissionId: randomUUID() },
        headers: {
          host: "localhost:4321",
          origin: "https://example.invalid",
          "content-type": "application/json",
        },
        socket: { remoteAddress: "test" },
      },
      originRes,
    )
    assert.equal(originResult.status, 403)

    const limited = await request({
      body: { title: "Título", description: "Descrição" },
      fetcher: () => {
        throw new Error("must not call")
      },
      limit: () => false,
    })
    assert.equal(limited.status, 429)

    const unavailable = await request({
      body: { title: "Título", description: "Descrição" },
      env: {},
    })
    assert.equal(unavailable.status, 503)
  })
})
