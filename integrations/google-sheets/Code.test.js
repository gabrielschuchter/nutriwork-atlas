import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"
import vm from "node:vm"

const gasCode = readFileSync(new URL("./Code.gs", import.meta.url), "utf8")

describe("Apps Script: registro de sugestões", () => {
  it("registra a sugestão, devolve confirmação e mantém retry idempotente", () => {
    const secret = "suggestion-test-secret-".repeat(2)
    const submissionId = randomUUID()
    const rows = [["timestamp", "titulo", "descricao", "submission_id"]]
    const cache = new Map()
    let locked = false

    const sheet = {
      getLastRow: () => rows.length,
      getRange(row, column, height = 1, width = 1) {
        return {
          getValues: () =>
            rows
              .slice(row - 1, row - 1 + height)
              .map((current) => current.slice(column - 1, column - 1 + width)),
          setValues(values) {
            assert.equal(locked, true)
            values.forEach((current, rowOffset) => {
              rows[row - 1 + rowOffset] ||= []
              current.forEach((value, columnOffset) => {
                rows[row - 1 + rowOffset][column - 1 + columnOffset] = value
              })
            })
          },
          setNumberFormat() {},
        }
      },
    }

    const doPost = vm.runInNewContext(gasCode + "; doPost;", {
      LockService: {
        getScriptLock: () => ({
          tryLock: () => {
            locked = true
            return true
          },
          hasLock: () => locked,
          releaseLock: () => {
            locked = false
          },
        }),
      },
      PropertiesService: {
        getScriptProperties: () => ({
          getProperty: (key) =>
            key === "ATLAS_WEBHOOK_SECRET" ? secret : key === "ATLAS_SHEET_ID" ? "sheet-id" : null,
        }),
      },
      CacheService: {
        getScriptCache: () => ({
          get: (key) => cache.get(key),
          put: (key, value) => cache.set(key, value),
        }),
      },
      SpreadsheetApp: {
        openById: () => ({ getSheetByName: (name) => (name === "Sugestões" ? sheet : null) }),
        flush() {},
      },
      ContentService: {
        MimeType: { JSON: "json" },
        createTextOutput: (value) => ({
          setMimeType: () => JSON.parse(value),
        }),
      },
    })

    const payload = {
      type: "suggestion",
      title: "Teste roadmap Atlas",
      description: "Teste automatizado para validar o fluxo completo de sugestões.",
      submissionId,
      secret,
    }
    const post = () => doPost({ postData: { contents: JSON.stringify(payload) } })

    assert.deepEqual(post(), { ok: true })
    assert.equal(rows.length, 2)
    assert.equal(rows[1][1], payload.title)
    assert.equal(rows[1][2], payload.description)
    assert.equal(rows[1][3], submissionId)
    assert.equal(locked, false)

    assert.deepEqual(post(), { ok: true })
    assert.equal(rows.length, 2)
  })
})
