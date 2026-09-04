import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { createHash, webcrypto } from "node:crypto"
import vm from "node:vm"
import { createAccessRuntime } from "./access-runtime.js"

const identityKey = "nutriwork-atlas-identification-v1"
const accessKey = "test-password-session"
const testPassword = "local-test-fixture-only"
const hash = createHash("sha256").update(testPassword).digest("hex")
const identity = JSON.stringify({ version: 1, email: "qa@example.com" })

function browser({ saved = {}, denyStorage = false, fail = false } = {}) {
  const storage = new Map(Object.entries(saved))
  const handlers = {}
  const elements = new Map()
  const calls = []
  let failure = fail
  class Element {
    constructor(id) {
      this.id = id
      this.value = ""
      this.dataset = {}
      this.validity = { valid: true }
      this.attrs = {}
    }
    setAttribute(key, value) {
      this.attrs[key] = value
    }
    removeAttribute(key) {
      delete this.attrs[key]
    }
    focus() {
      this.focused = true
    }
    select() {}
    closest(selector) {
      return selector.split(", ").includes("#" + this.id) ? this : null
    }
  }
  class Form extends Element {}
  class Input extends Element {}
  const document = {
    documentElement: { dataset: { atlasAccess: "locked" } },
    getElementById(id) {
      if (!elements.has(id))
        elements.set(
          id,
          id.endsWith("-form")
            ? new Form(id)
            : /-(email|password)$/.test(id)
              ? new Input(id)
              : new Element(id),
        )
      return elements.get(id)
    },
    addEventListener(name, fn) {
      handlers[name] = fn
    },
    dispatchEvent() {},
  }
  const localStorage = {
    getItem(key) {
      if (denyStorage) throw new Error("denied")
      return storage.get(key) || null
    },
    setItem(key, value) {
      if (denyStorage) throw new Error("denied")
      storage.set(key, value)
    },
    removeItem(key) {
      if (denyStorage) throw new Error("denied")
      storage.delete(key)
    },
  }
  vm.runInNewContext(createAccessRuntime(hash, accessKey), {
    document,
    window: {
      localStorage,
      requestAnimationFrame: (fn) => fn(),
      setTimeout: (fn) => setTimeout(fn, 0),
    },
    navigator: { maxTouchPoints: 0 },
    Element,
    HTMLFormElement: Form,
    HTMLInputElement: Input,
    TextEncoder,
    crypto: webcrypto,
    AbortSignal,
    CustomEvent: class {},
    fetch: async (_, options) => {
      calls.push(JSON.parse(options.body))
      return {
        ok: !failure,
        status: failure ? 503 : 200,
        json: async () =>
          failure ? { ok: false } : { ok: true, email: JSON.parse(options.body).email },
      }
    },
  })
  return {
    storage,
    calls,
    elements,
    root: document.documentElement,
    get: (id) => document.getElementById(id),
    submit: (id) => handlers.submit({ target: document.getElementById(id), preventDefault() {} }),
    click: (id) => handlers.click({ target: document.getElementById(id) }),
    nav: () => handlers.nav(),
    recover: () => (failure = false),
    settle: () => new Promise((resolve) => setTimeout(resolve, 15)),
  }
}

