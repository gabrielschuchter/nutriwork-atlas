;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  if (atlas.app?.runtimeVersion === 2) return

  const { button, clear, focusable, make, normalizeSlug, pathFor, routeSlug, svgIcon } = atlas.dom

  const previewId = "atlas-preview"
  const onboardingKey = "nutriwork-atlas-onboarding-v1"
  const themeKey = "nutriwork-atlas-theme"
  let previewTimer = 0
  let previewSlug = ""
  let previewAnchor = null
  let onboardingStep = 0
  let onboardingOpener = null
  let refreshSerial = 0

  function root() {
    return document.documentElement
  }

  function isUnlocked() {
    return root().dataset.atlasAccess === "unlocked"
  }

  function isGraphRoute() {
    return routeSlug() === "index"
  }

  function readStorage(key) {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Preferences are optional and never block graph navigation.
    }
  }

  function readSession(key) {
    try {
      return window.sessionStorage.getItem(key)
    } catch {
      return null
    }
  }

  function writeSession(key, value) {
    try {
      window.sessionStorage.setItem(key, value)
    } catch {
      // Navigation still works without session storage.
    }
  }

  function removeSession(key) {
    try {
      window.sessionStorage.removeItem(key)
    } catch {
      // Ignore unavailable session storage.
    }
  }

  function setTheme(theme) {
    const nextTheme = theme === "light" ? "light" : "dark"
    const changed = root().dataset.theme !== nextTheme
    root().dataset.theme = nextTheme
    root().setAttribute("saved-theme", nextTheme)
    root().style.colorScheme = nextTheme
    writeStorage(themeKey, nextTheme)
    renderThemeControl()
    if (changed) atlas.graph?.refresh()
  }

  function currentTheme() {
    const saved = readStorage(themeKey)
    if (saved === "light" || saved === "dark") return saved
    return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark"
  }

  function renderThemeControl() {
    const control = document.getElementById("atlas-theme-toggle")
    if (!control) return
    const dark = (root().dataset.theme || currentTheme()) === "dark"
    clear(control)
    control.appendChild(svgIcon(dark ? "sun" : "moon"))
    control.appendChild(make("span", "atlas-control-label", dark ? "Modo claro" : "Modo escuro"))
    control.setAttribute("aria-label", dark ? "Usar modo claro" : "Usar modo escuro")
    control.title = dark ? "Usar modo claro" : "Usar modo escuro"
  }

  function setNavHidden(hidden) {
    root().classList.toggle("atlas-nav-hidden", hidden)
    const reopen = document.getElementById("atlas-reopen-nav")
    if (reopen) reopen.hidden = !hidden
  }

  function setRouteLoading(loading) {
    root().classList.toggle("atlas-route-loading", loading)
    const frame = document.querySelector(".atlas-frame")
    if (frame) frame.setAttribute("aria-busy", String(loading))
  }

  function renderNavState() {
    const graph = isGraphRoute()
    const frame = document.querySelector(".atlas-frame")
    frame?.setAttribute("data-atlas-route", graph ? "graph" : "note")
    const back = document.getElementById("atlas-back")
    const expand = document.getElementById("atlas-expand-graph")
    if (back) back.hidden = graph
    if (expand) expand.hidden = graph

    const returnButton = document.getElementById("atlas-return-note")
    const returnSlug = readSession("nutriwork-atlas-return-note")
    const returnNode = returnSlug ? atlas.data.get(returnSlug) : null
    if (returnButton) {
      returnButton.hidden = !graph || !returnNode
      if (returnNode) returnButton.setAttribute("aria-label", "Voltar para " + returnNode.title)
    }
    setNavHidden(false)
  }

  function renderAreas() {
    const select = document.getElementById("atlas-area-filter")
    const areas = atlas.data.index?.areas || []
    if (!select || select.dataset.ready === "true") return
    clear(select)
    select.appendChild(new Option("Todas as áreas", "all"))
    for (const area of areas) {
      const option = new Option(String(area.label || area.id), String(area.id))
      select.appendChild(option)
    }
    select.dataset.ready = "true"
  }

  function targetFromAnchor(anchor) {
    const explicit = normalizeSlug(anchor.dataset.atlasTarget || "")
    if (explicit && atlas.data.get(explicit)) return explicit
    try {
      const url = new URL(anchor.href, window.location.href)
      let pathname = url.pathname
      const basePath = document.body?.dataset?.basepath || ""
      if (basePath && pathname.startsWith(basePath)) pathname = pathname.slice(basePath.length)
      const candidate = normalizeSlug(pathname)
      return atlas.data.get(candidate)?.slug || ""
    } catch {
      return ""
    }
  }

  function enhanceLinks() {
    const anchors = document.querySelectorAll("a.internal, a[data-atlas-target]")
    for (const anchor of anchors) {
      const slug = targetFromAnchor(anchor)
      if (slug) anchor.dataset.atlasTarget = slug
    }
  }

  function positionPreview(anchor) {
    const preview = document.getElementById(previewId)
    if (!preview || !anchor) return
    const margin = 16
    const previewWidth = Math.min(360, window.innerWidth - margin * 2)
    preview.style.width = previewWidth + "px"
    const previewHeight = preview.offsetHeight || 190
    let left = anchor.left
    let top = anchor.bottom + margin
    if (left + previewWidth > window.innerWidth - margin)
      left = window.innerWidth - previewWidth - margin
    if (left < margin) left = margin
    if (top + previewHeight > window.innerHeight - margin) top = anchor.top - previewHeight - margin
    if (top < margin) top = margin
    preview.style.left = Math.round(left) + "px"
    preview.style.top = Math.round(top) + "px"
  }

  function cancelPreviewHide() {
    if (previewTimer) window.clearTimeout(previewTimer)
    previewTimer = 0
  }

  function hidePreview(delay = 140) {
    cancelPreviewHide()
    const preview = document.getElementById(previewId)
    if (!preview) return
    previewTimer = window.setTimeout(() => {
      if (preview.matches(":hover")) return
      preview.hidden = true
      preview.classList.remove("is-open")
      preview.setAttribute("aria-hidden", "true")
      previewSlug = ""
      previewAnchor = null
    }, delay)
  }

  function showPreview(node, anchor) {
    const preview = document.getElementById(previewId)
    if (!preview || !node) return
    cancelPreviewHide()
    previewAnchor = anchor
    if (previewSlug !== node.slug) {
      previewSlug = node.slug
      clear(preview)
      const kicker = make("p", "atlas-preview-kicker", "CONCEITO")
      const title = make("h2", "atlas-preview-title", node.title)
      const area = make("p", "atlas-preview-area", node.areaLabel)
      const excerpt = make(
        "p",
        "atlas-preview-excerpt",
        node.excerpt || "Abra a nota para explorar este conceito.",
      )
      const open = button("Abrir nota", "open-preview", "atlas-preview-open")
      open.dataset.atlasSlug = node.slug
      preview.append(kicker, title, area, excerpt, open)
    }
    preview.hidden = false
    preview.classList.add("is-open")
    preview.setAttribute("aria-hidden", "false")
    positionPreview(anchor)
  }

  function previewForAnchor(anchor) {
    const slug = targetFromAnchor(anchor)
    const node = slug ? atlas.data.get(slug) : null
    if (node) showPreview(node, anchor.getBoundingClientRect())
  }

  function openConcept(slug) {
    const node = atlas.data.get(slug)
    if (!node) return
    atlas.graph?.persist()
    hidePreview(0)
    writeSession("nutriwork-atlas-graph-context", "true")
    goTo(node.slug)
  }

  function goTo(slug) {
    const href = pathFor(slug)
    const url = new URL(href, window.location.href)
    if (typeof window.spaNavigate === "function") window.spaNavigate(url, false)
    else window.location.assign(url)
  }

  function goBack() {
    if (readSession("nutriwork-atlas-graph-context") && window.history.length > 1) {
      window.history.back()
    } else {
      goTo("index")
    }
  }

  function expandGraph() {
    const current = routeSlug()
    if (!atlas.data.get(current)) return
    atlas.graph?.persist()
    writeSession("nutriwork-atlas-return-note", current)
    goTo("index")
  }

  function returnToNote() {
    const slug = readSession("nutriwork-atlas-return-note")
    if (slug && atlas.data.get(slug)) goTo(slug)
  }

  function onboardingComplete() {
    return readStorage(onboardingKey) === "complete"
  }

  function onboardingElements() {
    const overlay = document.getElementById("atlas-onboarding")
    if (!overlay) return null
    return {
      overlay,
      steps: [...overlay.querySelectorAll("[data-onboarding-step]")],
      count: overlay.querySelector("[data-onboarding-count]"),
      progress: overlay.querySelector("[data-onboarding-progress]"),
      next: overlay.querySelector('[data-atlas-action="onboarding-next"]'),
    }
  }

  function renderOnboarding() {
    const elements = onboardingElements()
    if (!elements) return
    elements.steps.forEach((step, index) => {
      step.hidden = index !== onboardingStep
    })
    const number = String(onboardingStep + 1).padStart(2, "0")
    if (elements.count) elements.count.textContent = number + " / 05"
    if (elements.progress)
      elements.progress.style.setProperty("--atlas-onboarding-progress", number)
    if (elements.next) {
      elements.next.textContent =
        onboardingStep === elements.steps.length - 1 ? "Entrar no grafo" : "Continuar"
    }
  }

  function closeOnboarding(markComplete = true) {
    const elements = onboardingElements()
    if (!elements) return
    const opener = onboardingOpener
    onboardingOpener = null
    if (markComplete) writeStorage(onboardingKey, "complete")
    elements.overlay.hidden = true
    root().classList.remove("atlas-onboarding-open")
    window.requestAnimationFrame(() => opener?.focus())
  }

  function openOnboarding(force = false) {
    if (!isGraphRoute() || !isUnlocked()) return
    const elements = onboardingElements()
    if (!elements || (!force && onboardingComplete())) return
    onboardingStep = 0
    onboardingOpener = document.getElementById("atlas-onboarding-open")
    elements.overlay.hidden = false
    root().classList.add("atlas-onboarding-open")
    renderOnboarding()
    window.requestAnimationFrame(() => elements.next?.focus())
  }

  function advanceOnboarding() {
    const elements = onboardingElements()
    if (!elements) return
    if (onboardingStep >= elements.steps.length - 1) closeOnboarding()
    else {
      onboardingStep += 1
      renderOnboarding()
      elements.next?.focus()
    }
  }

  function handleAction(target) {
    const action = target.dataset.atlasAction
    if (action === "toggle-theme") {
      setTheme((root().dataset.theme || currentTheme()) === "dark" ? "light" : "dark")
    } else if (action === "toggle-nav") {
      setNavHidden(true)
    } else if (action === "show-nav") {
      setNavHidden(false)
    } else if (action === "go-back") {
      goBack()
    } else if (action === "expand-graph") {
      expandGraph()
    } else if (action === "return-note") {
      returnToNote()
    } else if (action === "open-preview") {
      openConcept(target.dataset.atlasSlug)
    } else if (action === "onboarding-next") {
      advanceOnboarding()
    } else if (action === "open-onboarding") {
      openOnboarding(true)
    } else if (action === "onboarding-skip") {
      closeOnboarding()
    }
  }

  function handleClick(event) {
    const target =
      event.target instanceof Element ? event.target.closest("[data-atlas-action]") : null
    if (target) {
      event.preventDefault()
      handleAction(target)
      return
    }
    const anchor =
      event.target instanceof Element
        ? event.target.closest("a.internal, a[data-atlas-target]")
        : null
    if (anchor) hidePreview(0)
    if (anchor && isGraphRoute() && targetFromAnchor(anchor)) {
      atlas.graph?.persist()
      writeSession("nutriwork-atlas-graph-context", "true")
    }
  }

  function handlePointerOver(event) {
    const previewTarget =
      event.target instanceof Element ? event.target.closest("#" + previewId) : null
    if (previewTarget) {
      cancelPreviewHide()
      return
    }
    const target =
      event.target instanceof Element
        ? event.target.closest("a.internal, a[data-atlas-target]")
        : null
    if (!target || target.closest("#" + previewId)) return
    if (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return
    previewForAnchor(target)
  }

  function handlePointerOut(event) {
    const previewTarget =
      event.target instanceof Element ? event.target.closest("#" + previewId) : null
    if (previewTarget) {
      if (event.relatedTarget instanceof Node && previewTarget.contains(event.relatedTarget)) return
      hidePreview()
      return
    }
    const target =
      event.target instanceof Element
        ? event.target.closest("a.internal, a[data-atlas-target]")
        : null
    if (!target || target.closest("#" + previewId)) return
    if (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return
    hidePreview()
  }

  function handleFocusIn(event) {
    const target =
      event.target instanceof Element
        ? event.target.closest("a.internal, a[data-atlas-target]")
        : null
    if (target) previewForAnchor(target)
  }

  function handleKeydown(event) {
    if (event.key !== "Escape") return
    const onboarding = document.getElementById("atlas-onboarding")
    if (onboarding && !onboarding.hidden) {
      closeOnboarding()
      return
    }
    hidePreview(0)
    if (root().classList.contains("atlas-nav-hidden")) setNavHidden(false)
  }

  function handleOnboardingTab(event) {
    const elements = onboardingElements()
    if (!elements || elements.overlay.hidden || event.key !== "Tab") return
    const items = focusable(elements.overlay)
    if (!items.length) return
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      last.focus()
      event.preventDefault()
    } else if (!event.shiftKey && document.activeElement === last) {
      first.focus()
      event.preventDefault()
    }
  }

  function handleFilters(event) {
    const search = document.getElementById("atlas-search")
    const area = document.getElementById("atlas-area-filter")
    if (!search || !area) return
    if (event?.target !== search && event?.target !== area) return
    atlas.graph?.setFilter(search.value, area.value)
  }

  async function refresh() {
    const serial = ++refreshSerial
    renderNavState()
    setTheme(root().dataset.theme || currentTheme())
    if (!isUnlocked()) {
      setRouteLoading(false)
      hidePreview(0)
      atlas.graph?.persist()
      atlas.graph?.destroyAll()
      return
    }
    setRouteLoading(true)
    try {
      await atlas.data.load()
      if (serial !== refreshSerial) return
      renderAreas()
      enhanceLinks()
      atlas.graph?.mountAll()
      renderNavState()
      if (isGraphRoute()) openOnboarding()
      setRouteLoading(false)
    } catch (error) {
      console.error("O Atlas não conseguiu carregar o grafo.", error)
      const mount = document.querySelector("[data-atlas-graph-mode]")
      mount?.querySelector(".atlas-graph-loading")?.remove()
      if (mount && !mount.querySelector(".atlas-graph-error")) {
        mount.appendChild(
          make("p", "atlas-graph-error", "Não foi possível carregar o grafo. Recarregue a página."),
        )
      }
      setRouteLoading(false)
    }
  }

  document.addEventListener("click", handleClick)
  document.addEventListener("pointerover", handlePointerOver)
  document.addEventListener("pointerout", handlePointerOut)
  document.addEventListener("focusin", handleFocusIn)
  document.addEventListener("keydown", handleKeydown)
  document.addEventListener("keydown", handleOnboardingTab)
  document.addEventListener("input", handleFilters)
  document.addEventListener("change", handleFilters)
  document.addEventListener("prenav", () => {
    setRouteLoading(true)
    hidePreview(0)
    atlas.graph?.persist()
    atlas.graph?.destroyAll()
  })
  document.addEventListener("nav", () => {
    setRouteLoading(false)
    refresh()
  })
  window.addEventListener("resize", () => {
    if (previewAnchor && previewSlug) positionPreview(previewAnchor)
  })
  window.addEventListener("pagehide", () => atlas.graph?.persist())
  document.addEventListener("atlas-access", refresh)

  setTheme(currentTheme())
  atlas.app = {
    runtimeVersion: 2,
    goTo,
    hidePreview,
    openConcept,
    refresh,
    showGraphPreview: showPreview,
  }
  refresh()
})()
