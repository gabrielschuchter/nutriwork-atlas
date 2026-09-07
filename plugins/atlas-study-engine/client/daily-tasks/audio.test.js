import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"
import vm from "node:vm"

const source = await readFile(new URL("./audio.js", import.meta.url), "utf8")

function fakeHowler() {
  const instances = []
  const Howler = { autoUnlock: false }

  class FakeHowl {
    constructor(options) {
      this.options = options
      this.handlers = new Map()
      this.onceHandlers = new Map()
      this.playCalls = []
      this.stopCalls = 0
      this.nextId = 1000
      instances.push(this)
    }

    on(event, handler) {
      const handlers = this.handlers.get(event) || []
      handlers.push(handler)
      this.handlers.set(event, handlers)
      return this
    }

    once(event, handler, id) {
      const handlers = this.onceHandlers.get(event) || []
      handlers.push({ handler, id })
      this.onceHandlers.set(event, handlers)
      return this
    }

    play(id) {
      const nextId = id || this.nextId++
      this.playCalls.push(nextId)
      return nextId
    }

    stop() {
      this.stopCalls += 1
      return this
    }

    state() {
      return "loaded"
    }

    trigger(event, id, message) {
      for (const handler of this.handlers.get(event) || []) handler(id, message)
      const remaining = []
      for (const entry of this.onceHandlers.get(event) || []) {
        if (!entry.id || entry.id === id) entry.handler(id, message)
        else remaining.push(entry)
      }
      this.onceHandlers.set(event, remaining)
    }
  }

  return { Howl: FakeHowl, Howler, instances }
}

async function load({ soundEnabled = true, howler = fakeHowler() } = {}) {
  let storedSoundEnabled = soundEnabled
  const warnings = []
  const browserWindow = {}
  const context = vm.createContext({
    Array,
    Boolean,
    Date,
    Error,
    Map,
    Number,
    Object,
    Promise,
    Set,
    String,
    console: { warn: (...args) => warnings.push(args.join(" ")) },
    window: browserWindow,
  })
  context.globalThis = context
  context.__nutriworkHowl = howler.Howl
  context.__nutriworkHowler = howler.Howler
  browserWindow.__nutriworkHowl = howler.Howl
  browserWindow.__nutriworkHowler = howler.Howler
  context.window.__nutriworkAtlasEngine = {
    dailyTaskStorage: { snapshot: () => ({ settings: { soundEnabled: storedSoundEnabled } }) },
    dailyTaskEngine: {
      setSoundEnabled(value) {
        storedSoundEnabled = Boolean(value)
      },
    },
  }
  vm.runInContext(source, context, { filename: "daily-tasks/audio.js" })
  return {
    atlas: context.window.__nutriworkAtlasEngine,
    howler,
    warnings,
    getStoredSoundEnabled: () => storedSoundEnabled,
  }
}

test("cria uma única Howl com o asset local e arma autoUnlock", async () => {
  const howler = fakeHowler()
  const environment = await load({ howler })
  const sound = environment.atlas.atlasSound

  assert.equal(howler.instances.length, 1)
  assert.equal(howler.instances[0].options.src[0], "/static/task-complete.mp3")
  assert.equal(howler.instances[0].options.preload, true)
  assert.equal(howler.instances[0].options.volume, 0.35)
  assert.equal(howler.instances[0].options.html5, true)
  assert.equal(howler.Howler.autoUnlock, true)
  sound.init()
  assert.equal(howler.instances.length, 1)
  assert.equal(sound.getDebugState().autoUnlock, true)
})

test("a conclusão usa a mesma instância e conta reprodução somente no evento play", async () => {
  const howler = fakeHowler()
  const environment = await load({ howler })
  const sound = environment.atlas.atlasSound
  const instance = howler.instances[0]

  assert.equal(await sound.playTaskComplete(), true)
  assert.deepEqual(instance.playCalls, [1000])
  assert.equal(sound.getDebugState().completionPlays, 0)
  instance.trigger("play", 1000)
  assert.equal(sound.getDebugState().completionPlays, 1)
  await sound.playTaskComplete()
  assert.equal(howler.instances.length, 1)
})

test("playerror aguarda unlock e repete a reprodução com o mesmo id", async () => {
  const howler = fakeHowler()
  const environment = await load({ howler })
  const sound = environment.atlas.atlasSound
  const instance = howler.instances[0]

  await sound.playTaskComplete()
  instance.trigger("playerror", 1000, "autoplay blocked")
  assert.equal(sound.getDebugState().playErrors, 1)
  instance.trigger("unlock")
  assert.deepEqual(instance.playCalls, [1000, 1000])
  assert.equal(sound.getDebugState().unlockRetries, 1)
  instance.trigger("play", 1000)
  assert.equal(sound.getDebugState().completionPlays, 1)
})

test("som desligado não cria nem reproduz áudio; ligar dá confirmação curta na mesma Howl", async () => {
  const howler = fakeHowler()
  const environment = await load({ soundEnabled: false, howler })
  const sound = environment.atlas.atlasSound

  assert.equal(await sound.playTaskComplete(), false)
  assert.equal(howler.instances.length, 0)
  assert.equal(await sound.unlock({ confirmation: true }), false)
  sound.setEnabled(true)
  assert.equal(await sound.unlock({ confirmation: true }), true)
  assert.equal(howler.instances.length, 1)
  const instance = howler.instances[0]
  instance.trigger("play", 1000)
  assert.equal(sound.getDebugState().confirmationPlays, 1)
  assert.equal(environment.getStoredSoundEnabled(), true)
  sound.setEnabled(false)
  assert.equal(environment.getStoredSoundEnabled(), false)
  await sound.playTaskComplete()
  assert.deepEqual(instance.playCalls, [1000])
  assert.equal(instance.stopCalls, 1)
})

test("ausência de Howler fica observável sem quebrar o Atlas", async () => {
  const environment = await load({ howler: { Howl: undefined, Howler: undefined } })
  environment.atlas.atlasSound.init()
  assert.equal(await environment.atlas.atlasSound.playTaskComplete(), false)
  assert.equal(environment.atlas.atlasSound.getDebugState().soundCreated, false)
  assert.ok(environment.warnings.some((warning) => warning.includes("howl-unavailable")))
})
