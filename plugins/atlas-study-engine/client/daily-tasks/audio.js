;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  if (atlas.atlasSound?.runtimeVersion === 2) return

  const soundOptions = {
    src: ["/static/task-complete.mp3"],
    preload: true,
    volume: 0.35,
    html5: true,
  }
  let taskCompleteSound = null
  let enabledOverride = null
  let listenersInstalled = false
  let lastFailure = null
  let lastFailureKey = ""
  const pendingKinds = new Map()

  const metrics = {
    soundCreations: 0,
    unlockAttempts: 0,
    unlockEvents: 0,
    confirmationRequests: 0,
    confirmationPlays: 0,
    completionRequests: 0,
    completionPlays: 0,
    playErrors: 0,
    unlockRetries: 0,
    lastEvent: "ready",
  }

  function howlerConstructor() {
    return globalThis.__nutriworkHowl || window.__nutriworkHowl
  }

  function howlerGlobal() {
    return globalThis.__nutriworkHowler || window.__nutriworkHowler
  }

  function enabledFromStorage() {
    const stored = atlas.dailyTaskStorage?.snapshot?.()
    return stored?.settings?.soundEnabled !== false
  }

  function isEnabled() {
    return enabledOverride === null ? enabledFromStorage() : enabledOverride
  }

  function failureMessage(error) {
    if (error instanceof Error && error.message) return error.message
    return String(error || "falha desconhecida")
  }

  function reportFailure(stage, error) {
    const message = failureMessage(error)
    const key = `${stage}:${message}`
    lastFailure = { stage, message, at: new Date().toISOString() }
    metrics.lastEvent = `failure:${stage}`
    if (key === lastFailureKey) return
    lastFailureKey = key
    if (typeof console?.warn === "function") console.warn(`[Atlas sound] ${stage}: ${message}`)
  }

  function onPlay(id) {
    const kind = pendingKinds.get(id)
    if (!kind) return
    pendingKinds.delete(id)
    if (kind === "confirmation") metrics.confirmationPlays += 1
    if (kind === "completion") metrics.completionPlays += 1
    metrics.lastEvent = `${kind}-played`
  }

  function createSound() {
    if (taskCompleteSound) return taskCompleteSound
    const Howl = howlerConstructor()
    if (typeof Howl !== "function") {
      reportFailure("howl-unavailable", "Howler não foi carregado")
      return null
    }
    try {
      taskCompleteSound = new Howl(soundOptions)
      taskCompleteSound.on?.("play", onPlay)
      taskCompleteSound.on?.("loaderror", (_id, error) => reportFailure("load", error))
      metrics.soundCreations += 1
      metrics.lastEvent = "sound-created"
      return taskCompleteSound
    } catch (error) {
      reportFailure("sound-create", error)
      return null
    }
  }

  function play(kind) {
    if (!isEnabled()) return false
    const sound = createSound()
    if (!sound) return false
    let id
    try {
      id = sound.play()
      if (!id) {
        reportFailure("play", "Howler não retornou um id de reprodução")
        return false
      }
      pendingKinds.set(id, kind)
      sound.once?.(
        "playerror",
        () => {
          pendingKinds.delete(id)
          metrics.playErrors += 1
          metrics.lastEvent = "play-error"
          sound.once?.("unlock", () => {
            if (!isEnabled()) return
            metrics.unlockRetries += 1
            pendingKinds.set(id, kind)
            try {
              sound.play(id)
            } catch (error) {
              pendingKinds.delete(id)
              reportFailure("unlock-retry", error)
            }
          })
        },
        id,
      )
      metrics.lastEvent = `${kind}-requested`
      return true
    } catch (error) {
      reportFailure("play", error)
      return false
    }
  }

  function unlock({ confirmation = false } = {}) {
    if (!isEnabled()) {
      metrics.lastEvent = "unlock-skipped-disabled"
      return Promise.resolve(false)
    }
    metrics.unlockAttempts += 1
    const sound = createSound()
    if (!sound) return Promise.resolve(false)
    metrics.unlockEvents += 1
    metrics.lastEvent = "unlock-armed"
    if (!confirmation) return Promise.resolve(true)
    metrics.confirmationRequests += 1
    return Promise.resolve(play("confirmation"))
  }

  function setEnabled(value) {
    enabledOverride = Boolean(value)
    atlas.dailyTaskEngine?.setSoundEnabled?.(enabledOverride)
    if (!enabledOverride) {
      taskCompleteSound?.stop?.()
      pendingKinds.clear()
    }
    metrics.lastEvent = enabledOverride ? "enabled" : "disabled"
    return enabledOverride
  }

  function init() {
    if (listenersInstalled) return
    listenersInstalled = true
    const Howler = howlerGlobal()
    if (Howler) Howler.autoUnlock = true
    if (isEnabled()) createSound()
  }

  function getDebugState() {
    return {
      ...metrics,
      enabled: isEnabled(),
      soundCreated: Boolean(taskCompleteSound),
      soundState: taskCompleteSound?.state?.() || "unavailable",
      autoUnlock: Boolean(howlerGlobal()?.autoUnlock),
      lastFailure: lastFailure ? { ...lastFailure } : null,
    }
  }

  const api = {
    runtimeVersion: 2,
    init,
    unlock,
    playTaskComplete: () => {
      metrics.completionRequests += 1
      return Promise.resolve(play("completion"))
    },
    setEnabled,
    isEnabled,
    getDebugState,
  }
  atlas.atlasSound = api
  api.init()
})()
