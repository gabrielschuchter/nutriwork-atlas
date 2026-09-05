;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  if (atlas.dailyTasks?.runtimeVersion === 2) return

  let opener = null
  let toastTimer = 0
  let completionAudio = null

  function panel() {
    return document.getElementById("atlas-daily-task-panel")
  }

  function elements() {
    const view = panel()
    return {
      view,
      list: document.getElementById("atlas-daily-task-list"),
      summary: document.getElementById("atlas-daily-task-summary"),
      progress: document.getElementById("atlas-daily-task-progress"),
      progressBar: document.getElementById("atlas-daily-task-progress-bar"),
      state: document.getElementById("atlas-daily-task-state"),
      sound: document.querySelector('[data-atlas-daily-action="toggle-sound"]'),
      close: document.querySelector('[data-atlas-daily-action="close"]'),
      streakFire: document.querySelector("[data-atlas-daily-streak-fire]"),
      streakLabel: document.querySelector("[data-atlas-daily-streak-label]"),
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

  function taskProgress(current, task) {
    return current?.progress?.byTask?.[task.id] || { count: 0, items: [] }
  }

  function createTaskItem(task, current, completedIds) {
    const progress = taskProgress(current, task)
    const count = Math.min(Number(progress.count || 0), Number(task.target || 1))
    const target = Math.max(1, Number(task.target) || 1)
    const complete = completedIds.has(task.id)
    const item = document.createElement("li")
    item.className = "atlas-daily-task-item"
    item.dataset.state = complete ? "complete" : "active"
    item.setAttribute(
      "aria-label",
      `${task.title || "Tarefa"}. ${complete ? "Concluída" : `${count} de ${target}`}`,
    )

    const row = document.createElement("div")
    row.className = "atlas-daily-task-item-row"
    const marker = document.createElement("span")
    marker.className = "atlas-daily-task-item-check"
    marker.setAttribute("aria-hidden", "true")
    marker.textContent = complete ? "✓" : ""
    const copy = document.createElement("div")
    copy.className = "atlas-daily-task-item-copy"
    const title = document.createElement("h3")
    title.textContent = task.title || "Tarefa do Atlas"
    const description = document.createElement("p")
    description.textContent = task.description || "Explore o Atlas por alguns minutos."
    copy.append(title, description)
    const countLabel = document.createElement("strong")
    countLabel.className = "atlas-daily-task-item-progress"
    countLabel.textContent = `${complete ? target : count} / ${target}`
    row.append(marker, copy, countLabel)

    const track = document.createElement("div")
    track.className = "atlas-daily-task-item-track"
    track.setAttribute("aria-hidden", "true")
    const fill = document.createElement("span")
    fill.style.setProperty(
      "--atlas-daily-task-item-progress",
      String((complete ? target : count) / target),
    )
    track.append(fill)
    item.append(row, track)
    return item
  }

  function render() {
    const current = currentSnapshot()
    const tasks = current?.daily?.tasks || []
    if (!tasks.length) return
    const item = elements()
    const completedIds = new Set(current.progress?.completedIds || [])
    const completedCount = tasks.filter((task) => completedIds.has(task.id)).length
    const totalCount = tasks.length

    if (item.list) {
      item.list.replaceChildren(...tasks.map((task) => createTaskItem(task, current, completedIds)))
    }
    if (item.summary)
      item.summary.textContent = `${completedCount} de ${totalCount} ${
        totalCount === 1 ? "tarefa concluída" : "tarefas concluídas"
      }`
    if (item.progress) item.progress.textContent = `${completedCount} / ${totalCount}`
    if (item.progressBar)
      item.progressBar.style.setProperty(
        "--atlas-daily-progress",
        String(totalCount ? completedCount / totalCount : 0),
      )
    if (item.state) {
      item.state.textContent = current.completed
        ? "Todas as tarefas de hoje foram concluídas."
        : "Explore o grafo para concluir as tarefas."
      item.state.dataset.state = current.completed ? "complete" : "active"
    }
    const visibleStreak = Number(current.streak?.visibleCount || 0)
    if (item.streakLabel) item.streakLabel.textContent = `Sequência: ${visibleStreak} dias`
    if (item.streakFire) {
      item.streakFire.hidden = visibleStreak < 1
      item.streakFire.dataset.level = String(Math.min(5, Math.max(1, Math.ceil(visibleStreak / 3))))
    }
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

  function audioContextConstructor() {
    return window.AudioContext || window.webkitAudioContext
  }

  function prepareCompletionSound() {
    const current = currentSnapshot()
    if (current?.soundEnabled === false) return
    try {
      const AudioContext = audioContextConstructor()
      if (!AudioContext) return
      if (!completionAudio || completionAudio.state === "closed")
        completionAudio = new AudioContext()
      if (completionAudio.state === "suspended") void completionAudio.resume().catch(() => {})
    } catch {
      completionAudio = null
    }
  }

  function playCompletionSound() {
    const current = currentSnapshot()
    if (current?.soundEnabled === false) return
    try {
      const AudioContext = audioContextConstructor()
      if (!AudioContext) return
      const context = completionAudio || new AudioContext()
      if (context.state === "closed") return
      completionAudio = context
      const playTone = () => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        const now = context.currentTime
        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(660, now)
        oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.12)
        gain.gain.setValueAtTime(0.0001, now)
        gain.gain.exponentialRampToValueAtTime(0.045, now + 0.012)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start(now)
        oscillator.stop(now + 0.17)
      }
      if (context.state === "suspended")
        void context
          .resume()
          .then(playTone)
          .catch(() => {})
      else playTone()
    } catch {
      // Audio is a progressive enhancement and never affects completion.
      completionAudio = null
    }
  }

  function showToast(completedTasks = []) {
    const item = elements()
    if (!item.toast) return
    const current = currentSnapshot()
    if (toastTimer) window.clearTimeout(toastTimer)
    item.toast.hidden = false
    item.toast.dataset.state = "complete"
    if (item.toastTitle)
      item.toastTitle.textContent =
        completedTasks.length > 1
          ? `✓ ${completedTasks.length} tarefas concluídas`
          : "✓ Tarefa concluída"
    if (item.toastCopy)
      item.toastCopy.textContent = current?.completed
        ? "Você concluiu as tarefas de hoje."
        : "O progresso foi salvo neste dispositivo."
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
    if (result?.completedTasks?.length) {
      playCompletionSound()
      showToast(result.completedTasks)
    }
  }

  function handlePointerDown() {
    // Graph nodes use Pointer Events and therefore do not emit a click to prime audio.
    prepareCompletionSound()
  }

  function handleClick(event) {
    prepareCompletionSound()
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
    if (event.key === "Enter" || event.key === " ") prepareCompletionSound()
    if (event.key === "Escape" && panel()?.classList.contains("is-open")) {
      event.preventDefault()
      close()
    }
  }

  function onVisibilityChange() {
    if (document.visibilityState === "visible") syncDay()
  }

  document.addEventListener("pointerdown", handlePointerDown, true)
  document.addEventListener("click", handleClick, true)
  document.addEventListener("keydown", handleKeydown)
  document.addEventListener("atlas:concept-opened", onConceptOpened)
  document.addEventListener("atlas:data-ready", syncDay)
  document.addEventListener("visibilitychange", onVisibilityChange)
  window.addEventListener("focus", syncDay)
  document.addEventListener("prenav", () => close(false))
  syncDay()

  atlas.dailyTasks = {
    runtimeVersion: 2,
    close,
    open,
    render,
    syncDay,
  }
})()
