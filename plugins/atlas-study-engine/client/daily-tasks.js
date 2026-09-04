;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  if (atlas.dailyTasks?.runtimeVersion === 1) return

  let opener = null
  let toastTimer = 0

  function panel() {
    return document.getElementById("atlas-daily-task-panel")
  }

  function elements() {
    const view = panel()
    return {
      view,
      title: document.getElementById("atlas-daily-task-title"),
      description: document.getElementById("atlas-daily-task-description"),
      progress: document.getElementById("atlas-daily-task-progress"),
      progressBar: document.getElementById("atlas-daily-task-progress-bar"),
      state: document.getElementById("atlas-daily-task-state"),
      streak: document.getElementById("atlas-daily-task-streak"),
      sound: document.querySelector('[data-atlas-daily-action="toggle-sound"]'),
      close: document.querySelector('[data-atlas-daily-action="close"]'),
      toast: document.getElementById("atlas-daily-task-toast"),
      toastTitle: document.querySelector("[data-atlas-daily-toast-title]"),
      toastCopy: document.querySelector("[data-atlas-daily-toast-copy]"),
    }
  }

  function concepts() {
    return atlas.data?.concepts?.() || []
  }

  function currentSnapshot() {
    return atlas.dailyTaskEngine?.snapshot(new Date(), concepts())
  }

  function render() {
    const current = currentSnapshot()
    const task = current?.daily?.task
    if (!task) return
    const item = elements()
    const count = Number(current.progress?.count || 0)
    const target = Number(task.target || 1)
    if (item.title) item.title.textContent = task.title || "Tarefa do dia"
    if (item.description)
      item.description.textContent = task.description || "Explore o Atlas por alguns minutos."
    if (item.progress) item.progress.textContent = `${Math.min(count, target)} / ${target}`
    if (item.progressBar)
      item.progressBar.style.setProperty(
        "--atlas-daily-progress",
        String(Math.min(count, target) / target),
      )
    if (item.state) {
      item.state.textContent = current.completed ? "Concluída" : "Em andamento"
      item.state.dataset.state = current.completed ? "complete" : "active"
    }
    if (item.streak)
      item.streak.textContent = `Sequência: ${current.streak?.visibleCount || 0} dias`
    if (item.sound) {
      const enabled = current.soundEnabled !== false
      item.sound.textContent = `Som de conclusão: ${enabled ? "ligado" : "desligado"}`
      item.sound.setAttribute("aria-pressed", String(enabled))
    }
    document.documentElement.dataset.atlasDailyCompleted = String(Boolean(current.completed))
  }

  function syncDay() {
    if (!atlas.data?.index && !concepts().length) return
    atlas.dailyTaskEngine?.ensureDay(new Date(), concepts())
    render()
  }

  function syncModalLock() {
    const open = Boolean(panel() && !panel().hidden && panel().classList.contains("is-open"))
    const otherOpen = [
      "atlas-search-sheet",
      "atlas-area-sheet",
      "atlas-mobile-menu",
      "atlas-onboarding",
      "atlas-help",
      "atlas-report",
    ].some((id) => {
      const overlay = document.getElementById(id)
      return Boolean(overlay && !overlay.hidden && overlay.classList.contains("is-open"))
    })
    document.documentElement.classList.toggle("atlas-modal-open", open || otherOpen)
  }

  function open() {
    const item = elements()
    if (!item.view) return
    syncDay()
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    item.view.hidden = false
    item.view.setAttribute("aria-hidden", "false")
    document.documentElement.classList.add("atlas-modal-open")
    window.requestAnimationFrame(() => {
      item.view.classList.add("is-open")
      item.close?.focus()
    })
  }

  function close(restoreFocus = true) {
    const item = elements()
    if (!item.view) return
    item.view.classList.remove("is-open")
    item.view.setAttribute("aria-hidden", "true")
    syncModalLock()
    window.setTimeout(() => {
      if (!item.view.classList.contains("is-open")) item.view.hidden = true
    }, 220)
    if (restoreFocus) window.requestAnimationFrame(() => opener?.focus())
    opener = null
  }

  function playCompletionSound() {
    const current = currentSnapshot()
    if (current?.soundEnabled === false) return
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return
      const context = new AudioContext()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const now = context.currentTime
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(660, now)
      oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.12)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.026, now + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(now)
      oscillator.stop(now + 0.17)
      oscillator.addEventListener("ended", () => context.close().catch(() => {}), { once: true })
    } catch {
      // Audio is a progressive enhancement and never affects completion.
    }
  }

  function showToast() {
    const item = elements()
    if (!item.toast) return
    if (toastTimer) window.clearTimeout(toastTimer)
    item.toast.hidden = false
    item.toast.dataset.state = "complete"
    if (item.toastTitle) item.toastTitle.textContent = "✓ Tarefa concluída"
    if (item.toastCopy) item.toastCopy.textContent = "Nova tarefa disponível amanhã."
    window.requestAnimationFrame(() => {
      item.toast.classList.remove("is-complete")
      void item.toast.offsetWidth
      item.toast.classList.add("is-open", "is-complete")
    })
    toastTimer = window.setTimeout(() => {
      item.toast.classList.remove("is-open")
      window.setTimeout(() => {
        if (!item.toast.classList.contains("is-open")) item.toast.hidden = true
      }, 220)
    }, 4600)
  }

  function onConceptOpened(event) {
    const result = atlas.dailyTaskEngine?.recordConceptOpened({
      slug: event.detail?.slug,
      source: event.detail?.source,
      now: new Date(),
    })
    render()
    if (result?.completed) {
      playCompletionSound()
      showToast()
    }
  }

  function handleClick(event) {
    const target =
      event.target instanceof Element ? event.target.closest("[data-atlas-daily-action]") : null
    if (!target) return
    event.preventDefault()
    event.stopPropagation()
    const action = target.dataset.atlasDailyAction
    if (action === "open") open()
    else if (action === "close") close()
    else if (action === "toggle-sound") {
      const enabled = currentSnapshot()?.soundEnabled !== false
      atlas.dailyTaskEngine?.setSoundEnabled(!enabled)
      render()
    }
  }

  function handleKeydown(event) {
    if (event.key === "Escape" && panel()?.classList.contains("is-open")) {
      event.preventDefault()
      close()
    }
  }

  function onVisibilityChange() {
    if (document.visibilityState === "visible") syncDay()
  }

  document.addEventListener("click", handleClick, true)
  document.addEventListener("keydown", handleKeydown)
  document.addEventListener("atlas:concept-opened", onConceptOpened)
  document.addEventListener("atlas:data-ready", syncDay)
  document.addEventListener("visibilitychange", onVisibilityChange)
  window.addEventListener("focus", syncDay)
  document.addEventListener("prenav", () => close(false))
  syncDay()

  atlas.dailyTasks = {
    runtimeVersion: 1,
    close,
    open,
    render,
    syncDay,
  }
})()
