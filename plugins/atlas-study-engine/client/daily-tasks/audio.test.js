import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"
import vm from "node:vm"

const source = await readFile(new URL("./audio.js", import.meta.url), "utf8")

function fakeAudioContext({ initialState = "suspended", resumeMode = "resolve" } = {}) {
  const instances = []
  let resolveResume = null

  function parameter() {
    return {
      setValueAtTime() {},
      linearRampToValueAtTime() {},
      exponentialRampToValueAtTime() {},
    }
  }

  class FakeAudioContext {
    constructor() {
      this.state = initialState
      this.currentTime = 10
      this.destination = {}
      this.resumeCalls = 0
      this.oscillators = []
      instances.push(this)
    }

    resume() {
      this.resumeCalls += 1
      if (resumeMode === "reject") return Promise.reject(new Error("autoplay blocked"))
      if (resumeMode === "pending")
        return new Promise((resolve) => {
          resolveResume = () => {
            this.state = "running"
            resolve()
          }
        })
      this.state = "running"
      return Promise.resolve()
    }

    createOscillator() {
      const oscillator = {
        type: "",
        frequency: parameter(),
        starts: [],
        stops: [],
        connect() {},
        start: (when) => oscillator.starts.push(when),
        stop: (when) => oscillator.stops.push(when),
      }
      this.oscillators.push(oscillator)
      return oscillator
    }

    createGain() {
      return { gain: parameter(), connect() {} }
    }
  }

  return { FakeAudioContext, instances, resolveResume: () => resolveResume?.() }
}

async function load({ soundEnabled = true, audio = {}, webkit = false } = {}) {
  const listeners = new Map()
  const warnings = []
  const localStorage = new Map()
  const document = {
    visibilityState: "visible",
    addEventListener(type, listener) {
      const current = listeners.get(type) || []
      current.push(listener)
      listeners.set(type, current)
    },
    dispatch(type) {
      for (const listener of listeners.get(type) || []) listener({ type })
    },
  }
  const browserWindow = {
    AudioContext: webkit ? undefined : audio.FakeAudioContext,
    webkitAudioContext: webkit ? audio.FakeAudioContext : undefined,
    localStorage,
    addEventListener(type, listener) {
      const current = listeners.get(`window:${type}`) || []
      current.push(listener)
      listeners.set(`window:${type}`, current)
    },
  }
  const context = vm.createContext({
    Array,
    Boolean,
    Date,
    Error,
    JSON,
    Map,
    Number,
    Object,
    Promise,
    Set,
    String,
    console: { warn: (...args) => warnings.push(args.join(" ")) },
    document,
    window: browserWindow,
  })
  context.globalThis = context
  context.window.__nutriworkAtlasEngine = {
    dailyTaskStorage: { snapshot: () => ({ settings: { soundEnabled } }) },
  }
  vm.runInContext(source, context, { filename: "daily-tasks/audio.js" })
  return {
    atlas: context.window.__nutriworkAtlasEngine,
    audio,
    browserWindow,
    document,
    listeners,
    warnings,
  }
}

async function flush() {
  await Promise.resolve()
  await Promise.resolve()
}

test("primeira interação desbloqueia uma instância e a conclusão agenda um único batch sonoro", async () => {
  const audio = fakeAudioContext()
  const environment = await load({ audio })
  const sound = environment.atlas.atlasSound

  environment.document.dispatch("pointerdown")
  await flush()
  assert.equal(audio.instances.length, 1)
  assert.equal(audio.instances[0].resumeCalls, 1)
  assert.equal(sound.getDebugState().contextState, "running")

  await sound.playTaskComplete()
  assert.equal(audio.instances.length, 1)
  assert.equal(audio.instances[0].oscillators.length, 2)
  assert.equal(sound.getDebugState().completionPlays, 1)
})

test("conclusão que chega enquanto o unlock está pendente espera o mesmo contexto", async () => {
  const audio = fakeAudioContext({ resumeMode: "pending" })
  const environment = await load({ audio })
  const sound = environment.atlas.atlasSound

  environment.document.dispatch("pointerdown")
  const completion = sound.playTaskComplete()
  await flush()
  assert.equal(audio.instances.length, 1)
  assert.equal(audio.instances[0].oscillators.length, 0)

  audio.resolveResume()
  assert.equal(await completion, true)
  assert.equal(audio.instances.length, 1)
  assert.equal(audio.instances[0].oscillators.length, 2)
})

test("botão de som ligado produz confirmação curta e desligado não produz áudio", async () => {
  const audio = fakeAudioContext()
  const environment = await load({ audio, soundEnabled: false })
  const sound = environment.atlas.atlasSound

  environment.document.dispatch("pointerdown")
  await flush()
  assert.equal(audio.instances.length, 0)

  sound.setEnabled(true)
  await sound.unlock({ confirmation: true })
  assert.equal(audio.instances.length, 1)
  assert.equal(audio.instances[0].oscillators.length, 1)

  sound.setEnabled(false)
  await sound.playTaskComplete()
  assert.equal(audio.instances[0].oscillators.length, 1)
  assert.equal(sound.getDebugState().completionRequests, 1)
})

test("rejeição de resume fica observável e não cria novo contexto na conclusão", async () => {
  const audio = fakeAudioContext({ resumeMode: "reject" })
  const environment = await load({ audio })
  const sound = environment.atlas.atlasSound

  environment.document.dispatch("pointerdown")
  assert.equal(await sound.unlock(), false)
  assert.equal(await sound.playTaskComplete(), false)
  assert.equal(audio.instances.length, 1)
  assert.equal(audio.instances[0].oscillators.length, 0)
  assert.ok(
    ["resume-rejected", "completion-not-running"].includes(sound.getDebugState().lastFailure.stage),
  )
  assert.ok(environment.warnings.some((warning) => warning.includes("resume-rejected")))
})

test("retomada acontece na próxima interação após visibilitychange e init é idempotente", async () => {
  const audio = fakeAudioContext()
  const environment = await load({ audio })
  const sound = environment.atlas.atlasSound

  sound.init()
  assert.equal(environment.listeners.get("pointerdown").length, 1)
  environment.document.dispatch("pointerdown")
  await flush()
  await sound.unlock()
  audio.instances[0].state = "suspended"
  environment.document.visibilityState = "hidden"
  environment.document.dispatch("visibilitychange")
  environment.document.visibilityState = "visible"
  environment.document.dispatch("visibilitychange")
  assert.equal(audio.instances[0].resumeCalls, 1)

  environment.document.dispatch("pointerdown")
  await flush()
  assert.equal(audio.instances.length, 1)
  assert.equal(audio.instances[0].resumeCalls, 2)
  assert.equal(sound.getDebugState().contextState, "running")
})

test("usa webkitAudioContext quando AudioContext padrão não existe", async () => {
  const audio = fakeAudioContext()
  const environment = await load({ audio, webkit: true })
  environment.document.dispatch("pointerdown")
  await flush()
  assert.equal(audio.instances.length, 1)
  assert.equal(environment.atlas.atlasSound.getDebugState().contextState, "running")
})
