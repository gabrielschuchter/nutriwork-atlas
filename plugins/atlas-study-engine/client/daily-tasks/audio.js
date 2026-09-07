;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  if (atlas.atlasSound?.runtimeVersion === 1) return

  let audioContext = null
  let unlockPromise = null
  let enabledOverride = null
  let lifecycleState = "ready"
  let lastFailure = null
  let lastFailureKey = ""
  let listenersInstalled = false

  const metrics = {
    contextCreations: 0,
    unlockAttempts: 0,
    unlockSuccesses: 0,
    confirmationRequests: 0,
    confirmationPlays: 0,
    completionRequests: 0,
    completionPlays: 0,
    completionFailures: 0,
    lastEvent: "ready",
  }

  function contextState(context = audioContext) {
    return String(context?.state || "unavailable")
  }

  function enabledFromStorage() {
    const stored = atlas.dailyTaskStorage?.snapshot?.()
    return stored?.settings?.soundEnabled !== false
  }

  function isEnabled() {
    return enabledOverride === null ? enabledFromStorage() : enabledOverride
  }

  function setEnabled(value) {
    enabledOverride = Boolean(value)
    atlas.dailyTaskEngine?.setSoundEnabled?.(enabledOverride)
    metrics.lastEvent = enabledOverride ? "enabled" : "disabled"
    return enabledOverride
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

  function contextConstructor() {
    const candidate = window.AudioContext || window.webkitAudioContext
    return typeof candidate === "function" ? candidate : null
  }

  function getContext() {
    const AudioContext = contextConstructor()
    if (!AudioContext) {
      reportFailure("context-unavailable", "Web Audio API indisponível")
      return null
    }
    if (audioContext && contextState() !== "closed") return audioContext
    try {
      audioContext = new AudioContext()
      metrics.contextCreations += 1
      metrics.lastEvent = "context-created"
      return audioContext
    } catch (error) {
      audioContext = null
      reportFailure("context-create", error)
      return null
    }
  }

  function resumeContext(context) {
    metrics.unlockAttempts += 1
    if (!context || typeof context.resume !== "function") {
      reportFailure("resume-unavailable", "AudioContext não pode ser retomado")
      return Promise.resolve(false)
    }
    let resumeResult
    try {
      // This call is made synchronously by unlock(), which is invoked from a
      // real pointer/touch/click/keydown handler whenever possible.
      resumeResult = context.resume()
    } catch (error) {
      reportFailure("resume-throw", error)
      return Promise.resolve(false)
    }
    return Promise.resolve(resumeResult)
      .then(() => {
        if (contextState(context) !== "running") {
          reportFailure("resume-state", `estado após resume: ${contextState(context)}`)
          return false
        }
        metrics.unlockSuccesses += 1
        metrics.lastEvent = "unlocked"
        lifecycleState = "unlocked"
        return true
      })
      .catch((error) => {
        reportFailure("resume-rejected", error)
        return false
      })
  }

  function scheduleTone(context, type) {
    if (!context || contextState(context) !== "running") {
      reportFailure(`${type}-not-running`, `estado atual: ${contextState(context)}`)
      if (type === "completion") metrics.completionFailures += 1
      return false
    }

    const notes =
      type === "confirmation"
        ? [{ frequency: 520, offset: 0, duration: 0.09, amplitude: 0.028 }]
        : [
            { frequency: 660, offset: 0, duration: 0.17, amplitude: 0.045 },
            { frequency: 880, offset: 0.07, duration: 0.14, amplitude: 0.034 },
          ]

    try {
      const now = context.currentTime
      for (const note of notes) {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        const start = now + note.offset
        const end = start + note.duration
        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(note.frequency, start)
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.linearRampToValueAtTime(note.amplitude, start + 0.012)
        gain.gain.exponentialRampToValueAtTime(0.0001, end)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start(start)
        oscillator.stop(end + 0.005)
      }
      if (type === "confirmation") metrics.confirmationPlays += 1
      if (type === "completion") metrics.completionPlays += 1
      metrics.lastEvent = `${type}-scheduled`
      return true
    } catch (error) {
      if (type === "completion") metrics.completionFailures += 1
      reportFailure(`${type}-schedule`, error)
      return false
    }
  }

  function unlock({ confirmation = false } = {}) {
    if (!isEnabled()) {
      metrics.lastEvent = "unlock-skipped-disabled"
      return Promise.resolve(false)
    }

    if (unlockPromise) {
      return unlockPromise.then((unlocked) => {
        if (unlocked && confirmation && isEnabled()) {
          metrics.confirmationRequests += 1
          scheduleTone(audioContext, "confirmation")
        }
        return unlocked
      })
    }

    const context = getContext()
    if (!context) return Promise.resolve(false)
    const unlocked =
      contextState(context) === "running" ? Promise.resolve(true) : resumeContext(context)
    const pending = unlocked
      .then((result) => {
        if (result && confirmation && isEnabled()) {
          metrics.confirmationRequests += 1
          scheduleTone(context, "confirmation")
        }
        return result
      })
      .catch((error) => {
        reportFailure("unlock", error)
        return false
      })
    unlockPromise = pending
    pending.then(() => {
      if (unlockPromise === pending) unlockPromise = null
    })
    return pending
  }

  function playTaskComplete() {
    metrics.completionRequests += 1
    if (!isEnabled()) {
      metrics.lastEvent = "completion-skipped-disabled"
      return Promise.resolve(false)
    }

    const play = () => {
      if (!isEnabled()) return false
      if (!audioContext) {
        metrics.completionFailures += 1
        reportFailure("completion-no-context", "o AudioContext não foi desbloqueado")
        return false
      }
      return scheduleTone(audioContext, "completion")
    }

    // A route transition or async note load may finish after the gesture. If
    // resume is still pending, wait for the already-started unlock instead of
    // creating another context or attempting a late resume.
    if (unlockPromise) return unlockPromise.then((unlocked) => (unlocked ? play() : false))
    return Promise.resolve(play())
  }

  function markLifecycle(eventName) {
    lifecycleState = eventName
    metrics.lastEvent = eventName
  }

  function handleUserGesture() {
    if (isEnabled()) void unlock()
  }

  function installListeners() {
    if (listenersInstalled || typeof document?.addEventListener !== "function") return
    listenersInstalled = true
    document.addEventListener("pointerdown", handleUserGesture, true)
    document.addEventListener("touchstart", handleUserGesture, true)
    document.addEventListener("click", handleUserGesture, true)
    document.addEventListener("keydown", handleUserGesture, true)
    document.addEventListener("visibilitychange", () => {
      markLifecycle(document.visibilityState === "visible" ? "visible" : "hidden")
    })
    if (typeof window?.addEventListener === "function") {
      window.addEventListener("pageshow", () => markLifecycle("pageshow"))
      window.addEventListener("focus", () => markLifecycle("focus"))
    }
  }

  function getDebugState() {
    return {
      ...metrics,
      enabled: isEnabled(),
      contextState: contextState(),
      lifecycleState,
      unlockPending: Boolean(unlockPromise),
      lastFailure: lastFailure ? { ...lastFailure } : null,
    }
  }

  const api = {
    runtimeVersion: 1,
    init: installListeners,
    unlock,
    playTaskComplete,
    setEnabled,
    isEnabled,
    getDebugState,
  }
  atlas.atlasSound = api
  api.init()
})()
