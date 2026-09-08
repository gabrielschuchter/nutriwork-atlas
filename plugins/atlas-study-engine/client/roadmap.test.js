import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"
import vm from "node:vm"

const source = await readFile(new URL("./roadmap.js", import.meta.url), "utf8")

class FakeElement {
  constructor(tagName, id = "") {
    this.tagName = tagName.toUpperCase()
    this.id = id
    this.value = ""
    this.textContent = ""
    this.hidden = false
    this.disabled = false
    this.dataset = {}
    this.attributes = {}
    this.classList = {
      values: new Set(),
      add: (...names) => names.forEach((name) => this.classList.values.add(name)),
      remove: (...names) => names.forEach((name) => this.classList.values.delete(name)),
      contains: (name) => this.classList.values.has(name),
    }
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value)
  }

  removeAttribute(name) {
    delete this.attributes[name]
  }

  getAttribute(name) {
    return this.attributes[name] ?? null
  }

  focus() {
    this.focused = true
  }

  querySelector(selector) {
    if (this.id === "atlas-roadmap-suggestion-form" && selector === 'button[type="submit"]') {
      return this.submitButton
    }
    if (this.id === "atlas-roadmap-toast" && selector === "[data-atlas-roadmap-toast-title]") {
      return this.toastTitle
    }
    if (this.id === "atlas-roadmap-toast" && selector === "[data-atlas-roadmap-toast-copy]") {
      return this.toastCopy
    }
    return null
  }

  querySelectorAll() {
    return []
  }

  matches(selector) {
    return selector === "#atlas-roadmap-suggestion-form" && this.id === selector.slice(1)
  }

  reset() {
    this.resetCalled = true
    this.title.value = ""
    this.description.value = ""
  }
}

class FakeForm extends FakeElement {
  constructor() {
    super("form", "atlas-roadmap-suggestion-form")
    this.title = new FakeElement("input", "atlas-roadmap-suggestion-title-input")
    this.description = new FakeElement("textarea", "atlas-roadmap-suggestion-description")
    this.submitButton = new FakeElement("button")
  }
}

function createEnvironment() {
  const listeners = new Map()
  const fetchCalls = []
  const form = new FakeForm()
  const status = new FakeElement("p", "atlas-roadmap-suggestion-status")
  const overlay = new FakeElement("div", "atlas-roadmap-suggestion")
  const toast = new FakeElement("div", "atlas-roadmap-toast")
  toast.toastTitle = new FakeElement("strong")
  toast.toastCopy = new FakeElement("span")
  const elements = new Map([
    [form.id, form],
    [form.title.id, form.title],
    [form.description.id, form.description],
    [status.id, status],
    [overlay.id, overlay],
    [toast.id, toast],
  ])
  const document = {
    documentElement: new FakeElement("html"),
    activeElement: null,
    addEventListener(type, listener) {
      const current = listeners.get(type) || []
      current.push(listener)
      listeners.set(type, current)
    },
    getElementById(id) {
      return elements.get(id) || null
    },
    querySelectorAll() {
      return []
    },
  }
  const localStorage = {
    getItem() {
      return null
    },
    setItem() {
      throw new DOMException("The operation is insecure.", "SecurityError")
    },
    removeItem() {},
  }
  const context = vm.createContext({
    AbortController: class {
      signal = {}
      abort() {
        this.signal.aborted = true
      }
    },
    DOMException,
    Element: FakeElement,
    HTMLFormElement: FakeForm,
    JSON,
    Promise,
    console,
    document,
    fetch: async (input, init) => {
      fetchCalls.push({ input, init })
      return { ok: true, status: 200, json: async () => ({ ok: true }) }
    },
    window: {
      crypto: { randomUUID: () => "00000000-0000-4000-8000-000000000001" },
      localStorage,
      requestAnimationFrame(callback) {
        callback()
      },
      setTimeout() {
        return 1
      },
      clearTimeout() {},
    },
  })
  context.globalThis = context
  return { context, elements: { form, status, toast }, fetchCalls, listeners }
}

test("envia a sugestão atual mesmo quando o localStorage recusa a gravação", async () => {
  const environment = createEnvironment()
  vm.runInContext(source, environment.context, { filename: "roadmap.js" })

  environment.elements.form.title.value = "Título sem armazenamento local"
  environment.elements.form.description.value = "A request deve continuar sendo feita."
  const submit = environment.listeners.get("submit")[0]
  let prevented = false
  submit({
    target: environment.elements.form,
    preventDefault() {
      prevented = true
    },
  })
  await new Promise((resolve) => setImmediate(resolve))
  await new Promise((resolve) => setImmediate(resolve))

  assert.equal(prevented, true)
  assert.equal(environment.fetchCalls.length, 1)
  assert.equal(environment.fetchCalls[0].input, "/api/atlas-suggestions")
  assert.deepEqual(JSON.parse(environment.fetchCalls[0].init.body), {
    title: "Título sem armazenamento local",
    description: "A request deve continuar sendo feita.",
    submissionId: "00000000-0000-4000-8000-000000000001",
  })
  assert.equal(environment.elements.form.resetCalled, true)
  assert.equal(environment.elements.toast.toastTitle.textContent, "Sugestão recebida")
  assert.equal(environment.elements.form.submitButton.disabled, false)
})
