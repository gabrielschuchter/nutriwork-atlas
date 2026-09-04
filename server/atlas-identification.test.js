import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import vm from "node:vm"
import { normalizeEmail, readIdentification } from "../plugins/atlas-ui/identification.js"
import { createIdentificationHandler, consumeRateLimit } from "./atlas-identification.js"

const gasCode = readFileSync(
  new URL("../integrations/google-sheets/Code.gs", import.meta.url),
  "utf8",
)
const gasValidator = vm.runInNewContext(gasCode + "; normalizeEmail_;")

describe("identificação sintática, compartilhada com Google", () => {
  for (const input of [
    null,
    3,
    {},
    "",
    "nome",
    "nome@",
    "@exemplo.com",
    "a b@exemplo.com",
    "a..b@exemplo.com",
    ".a@exemplo.com",
    "a.@exemplo.com",
    "a@-exemplo.com",
    "a@exemplo",
    "a@exemplo..com",
    "a@exemplo.com\nBcc:x",
    "a".repeat(65) + "@exemplo.com",
  ]) {
    it(`rejeita ${JSON.stringify(input)}`, () => {
      assert.equal(normalizeEmail(input), null)
      assert.equal(gasValidator(input), null)
    })
  }
  for (const input of [
    "Pessoa+atlas@exemplo.com.br",
    "  PESSOA@EXEMPLO.COM  ",
    "=teste@exemplo.com",
    "o'hara@exemplo.com",
  ]) {
    it(`normaliza ${input}`, () => {
      assert.equal(normalizeEmail(input), input.trim().toLowerCase())
      assert.equal(gasValidator(input), input.trim().toLowerCase())
    })
  }
  it("descarta persistência inválida ou inacessível", () => {
    for (const value of [
      null,
      "{",
      "{}",
      '{"version":1,"email":"invalido"}',
      '{"version":2,"email":"x@exemplo.com"}',
    ]) {
      assert.equal(readIdentification({ getItem: () => value }, "key"), null)
    }
    assert.equal(
      readIdentification(
        {
          getItem() {
            throw new Error()
          },
        },
        "key",
      ),
      null,
    )
    assert.equal(
      readIdentification({ getItem: () => '{"version":1,"email":"X@EXEMPLO.COM"}' }, "key"),
      "x@exemplo.com",
    )
  })
})

