;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  const { focusable, setHidden } = atlas.dom
  const slides = () => [...document.querySelectorAll("[data-onboarding-slide]")]
  const dots = () => [...document.querySelectorAll("[data-onboarding-step]")]
  const state = { index: 0, lastTrigger: null, initialized: false, observer: null }

  function readComplete() {
    return atlas.state.getPreferences().onboardingComplete === true
  }

  function setComplete(value) {
    atlas.state.savePreferences({ onboardingComplete: value === true })
  }

  function render() {
    const overlay = document.getElementById("atlas-onboarding")
    if (!overlay) return
    slides().forEach((slide, index) => {
      const active = index === state.index
      slide.classList.toggle("is-active", active)
      slide.setAttribute("aria-hidden", String(!active))
    })
    dots().forEach((dot, index) => {
      const active = index === state.index
      dot.classList.toggle("is-active", active)
      dot.setAttribute("aria-selected", String(active))
      dot.tabIndex = active ? 0 : -1
    })
    const count = document.getElementById("atlas-onboarding-count")
    if (count)
      count.textContent = `${String(state.index + 1).padStart(2, "0")} / ${String(slides().length).padStart(2, "0")}`
    const previous = overlay.querySelector('[data-atlas-action="onboarding-prev"]')
    const next = overlay.querySelector('[data-atlas-action="onboarding-next"]')
    if (previous) previous.disabled = state.index === 0
    if (next) next.textContent = state.index === slides().length - 1 ? "Entrar no Atlas" : "Avançar"
  }

  function show(trigger) {
    const overlay = document.getElementById("atlas-onboarding")
    if (!overlay) return
    state.lastTrigger = trigger || document.activeElement
    state.index = 0
    render()
    setHidden(overlay, false)
    overlay.classList.add("is-open")
    document.documentElement.classList.add("atlas-onboarding-open")
    window.requestAnimationFrame(() =>
      overlay.querySelector('[data-atlas-action="onboarding-next"]')?.focus(),
    )
  }

  function close(completed) {
    const overlay = document.getElementById("atlas-onboarding")
    if (!overlay) return
    if (completed) setComplete(true)
    overlay.classList.remove("is-open")
    setHidden(overlay, true)
    document.documentElement.classList.remove("atlas-onboarding-open")
    const restoreTarget =
      state.lastTrigger instanceof HTMLElement && state.lastTrigger.getClientRects().length
        ? state.lastTrigger
        : document.querySelector(".atlas-brand, #main-content h1, #main-content")
    window.requestAnimationFrame(() => restoreTarget?.focus?.({ preventScroll: true }))
    state.lastTrigger = null
  }

  function step(nextIndex) {
    const total = slides().length
    state.index = Math.max(0, Math.min(total - 1, nextIndex))
    render()
  }

  function handleAction(action, target) {
    if (action === "onboarding-next") {
      if (state.index >= slides().length - 1) close(true)
      else step(state.index + 1)
      return true
    }
    if (action === "onboarding-prev") {
      step(state.index - 1)
      return true
    }
    if (action === "skip-onboarding" || action === "close-onboarding") {
      close(action === "skip-onboarding")
      return true
    }
    if (target?.dataset?.onboardingStep) {
      step(Number(target.dataset.onboardingStep))
      return true
    }
    return false
  }

  function handleKeydown(event) {
    const overlay = document.getElementById("atlas-onboarding")
    if (!overlay || overlay.hidden) return false
    if (event.key === "ArrowRight") {
      event.preventDefault()
      step(state.index + 1)
      return true
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      step(state.index - 1)
      return true
    }
    if (event.key === "Escape") {
      event.preventDefault()
      close(false)
      return true
    }
    if (event.key === "Tab") {
      const items = focusable(overlay)
      if (!items.length) return false
      const currentIndex = items.indexOf(document.activeElement)
      const nextIndex = event.shiftKey
        ? currentIndex <= 0
          ? items.length - 1
          : currentIndex - 1
        : currentIndex === items.length - 1
          ? 0
          : currentIndex + 1
      event.preventDefault()
      items[nextIndex].focus()
      return true
    }
    return false
  }

  function init() {
    if (state.initialized) return
    state.initialized = true
    const overlay = document.getElementById("atlas-onboarding")
    if (!overlay) return
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay.querySelector(".atlas-overlay-backdrop")) close(false)
    })
    if (readComplete()) return
    const tryOpen = () => {
      if (readComplete() || !document.getElementById("atlas-home-dashboard")) return
      if (document.documentElement.dataset.atlasAccess === "locked") return
      window.setTimeout(() => {
        if (!readComplete() && document.getElementById("atlas-home-dashboard")) show()
      }, 650)
    }
    if (document.documentElement.dataset.atlasAccess === "locked") {
      state.observer = new MutationObserver(tryOpen)
      state.observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-atlas-access"],
      })
    } else tryOpen()
  }

  atlas.onboarding = { close, handleAction, handleKeydown, init, render, show }
})()