describe("identificação → senha global, sem alterar o mecanismo de hash", () => {
  it("vazio e inválido não chamam servidor; sucesso persiste e só libera após senha correta", async () => {
    const page = browser()
    await page.submit("atlas-identification-form")
    assert.match(page.get("atlas-identification-status").textContent, /Informe seu e-mail/)
    page.get("atlas-identification-email").value = "invalido"
    await page.submit("atlas-identification-form")
    assert.equal(page.calls.length, 0)
    page.get("atlas-identification-email").value = "QA@EXAMPLE.COM"
    await page.submit("atlas-identification-form")
    assert.equal(page.calls.length, 1)
    assert.equal(page.storage.get(identityKey), identity)
    assert.equal(page.get("atlas-identification-form").hidden, true)
    assert.equal(page.get("atlas-access-form").hidden, false)
    assert.equal(page.root.dataset.atlasAccess, "locked")
    page.get("atlas-access-password").value = "errada"
    await page.submit("atlas-access-form")
    assert.match(page.get("atlas-access-status").textContent, /Senha incorreta/)
    page.get("atlas-access-password").value = testPassword
    await page.submit("atlas-access-form")
    assert.equal(page.root.dataset.atlasAccess, "unlocked")
    assert.equal(page.storage.get(accessKey), hash)
    assert.equal(page.get("atlas-access-password").value, "")
    assert.equal(JSON.stringify(page.calls).includes(testPassword), false)
    page.nav()
    assert.equal(page.calls.length, 1)
    page.click("atlas-access-logout")
    assert.equal(page.root.dataset.atlasAccess, "locked")
    assert.equal(page.storage.get(identityKey), identity)
  })
  it("recorrente não solicita e-mail e registra visita antes de restaurar sessão existente", async () => {
    const page = browser({ saved: { [identityKey]: identity, [accessKey]: hash } })
    assert.equal(page.get("atlas-identification-form").hidden, true)
    assert.equal(page.get("atlas-access-submit").disabled, true)
    assert.equal(page.root.dataset.atlasAccess, "locked")
    await page.settle()
    assert.equal(page.root.dataset.atlasAccess, "unlocked")
    assert.equal(page.calls.length, 1)
    page.nav()
    assert.equal(page.calls.length, 1)
  })
  it("registro inválido no dispositivo exige identificação", () => {
    const page = browser({
      saved: { [identityKey]: '{"version":1,"email":"ruim"}', [accessKey]: hash },
    })
    assert.equal(page.get("atlas-identification-form").hidden, false)
    assert.equal(page.root.dataset.atlasAccess, "locked")
    assert.equal(page.calls.length, 0)
  })
  it("erro não persiste nem avança; nova tentativa reutiliza visitId", async () => {
    const page = browser({ fail: true })
    page.get("atlas-identification-email").value = "qa@example.com"
    await page.submit("atlas-identification-form")
    assert.equal(page.root.dataset.atlasAccess, "locked")
    assert.equal(page.storage.has(identityKey), false)
    assert.match(page.get("atlas-identification-status").textContent, /Tente novamente/)
    page.recover()
    await page.submit("atlas-identification-form")
    assert.equal(page.calls[0].visitId, page.calls[1].visitId)
    assert.equal(page.storage.get(identityKey), identity)
  })
  it("erro no recorrente bloqueia inclusive sessão válida até tentar novamente", async () => {
    const page = browser({ fail: true, saved: { [identityKey]: identity, [accessKey]: hash } })
    await page.settle()
    assert.equal(page.root.dataset.atlasAccess, "locked")
    assert.equal(page.get("atlas-identification-retry").hidden, false)
    page.recover()
    page.click("atlas-identification-retry")
    await page.settle()
    assert.equal(page.root.dataset.atlasAccess, "unlocked")
    assert.equal(page.calls[0].visitId, page.calls[1].visitId)
  })
  it("storage indisponível não impede acesso nesta página nem finge persistência", async () => {
    const page = browser({ denyStorage: true })
    page.get("atlas-identification-email").value = "qa@example.com"
    await page.submit("atlas-identification-form")
    page.get("atlas-access-password").value = testPassword
    await page.submit("atlas-access-form")
    assert.equal(page.root.dataset.atlasAccess, "unlocked")
    assert.equal(page.storage.size, 0)
  })
  it("troca de e-mail limpa identificação e exige senha novamente", async () => {
    const page = browser({ saved: { [identityKey]: identity } })
    await page.settle()
    page.click("atlas-identification-change")
    assert.equal(page.storage.has(identityKey), false)
    assert.equal(page.get("atlas-identification-form").hidden, false)
    assert.equal(page.root.dataset.atlasAccess, "locked")
  })
})