async function request({
  method = "POST",
  body = { email: "Pessoa@exemplo.com", visitId: randomUUID() },
  headers = {},
  fetcher = async () => ({ ok: true, json: async () => ({ ok: true }) }),
  env,
  limit,
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
  await createIdentificationHandler({
    env: env || {
      ATLAS_SHEETS_WEBHOOK_URL: "https://script.google.com/macros/s/test/exec",
      ATLAS_SHEETS_WEBHOOK_SECRET: "test-secret-not-real-".repeat(3),
    },
    fetcher,
    limit,
  })(
    {
      method,
      body,
      headers: { host: "localhost:4321", "content-type": "application/json", ...headers },
      socket: { remoteAddress: "test" },
    },
    res,
  )
  return result
}

describe("função server-side", () => {
  it("envia apenas dados necessários ao Google e não devolve segredos", async () => {
    const result = await request({
      fetcher: async (_, options) => {
        const payload = JSON.parse(options.body)
        assert.deepEqual(Object.keys(payload).sort(), ["email", "secret", "visitId"])
        assert.equal(payload.email, "pessoa@exemplo.com")
        assert.ok(options.signal)
        return { ok: true, json: async () => ({ ok: true, secret: "must-not-leak" }) }
      },
    })
    assert.equal(result.status, 200)
    assert.deepEqual(result.body, { ok: true, email: "pessoa@exemplo.com" })
    assert.equal(result.headers["Cache-Control"], "no-store")
  })
  it("rejeita inválidos antes do upstream", async () => {
    const result = await request({
      body: { email: "a", visitId: randomUUID() },
      fetcher: () => {
        throw new Error("must not call")
      },
    })
    assert.equal(result.status, 400)
  })
  it("rejeita visitId ausente", async () =>
    assert.equal((await request({ body: { email: "x@exemplo.com" } })).status, 400))
  it("rejeita método errado", async () =>
    assert.equal((await request({ method: "GET" })).status, 405))
  it("rejeita formulário cross-origin", async () =>
    assert.equal((await request({ headers: { origin: "https://evil.example" } })).status, 403))
  it("rejeita origem null", async () =>
    assert.equal((await request({ headers: { origin: "null" } })).status, 403))
  it("rejeita content-type errado", async () =>
    assert.equal((await request({ headers: { "content-type": "text/plain" } })).status, 415))
  it("rejeita payload grande", async () =>
    assert.equal((await request({ body: { email: "a".repeat(1100) } })).status, 413))
  it("rejeita JSON inválido", async () => assert.equal((await request({ body: "{" })).status, 400))
  it("retorna erro quando não configurado", async () =>
    assert.equal((await request({ env: {} })).status, 503))
  it("trata indisponibilidade e timeout", async () => {
    assert.equal(
      (
        await request({
          fetcher: async () => {
            throw new Error("private upstream details")
          },
        })
      ).status,
      503,
    )
    assert.equal((await request({ fetcher: async () => ({ ok: false }) })).status, 503)
    assert.equal(
      (await request({ fetcher: async () => ({ ok: true, json: async () => ({ ok: false }) }) }))
        .status,
      503,
    )
  })
  it("trata proteção contra abuso", async () =>
    assert.equal((await request({ limit: () => false })).status, 429))
  it("limita e expira buckets sem crescer indefinidamente", () => {
    const store = new Map()
    for (let i = 0; i < 30; i++) assert.equal(consumeRateLimit("key", 0, store), true)
    assert.equal(consumeRateLimit("key", 1, store), false)
    assert.equal(consumeRateLimit("key", 600000, store), true)
    assert.equal(store.size, 1)
  })
})

describe("Apps Script: upsert protegido por lock", () => {
  it("novo usuário, recorrência, idempotência e primeiro acesso preservado", () => {
    const rows = [["email", "primeiro_acesso", "ultimo_acesso", "acessos"]]
    const cache = new Map()
    let locked = false
    const sheet = {
      getLastRow: () => rows.length,
      getRange(row, col, height = 1, width = 1) {
        return {
          getValues: () =>
            rows.slice(row - 1, row - 1 + height).map((r) => r.slice(col - 1, col - 1 + width)),
          getValue: () => rows[row - 1][col - 1],
          setValues(values) {
            assert.equal(locked, true)
            values.forEach((r, i) => {
              rows[row - 1 + i] ||= []
              r.forEach((value, j) => (rows[row - 1 + i][col - 1 + j] = value))
            })
          },
          setNumberFormat() {},
          createTextFinder(email) {
            return {
              matchEntireCell() {
                return this
              },
              matchCase() {
                return this
              },
              useRegularExpression() {
                return this
              },
              findNext() {
                const index = rows.findIndex((r, i) => i > 0 && r[0] === email)
                return index < 0 ? null : { getRow: () => index + 1 }
              },
            }
          },
        }
      },
    }
    const doPost = vm.runInNewContext(gasCode + "; doPost;", {
      LockService: {
        getScriptLock: () => ({
          tryLock: () => (locked = true),
          hasLock: () => locked,
          releaseLock: () => (locked = false),
        }),
      },
      PropertiesService: {
        getScriptProperties: () => ({
          getProperty: (key) => (key === "ATLAS_WEBHOOK_SECRET" ? "test".repeat(12) : "sheet-id"),
        }),
      },
      CacheService: {
        getScriptCache: () => ({
          get: (key) => cache.get(key),
          put: (key, value) => cache.set(key, value),
        }),
      },
      SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }), flush() {} },
      Utilities: {
        DigestAlgorithm: { SHA_256: "sha" },
        computeDigest: (_, value) => value,
        base64EncodeWebSafe: (value) => value,
      },
      ContentService: {
        MimeType: { JSON: "json" },
        createTextOutput: (value) => ({ setMimeType: () => JSON.parse(value) }),
      },
    })
    const payload = {
      email: "  PESSOA@EXEMPLO.COM  ",
      visitId: randomUUID(),
      secret: "test".repeat(12),
    }
    const post = () => doPost({ postData: { contents: JSON.stringify(payload) } })
    assert.equal(post().ok, true)
    const first = rows[1][1]
    assert.equal(rows.length, 2)
    assert.equal(rows[1][0], "pessoa@exemplo.com")
    assert.equal(rows[1][3], 1)
    assert.equal(post().ok, true)
    assert.equal(rows[1][3], 1)
    payload.visitId = randomUUID()
    assert.equal(post().ok, true)
    assert.equal(rows.length, 2)
    assert.equal(rows[1][1], first)
    assert.ok(rows[1][2] >= first)
    assert.equal(rows[1][3], 2)
    assert.equal(locked, false)
    payload.secret = "incorrect"
    assert.equal(post().code, "unauthorized")
    assert.equal(rows[1][3], 2)
  })
})
