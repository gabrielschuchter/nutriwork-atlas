;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  if (atlas.app?.runtimeVersion === 3) return

  const {
    button,
    clear,
    focusable,
    make,
    normalizeSlug,
    pathFor,
    searchMatch,
    searchQuery,
    svgIcon,
  } = atlas.dom

  const previewId = "atlas-preview"
  const onboardingKey = "nutriwork-atlas-onboarding-v1"
  const lastNoteKey = "nutriwork-atlas-last-note-v2"
  const themeKey = "nutriwork-atlas-theme"
  const touchHintKey = "nutriwork-atlas-touch-hint-v1"
  let previewTimer = 0
  let previewSlug = ""
  let previewAnchor = null
  let onboardingStep = 0
  let onboardingOpener = null
  let helpOpener = null
  let reportOpener = null
  let searchOpener = null
  let areaOpener = null
  let mobileMenuOpener = null
  let touchHintTimer = 0
  let touchHintShown = false
  let filterTimer = 0
  let mobileSearchTimer = 0
  let viewportMetricsFrame = 0
  let mobileSearchQuery = ""
  let refreshSerial = 0
  let navigationSerial = 0
  let selectedArea = "all"
  let viewState = { mode: "graph", noteSlug: "", openedFromGraph: false }

  function root() {
    return document.documentElement
  }

  function isUnlocked() {
    return root().dataset.atlasAccess === "unlocked"
  }

  function isTouchDevice() {
    return Boolean(navigator.maxTouchPoints > 0 || window.matchMedia?.("(pointer: coarse)").matches)
  }

  function overlayIsOpen(id) {
    const overlay = document.getElementById(id)
    return Boolean(overlay && !overlay.hidden && overlay.classList.contains("is-open"))
  }

  function syncModalLock() {
    const open = [
      "atlas-search-sheet",
      "atlas-area-sheet",
      "atlas-mobile-menu",
      "atlas-onboarding",
      "atlas-help",
      "atlas-report",
      "atlas-daily-task-panel",
    ].some(overlayIsOpen)
    root().classList.toggle("atlas-modal-open", open)
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
      window.sessionStorage.setItem(key, String(value))
    } catch {
      // Session context is optional and never blocks graph navigation.
    }
  }

  function setTheme(theme) {
    const nextTheme = theme === "light" ? "light" : "dark"
    root().dataset.theme = nextTheme
    root().setAttribute("saved-theme", nextTheme)
    root().style.colorScheme = nextTheme
    writeStorage(themeKey, nextTheme)
    renderThemeControl()
    // Synchronize the canvas even when the document theme was initialized before the app.
    atlas.graph?.setTheme?.(nextTheme)
  }

  function currentTheme() {
    const saved = readStorage(themeKey)
    if (saved === "light" || saved === "dark") return saved
    return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark"
  }

  function renderThemeControl() {
    const dark = (root().dataset.theme || currentTheme()) === "dark"
    const controls = document.querySelectorAll("[data-atlas-theme-toggle]")
    for (const control of controls) {
      clear(control)
      control.appendChild(svgIcon(dark ? "sun" : "moon"))
      if (!control.classList.contains("atlas-mobile-action"))
        control.appendChild(
          make("span", "atlas-control-label", dark ? "Modo claro" : "Modo escuro"),
        )
      control.setAttribute("aria-label", dark ? "Usar modo claro" : "Usar modo escuro")
      control.title = dark ? "Usar modo claro" : "Usar modo escuro"
    }
    const menuLabel = document.getElementById("atlas-theme-menu-label")
    if (menuLabel) menuLabel.textContent = dark ? "Usar modo claro" : "Usar modo escuro"
  }

  function setNavHidden(hidden) {
    if (hidden) closeMobileMenu(false)
    root().classList.toggle("atlas-nav-hidden", hidden)
    const reopen = document.getElementById("atlas-reopen-nav")
    if (reopen) reopen.hidden = !hidden
  }

  function setRouteLoading(loading) {
    root().classList.toggle("atlas-route-loading", loading)
    const frame = document.querySelector(".atlas-frame")
    if (frame) frame.setAttribute("aria-busy", String(loading))
  }

  function locationSlug() {
    let pathname = window.location.pathname.replace(/\/+$/, "")
    const basePath = document.body?.dataset?.basepath || ""
    const normalizedBase = basePath.replace(/\/+$/, "")
    if (normalizedBase && pathname.startsWith(normalizedBase))
      pathname = pathname.slice(normalizedBase.length)
    if (!pathname || pathname === "/") return "index"
    try {
      pathname = decodeURIComponent(pathname)
    } catch {
      // Keep the encoded path for the normalizer when decoding fails.
    }
    return normalizeSlug(pathname) || "index"
  }

  function isAtlasLocation() {
    const slug = locationSlug()
    return slug === "index" || slug === "roadmap" || slug.startsWith("atlas/")
  }

  function graphRoot() {
    return document.getElementById("atlas-graph-root")
  }

  function placeGraphRoot(mode) {
    const graph = graphRoot()
    const target = document.getElementById(
      mode === "note" ? "atlas-note-graph-slot" : "atlas-graph-view",
    )
    if (graph && target && graph.parentElement !== target) target.appendChild(graph)
  }

  function renderNoteContent(node) {
    const content = document.getElementById("atlas-note-content")
    if (!content) return
    clear(content)
    content.classList.toggle("is-development", Boolean(node.isDevelopment))
    const article = make("article", "atlas-development-state")
    const icon = make("span", "atlas-development-mark", "···")
    icon.setAttribute("aria-hidden", "true")
    const title = make("h2", "atlas-development-title", "Este termo está em desenvolvimento.")
    const description = make(
      "p",
      "atlas-development-copy",
      "A nota ainda não foi publicada, mas a relação já faz parte do grafo.",
    )
    const back = button("Voltar ao grafo", "go-back", "atlas-development-back")
    article.append(icon, title, description, back)
    content.appendChild(article)
    content.dataset.atlasSlug = node.slug
  }

  async function ensureNoteContent(node) {
    const content = document.getElementById("atlas-note-content")
    if (!content) return
    if (node.isDevelopment) {
      renderNoteContent(node)
      return
    }
    if (content.dataset.atlasSlug === node.slug && content.querySelector("article")) return
    const response = await fetch(pathFor(node.slug), { cache: "no-cache" })
    if (!response.ok) throw new Error("Não foi possível carregar a nota do Atlas.")
    const html = await response.text()
    const parsed = new DOMParser().parseFromString(html, "text/html")
    const article = parsed.querySelector(".atlas-note-content article, article")
    if (!article) throw new Error("A nota do Atlas não possui conteúdo publicado.")
    clear(content)
    content.classList.remove("is-development")
    content.appendChild(article.cloneNode(true))
    content.dataset.atlasSlug = node.slug
  }

  function renderViewState() {
    const graphView = document.getElementById("atlas-graph-view")
    const noteView = document.getElementById("atlas-note-view")
    const roadmapView = document.getElementById("atlas-roadmap-view")
    const frame = document.querySelector(".atlas-frame")
    const graph = viewState.mode === "graph"
    const note = viewState.mode === "note"
    const roadmap = viewState.mode === "roadmap"
    frame?.setAttribute("data-atlas-route", graph ? "graph" : note ? "note" : "roadmap")
    frame?.setAttribute("data-atlas-view", graph ? "graph" : note ? "note" : "roadmap")
    graphView?.classList.toggle("is-active", graph)
    noteView?.classList.toggle("is-active", note)
    roadmapView?.classList.toggle("is-active", roadmap)
    graphView?.setAttribute("aria-hidden", String(!graph))
    noteView?.setAttribute("aria-hidden", String(!note))
    roadmapView?.setAttribute("aria-hidden", String(!roadmap))
    if ("inert" in HTMLElement.prototype) {
      if (graphView) graphView.inert = !graph
      if (noteView) noteView.inert = !note
      if (roadmapView) roadmapView.inert = !roadmap
    }
    const node = viewState.noteSlug ? atlas.data.get(viewState.noteSlug) : null
    const title = document.getElementById("atlas-note-title")
    if (title && node) title.textContent = node.title
    document.body.dataset.slug = graph ? "index" : note ? viewState.noteSlug : "roadmap"
    document.title = graph
      ? "Nutriwork Atlas"
      : roadmap
        ? "Roadmap do Atlas · Nutriwork Atlas"
        : `${node?.title || "Atlas"} · Nutriwork Atlas`
  }

  function renderNavState() {
    const graph = viewState.mode === "graph"
    const roadmap = viewState.mode === "roadmap"
    const frame = document.querySelector(".atlas-frame")
    frame?.setAttribute("data-atlas-route", graph ? "graph" : roadmap ? "roadmap" : "note")
    const back = document.getElementById("atlas-back")
    const expand = document.getElementById("atlas-expand-graph")
    const filters = document.querySelector(".atlas-graph-filters")
    const mobileGraphTools = document.getElementById("atlas-mobile-graph-tools")
    const mobileSearch = document.querySelector(".atlas-mobile-search-trigger")
    const mobileBack = document.querySelector(
      '[data-atlas-action="go-back"].atlas-mobile-note-action',
    )
    const mobileExpand = document.querySelector(
      '[data-atlas-action="expand-graph"].atlas-mobile-note-action',
    )
    const onboarding = document.getElementById("atlas-onboarding-open")
    const dailyTask = document.getElementById("atlas-daily-task-open")
    const help = document.getElementById("atlas-help-open")
    const report = document.querySelector('[data-atlas-action="open-report"]')
    if (back) back.hidden = graph || roadmap
    if (expand) expand.hidden = graph || roadmap
    if (filters) filters.hidden = !graph
    if (mobileGraphTools) mobileGraphTools.hidden = !graph
    if (mobileSearch) mobileSearch.hidden = !graph
    if (mobileBack) mobileBack.hidden = graph
    if (mobileExpand) mobileExpand.hidden = graph
    if (!graph) closeAreaMenu()
    if (!graph) closeAreaSheet(false)
    if (onboarding) onboarding.hidden = !isUnlocked() || roadmap
    if (dailyTask) dailyTask.hidden = roadmap
    if (help) help.hidden = !isUnlocked()
    if (report) report.hidden = graph || roadmap || !isUnlocked()

    const returnButton = document.getElementById("atlas-return-note")
    const returnSlug = readSession(lastNoteKey)
    const returnNode = returnSlug ? atlas.data.get(returnSlug) : null
    if (returnButton) {
      returnButton.hidden = !graph || !returnNode
      if (returnNode) {
        const label = "Voltar para " + returnNode.title
        returnButton.textContent = label
        returnButton.setAttribute("aria-label", label)
        returnButton.title = label
      }
    }
    setNavHidden(false)
    renderViewState()
    renderMobileMenuState()
  }

  function areaPickerElements() {
    return {
      picker: document.querySelector("[data-atlas-area-picker]"),
      trigger: document.getElementById("atlas-area-trigger"),
      value: document.getElementById("atlas-area-value"),
      menu: document.getElementById("atlas-area-menu"),
      select: document.getElementById("atlas-area-filter"),
    }
  }

  function areaSheetElements() {
    return {
      sheet: document.getElementById("atlas-area-sheet"),
      options: document.getElementById("atlas-area-sheet-options"),
      trigger: document.getElementById("atlas-mobile-area-trigger"),
      value: document.getElementById("atlas-mobile-area-value"),
    }
  }

  function preferredOpener(fallback = null) {
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (active?.closest("#atlas-mobile-menu"))
      return document.querySelector('[data-atlas-action="toggle-mobile-menu"]') || fallback
    return active || fallback
  }

  function mobileOpener(trigger) {
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (active?.closest("#atlas-mobile-menu"))
      return document.querySelector('[data-atlas-action="toggle-mobile-menu"]') || trigger
    return trigger
  }

  function areaOptions(menu) {
    return [...(menu?.querySelectorAll("[data-atlas-area-value]") || [])]
  }

  function setAreaPickerValue(value) {
    const { trigger, value: valueElement, menu, select } = areaPickerElements()
    const sheet = areaSheetElements()
    const options = areaOptions(menu)
    const sheetOptions = areaOptions(sheet.options)
    const selected = options.find((option) => option.dataset.atlasAreaValue === value)
    const fallback = selected || options[0]
    selectedArea = fallback?.dataset.atlasAreaValue || "all"
    if (select) select.value = selectedArea
    const label = fallback?.textContent || "Todas as áreas"
    if (valueElement) valueElement.textContent = label
    if (trigger) {
      if (valueElement) valueElement.textContent = label
      trigger.setAttribute("aria-label", "Filtrar por área: " + label)
    }
    if (sheet.value) {
      sheet.value.textContent = label
      sheet.trigger?.setAttribute("aria-label", "Filtrar por área: " + label)
    }
    const mobileMenuValue = document.getElementById("atlas-mobile-menu-area-value")
    if (mobileMenuValue) mobileMenuValue.textContent = label
    for (const option of options) option.setAttribute("aria-selected", String(option === fallback))
    for (const option of sheetOptions)
      option.setAttribute("aria-selected", String(option.dataset.atlasAreaValue === selectedArea))
  }

  function positionAreaMenu() {
    const { trigger, menu } = areaPickerElements()
    if (!trigger || !menu || menu.hidden) return
    const viewportWidth = window.visualViewport?.width || window.innerWidth
    const viewportHeight = window.visualViewport?.height || window.innerHeight
    const gutter = 12
    const triggerRect = trigger.getBoundingClientRect()
    menu.style.bottom = "auto"
    menu.style.left = "0"
    menu.style.right = "auto"
    menu.style.top = "calc(100% + .45rem)"
    menu.dataset.menuPlacement = "below"

    const belowRect = menu.getBoundingClientRect()
    const spaceBelow = viewportHeight - triggerRect.bottom - gutter
    const spaceAbove = triggerRect.top - gutter
    if (belowRect.height > spaceBelow && spaceAbove > spaceBelow) {
      menu.style.bottom = "calc(100% + .45rem)"
      menu.style.top = "auto"
      menu.dataset.menuPlacement = "above"
    }

    const horizontalRect = menu.getBoundingClientRect()
    if (horizontalRect.right > viewportWidth - gutter) {
      menu.style.left = "auto"
      menu.style.right = "0"
    } else if (horizontalRect.left < gutter) {
      menu.style.left = "0"
      menu.style.right = "auto"
    }
  }

  function closeAreaMenu(focusTrigger = false) {
    const { trigger, menu } = areaPickerElements()
    if (!trigger || !menu) return
    menu.hidden = true
    trigger.setAttribute("aria-expanded", "false")
    menu.style.bottom = "auto"
    menu.style.left = "0"
    menu.style.right = "auto"
    menu.style.top = "calc(100% + .45rem)"
    delete menu.dataset.menuPlacement
    if (focusTrigger) trigger.focus()
  }

  function closeAreaSheet(focusTrigger = true) {
    const { sheet, trigger } = areaSheetElements()
    if (!sheet) return
    sheet.classList.remove("is-open")
    sheet.setAttribute("aria-hidden", "true")
    trigger?.setAttribute("aria-expanded", "false")
    syncModalLock()
    window.setTimeout(() => {
      if (!sheet.classList.contains("is-open")) sheet.hidden = true
    }, 220)
    const opener = areaOpener
    areaOpener = null
    if (focusTrigger) (opener || trigger)?.focus({ preventScroll: true })
  }

  function openAreaMenu(focusSelected = false) {
    const { trigger, menu } = areaPickerElements()
    if (!trigger || !menu || !menu.children.length) return
    menu.hidden = false
    trigger.setAttribute("aria-expanded", "true")
    window.requestAnimationFrame(() => {
      positionAreaMenu()
      if (focusSelected)
        areaOptions(menu)
          .find((option) => option.getAttribute("aria-selected") === "true")
          ?.focus()
    })
  }

  function openAreaSheet() {
    if (!isUnlocked()) return
    const { sheet, options, trigger } = areaSheetElements()
    if (!sheet || !options || !options.children.length) return
    closeAreaMenu()
    closeSearch(false)
    closeMobileMenu(false)
    areaOpener = mobileOpener(trigger)
    sheet.hidden = false
    sheet.setAttribute("aria-hidden", "false")
    trigger?.setAttribute("aria-expanded", "true")
    root().classList.add("atlas-modal-open")
    window.requestAnimationFrame(() => {
      sheet.classList.add("is-open")
      areaOptions(options)
        .find((option) => option.getAttribute("aria-selected") === "true")
        ?.focus({ preventScroll: true })
    })
  }

  function toggleAreaMenu() {
    const { menu } = areaPickerElements()
    if (!menu) return
    if (menu.hidden) openAreaMenu()
    else closeAreaMenu(true)
  }

  function renderAreas() {
    const { trigger, menu, select } = areaPickerElements()
    const { options: sheetOptions } = areaSheetElements()
    const areas = atlas.data.index?.areas || []
    if (!trigger || !menu || !select || !sheetOptions) return
    if (select.dataset.ready === "true" && menu.children.length && sheetOptions.children.length) {
      setAreaPickerValue(selectedArea)
      return
    }
    closeAreaMenu()
    closeAreaSheet(false)
    clear(select)
    clear(menu)
    clear(sheetOptions)
    const addArea = (value, label) => {
      select.appendChild(new Option(label, value))
      for (const target of [menu, sheetOptions]) {
        const option = make(
          "button",
          target === menu ? "atlas-area-option" : "atlas-area-sheet-option",
          label,
        )
        option.type = "button"
        option.setAttribute("role", "option")
        option.setAttribute("aria-selected", "false")
        option.tabIndex = -1
        option.dataset.atlasAreaValue = value
        target.appendChild(option)
      }
    }
    addArea("all", "Todas as áreas")
    for (const area of areas) addArea(String(area.id), String(area.label || area.id))
    select.dataset.ready = "true"
    setAreaPickerValue(selectedArea)
  }

  function applyFilters() {
    const search = document.getElementById("atlas-search")
    if (!search) return
    atlas.graph?.setFilter(search.value, selectedArea)
  }

  function cancelFilterTimer() {
    if (!filterTimer) return
    window.clearTimeout(filterTimer)
    filterTimer = 0
  }

  function cancelMobileSearchTimer() {
    if (!mobileSearchTimer) return
    window.clearTimeout(mobileSearchTimer)
    mobileSearchTimer = 0
  }

  function scheduleFilterApply() {
    cancelFilterTimer()
    filterTimer = window.setTimeout(() => {
      filterTimer = 0
      applyFilters()
    }, 80)
  }

  function rememberLastNote(node) {
    if (node?.slug) writeSession(lastNoteKey, node.slug)
  }

  function selectArea(value, { focusTrigger = true } = {}) {
    const { menu } = areaPickerElements()
    const option = areaOptions(menu).find((item) => item.dataset.atlasAreaValue === value)
    if (!option) return
    setAreaPickerValue(value)
    closeAreaMenu(focusTrigger)
    closeAreaSheet(focusTrigger)
    applyFilters()
  }

  function searchSheetElements() {
    return {
      sheet: document.getElementById("atlas-search-sheet"),
      input: document.getElementById("atlas-mobile-search"),
      status: document.getElementById("atlas-search-results-status"),
      results: document.getElementById("atlas-search-results"),
    }
  }

  function renderMobileSearchResults(query = mobileSearchQuery) {
    const { status, results } = searchSheetElements()
    if (!status || !results) return
    const normalizedQuery = String(query || "").trim()
    clear(results)
    if (!normalizedQuery) {
      status.textContent = "Digite um conceito para começar a explorar."
      return
    }

    const queryParts = searchQuery(normalizedQuery)
    const matches = atlas.data.sortedConcepts().filter((node) => searchMatch(node, queryParts))
    const visibleMatches = matches.slice(0, 50)
    status.textContent = matches.length
      ? matches.length + (matches.length === 1 ? " conceito encontrado" : " conceitos encontrados")
      : "Nenhum conceito encontrado."
    for (const node of visibleMatches) {
      const result = make("button", "atlas-mobile-search-result")
      result.type = "button"
      result.dataset.atlasAction = "open-search-result"
      result.dataset.atlasSlug = node.slug
      result.setAttribute("role", "option")
      result.setAttribute(
        "aria-label",
        node.title + ", " + node.areaLabel + (node.isDevelopment ? ", em desenvolvimento" : ""),
      )
      const title = make("strong", "atlas-mobile-search-result-title", node.title)
      const meta = make(
        "span",
        "atlas-mobile-search-result-meta",
        (node.isDevelopment ? "Em desenvolvimento · " : "") + node.areaLabel,
      )
      result.append(title, meta)
      results.appendChild(result)
    }
    if (matches.length > visibleMatches.length) {
      const more = make(
        "p",
        "atlas-mobile-search-results-more",
        "Refine a busca para ver mais resultados.",
      )
      results.appendChild(more)
    }
  }

  function closeSearch(focusTrigger = true) {
    cancelMobileSearchTimer()
    const { sheet, input } = searchSheetElements()
    if (!sheet) return
    mobileSearchQuery = input?.value ?? mobileSearchQuery
    if (document.activeElement === input) input.blur()
    sheet.classList.remove("is-open")
    sheet.setAttribute("aria-hidden", "true")
    syncModalLock()
    window.setTimeout(() => {
      if (!sheet.classList.contains("is-open")) sheet.hidden = true
    }, 220)
    const opener = searchOpener
    searchOpener = null
    if (focusTrigger) opener?.focus({ preventScroll: true })
  }

  function openSearch() {
    if (!isUnlocked()) return
    const { sheet, input } = searchSheetElements()
    if (!sheet || !input) return
    closeAreaMenu()
    closeAreaSheet(false)
    closeMobileMenu(false)
    searchOpener = mobileOpener(document.querySelector(".atlas-mobile-search-trigger"))
    input.value = mobileSearchQuery
    renderMobileSearchResults(input.value)
    sheet.hidden = false
    sheet.setAttribute("aria-hidden", "false")
    root().classList.add("atlas-modal-open")
    sheet.classList.add("is-open")
    input.focus({ preventScroll: true })
    window.requestAnimationFrame(() => input.focus({ preventScroll: true }))
  }

  function mobileMenuElements() {
    return {
      sheet: document.getElementById("atlas-mobile-menu"),
      close: document.querySelector('#atlas-mobile-menu [data-atlas-action="close-mobile-menu"]'),
      trigger: document.querySelector('[data-atlas-action="toggle-mobile-menu"]'),
    }
  }

  function renderMobileMenuState() {
    const { sheet, trigger } = mobileMenuElements()
    if (!sheet || !trigger) return
    const open = overlayIsOpen("atlas-mobile-menu")
    trigger.setAttribute("aria-expanded", String(open))
    sheet.setAttribute("aria-hidden", String(!open))
  }

  function closeMobileMenu(focusTrigger = true) {
    const { sheet, trigger } = mobileMenuElements()
    if (!sheet) return
    sheet.classList.remove("is-open")
    sheet.setAttribute("aria-hidden", "true")
    syncModalLock()
    window.setTimeout(() => {
      if (!sheet.classList.contains("is-open")) sheet.hidden = true
    }, 220)
    const opener = mobileMenuOpener
    mobileMenuOpener = null
    if (focusTrigger) (opener || trigger)?.focus({ preventScroll: true })
    renderMobileMenuState()
  }

  function openMobileMenu() {
    if (!isUnlocked()) return
    const { sheet, close, trigger } = mobileMenuElements()
    if (!sheet) return
    closeSearch(false)
    closeAreaSheet(false)
    closeAreaMenu()
    mobileMenuOpener = trigger
    sheet.hidden = false
    sheet.setAttribute("aria-hidden", "false")
    root().classList.add("atlas-modal-open")
    window.requestAnimationFrame(() => {
      sheet.classList.add("is-open")
      close?.focus({ preventScroll: true })
      renderMobileMenuState()
    })
  }

  function toggleMobileMenu() {
    if (overlayIsOpen("atlas-mobile-menu")) closeMobileMenu(true)
    else openMobileMenu()
  }

  function handleAreaKeydown(event) {
    const target = event.target instanceof Element ? event.target : null
    if (!target) return false
    const { menu, trigger } = areaPickerElements()
    const key = event.key
    const isConfirm = key === "Enter" || key === " " || key === "Spacebar"
    const triggerTarget = target.closest("[data-atlas-area-trigger]")
    if (triggerTarget && trigger === triggerTarget) {
      if (key === "ArrowDown" || key === "ArrowUp") {
        event.preventDefault()
        if (menu?.hidden) openAreaMenu(true)
        else
          areaOptions(menu)
            .find((option) => option.getAttribute("aria-selected") === "true")
            ?.focus()
        return true
      }
      if (isConfirm) {
        event.preventDefault()
        toggleAreaMenu()
        return true
      }
      if (key === "Escape" && menu && !menu.hidden) {
        event.preventDefault()
        closeAreaMenu(true)
        return true
      }
    }

    const optionTarget = target.closest("[data-atlas-area-value]")
    const sheetOptions = document.getElementById("atlas-area-sheet-options")
    const inSheet = Boolean(optionTarget && sheetOptions?.contains(optionTarget))
    if (!optionTarget || (inSheet ? !overlayIsOpen("atlas-area-sheet") : !menu || menu.hidden))
      return false
    const options = areaOptions(inSheet ? sheetOptions : menu)
    const currentIndex = options.indexOf(optionTarget)
    if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault()
      const offset = key === "ArrowDown" ? 1 : -1
      options[(currentIndex + offset + options.length) % options.length]?.focus()
      return true
    }
    if (key === "Home" || key === "End") {
      event.preventDefault()
      options[key === "Home" ? 0 : options.length - 1]?.focus()
      return true
    }
    if (isConfirm) {
      event.preventDefault()
      selectArea(optionTarget.dataset.atlasAreaValue || "all")
      return true
    }
    if (key === "Escape") {
      event.preventDefault()
      if (inSheet) closeAreaSheet(true)
      else closeAreaMenu(true)
      return true
    }
    return false
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

  const automaticHeadingAnchorSelector = [
    '.atlas-note-content article h1 > a[role="anchor"]',
    '.atlas-note-content article h2 > a[role="anchor"]',
    '.atlas-note-content article h3 > a[role="anchor"]',
    '.atlas-note-content article h4 > a[role="anchor"]',
    '.atlas-note-content article h5 > a[role="anchor"]',
    '.atlas-note-content article h6 > a[role="anchor"]',
  ].join(",")

  function removeAutomaticHeadingAnchors() {
    document.querySelectorAll(automaticHeadingAnchorSelector).forEach((anchor) => anchor.remove())
  }

  function enhanceLinks() {
    removeAutomaticHeadingAnchors()
    const anchors = document.querySelectorAll("a.internal, a[data-atlas-target]")
    for (const anchor of anchors) {
      const slug = targetFromAnchor(anchor)
      if (!slug) continue
      anchor.dataset.atlasTarget = slug
      anchor.dataset.routerIgnore = ""
      const node = atlas.data.get(slug)
      if (node?.isDevelopment) anchor.dataset.atlasDevelopment = "true"
    }
  }

  function positionPreview(anchor) {
    const preview = document.getElementById(previewId)
    if (!preview || !anchor) return
    const margin = 16
    const viewportWidth = window.visualViewport?.width || window.innerWidth
    const viewportHeight = window.visualViewport?.height || window.innerHeight
    const previewWidth = Math.min(360, viewportWidth - margin * 2)
    preview.style.width = previewWidth + "px"
    const previewHeight = preview.offsetHeight || 190
    let left = anchor.left
    let top = anchor.bottom + margin
    if (left + previewWidth > viewportWidth - margin) left = viewportWidth - previewWidth - margin
    if (left < margin) left = margin
    if (top + previewHeight > viewportHeight - margin) top = anchor.top - previewHeight - margin
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
    preview.classList.remove("is-open")
    preview.setAttribute("aria-hidden", "true")
    previewTimer = window.setTimeout(
      () => {
        if (preview.matches(":hover")) return
        preview.hidden = true
        previewSlug = ""
        previewAnchor = null
      },
      delay === 0 ? 180 : delay,
    )
  }

  function showPreview(node, anchor) {
    const preview = document.getElementById(previewId)
    if (!preview || !node) return
    cancelPreviewHide()
    previewAnchor = anchor
    if (previewSlug !== node.slug) {
      previewSlug = node.slug
      clear(preview)
      const kicker = make(
        "p",
        "atlas-preview-kicker",
        node.isDevelopment ? "EM DESENVOLVIMENTO" : "CONCEITO",
      )
      const title = make("h2", "atlas-preview-title", node.title)
      const area = make("p", "atlas-preview-area", node.areaLabel)
      const excerpt = make(
        "p",
        "atlas-preview-excerpt",
        node.isDevelopment
          ? "Este termo está em desenvolvimento."
          : node.excerpt || "Abra a nota para explorar este conceito.",
      )
      const open = button(
        node.isDevelopment ? "Ver estado" : "Abrir nota",
        "open-preview",
        "atlas-preview-open",
      )
      open.dataset.atlasSlug = node.slug
      preview.append(kicker, title, area, excerpt, open)
    }
    preview.hidden = false
    window.requestAnimationFrame(() => {
      preview.classList.add("is-open")
      preview.setAttribute("aria-hidden", "false")
      positionPreview(anchor)
    })
  }

  function previewForAnchor(anchor) {
    const slug = targetFromAnchor(anchor)
    const node = slug ? atlas.data.get(slug) : null
    if (node) showPreview(node, anchor.getBoundingClientRect())
  }

  function syncViewportMetrics() {
    const viewport = window.visualViewport
    const height = Math.max(1, viewport?.height || window.innerHeight)
    const width = Math.max(1, viewport?.width || window.innerWidth)
    root().style.setProperty("--atlas-visual-height", height + "px")
    root().style.setProperty("--atlas-visual-width", width + "px")
    root().style.setProperty("--atlas-viewport-offset-top", (viewport?.offsetTop || 0) + "px")
    const active = document.activeElement
    const keyboardOpen =
      Boolean(active instanceof HTMLElement && active.matches("input, textarea, select")) &&
      height < window.innerHeight - 120
    root().classList.toggle("atlas-keyboard-open", keyboardOpen)
    if (previewAnchor && previewSlug) positionPreview(previewAnchor)
    const { menu } = areaPickerElements()
    if (menu && !menu.hidden) positionAreaMenu()
  }

  function dismissTouchHint() {
    if (touchHintTimer) window.clearTimeout(touchHintTimer)
    touchHintTimer = 0
    const hint = document.getElementById("atlas-touch-hint")
    if (hint) {
      hint.classList.remove("is-visible")
      hint.hidden = true
    }
    writeStorage(touchHintKey, "complete")
  }

  function maybeShowTouchHint() {
    const hint = document.getElementById("atlas-touch-hint")
    if (
      !hint ||
      touchHintShown ||
      !isTouchDevice() ||
      viewState.mode !== "graph" ||
      readStorage(touchHintKey) === "complete" ||
      overlayIsOpen("atlas-onboarding")
    )
      return
    touchHintShown = true
    hint.hidden = false
    window.requestAnimationFrame(() => hint.classList.add("is-visible"))
    if (touchHintTimer) window.clearTimeout(touchHintTimer)
    touchHintTimer = window.setTimeout(dismissTouchHint, 4600)
  }

  function pushGraphContext(slug) {
    const current =
      window.history.state && typeof window.history.state === "object" ? window.history.state : {}
    window.history.replaceState(
      { ...current, atlasView: "graph", contextSlug: slug || "" },
      "",
      pathFor("index"),
    )
  }

  async function openConcept(slug, { source = "navigation" } = {}) {
    const node = atlas.data.get(slug)
    if (!node) return
    const serial = ++navigationSerial
    atlas.graph?.persist()
    hidePreview(0)
    closeSearch(false)
    closeAreaSheet(false)
    closeAreaMenu()
    closeMobileMenu(false)
    setRouteLoading(true)
    try {
      await ensureNoteContent(node)
      if (serial !== navigationSerial) return
      rememberLastNote(node)
      const wasNote = viewState.mode === "note"
      if (!wasNote) pushGraphContext(node.slug)
      window.history.pushState({ atlasView: "note", slug: node.slug }, "", pathFor(node.slug))
      viewState = { mode: "note", noteSlug: node.slug, openedFromGraph: true }
      placeGraphRoot("note")
      renderViewState()
      renderNavState()
      atlas.graph?.setMode("minimap", node.slug)
      enhanceLinks()
      document.dispatchEvent(
        new CustomEvent("atlas:concept-opened", {
          detail: { slug: node.slug, title: node.title, source },
        }),
      )
      setRouteLoading(false)
      window.requestAnimationFrame(() => document.getElementById("atlas-note-title")?.focus())
    } catch (error) {
      console.error("O Atlas não conseguiu abrir a nota.", error)
      setRouteLoading(false)
      const content = document.getElementById("atlas-note-content")
      if (content) {
        clear(content)
        content.appendChild(
          make("p", "atlas-note-error", "Não foi possível abrir esta nota. Tente novamente."),
        )
      }
    }
  }

  function showGraph({ historyMode = "none", contextSlug = "" } = {}) {
    navigationSerial += 1
    atlas.graph?.persist()
    hidePreview(0)
    closeSearch(false)
    closeAreaSheet(false)
    closeAreaMenu()
    closeMobileMenu(false)
    if (historyMode === "push")
      window.history.pushState({ atlasView: "graph", contextSlug }, "", pathFor("index"))
    if (historyMode === "replace")
      window.history.replaceState({ atlasView: "graph", contextSlug }, "", pathFor("index"))
    viewState = { mode: "graph", noteSlug: "", openedFromGraph: false }
    placeGraphRoot("graph")
    atlas.graph?.mountAll()
    renderViewState()
    renderNavState()
    atlas.graph?.setMode("explore", contextSlug)
    enhanceLinks()
    setRouteLoading(false)
    window.requestAnimationFrame(() => atlas.graph?.getState()?.canvas?.focus())
  }

  function goTo(slug) {
    const node = atlas.data.get(slug)
    if (node) {
      openConcept(node.slug)
      return
    }
    if (normalizeSlug(slug) === "index") showGraph({ historyMode: "push" })
    else window.location.assign(pathFor(slug))
  }

  function goBack() {
    if (
      viewState.mode === "note" &&
      viewState.openedFromGraph &&
      window.history.state?.atlasView === "note"
    ) {
      window.history.back()
    } else {
      showGraph({ historyMode: "push", contextSlug: viewState.noteSlug })
    }
  }

  function expandGraph() {
    showGraph({ historyMode: "replace", contextSlug: viewState.noteSlug })
  }

  function returnToNote() {
    const slug = readSession(lastNoteKey)
    if (slug && atlas.data.get(slug)) openConcept(slug)
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
      progress: overlay.querySelector("[data-atlas-onboarding-progress]"),
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
    if (elements.count)
      elements.count.textContent = number + " / " + String(elements.steps.length).padStart(2, "0")
    if (elements.progress)
      elements.progress.style.setProperty("--atlas-onboarding-progress", String(onboardingStep + 1))
    if (elements.next)
      elements.next.textContent =
        onboardingStep === elements.steps.length - 1 ? "Entrar no grafo" : "Continuar"
  }

  function closeOnboarding(markComplete = true) {
    const elements = onboardingElements()
    if (!elements) return
    const opener = onboardingOpener
    onboardingOpener = null
    if (markComplete) writeStorage(onboardingKey, "complete")
    elements.overlay.classList.remove("is-open")
    elements.overlay.setAttribute("aria-hidden", "true")
    root().classList.remove("atlas-onboarding-open")
    syncModalLock()
    window.setTimeout(() => {
      if (!elements.overlay.classList.contains("is-open")) elements.overlay.hidden = true
    }, 220)
    window.requestAnimationFrame(() => opener?.focus())
    window.setTimeout(maybeShowTouchHint, 240)
  }

  function openOnboarding(force = false) {
    if (!isUnlocked()) return
    const elements = onboardingElements()
    if (!elements || (!force && onboardingComplete())) return
    onboardingStep = 0
    onboardingOpener = preferredOpener(document.getElementById("atlas-onboarding-open"))
    elements.overlay.hidden = false
    elements.overlay.setAttribute("aria-hidden", "false")
    window.requestAnimationFrame(() => elements.overlay.classList.add("is-open"))
    root().classList.add("atlas-onboarding-open")
    root().classList.add("atlas-modal-open")
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

  function helpElements() {
    const overlay = document.getElementById("atlas-help")
    if (!overlay) return null
    return { overlay, close: overlay.querySelector('[data-atlas-action="close-help"]') }
  }

  function openHelp() {
    if (!isUnlocked()) return
    const elements = helpElements()
    if (!elements) return
    helpOpener = preferredOpener(document.getElementById("atlas-help-open"))
    elements.overlay.hidden = false
    elements.overlay.setAttribute("aria-hidden", "false")
    window.requestAnimationFrame(() => elements.overlay.classList.add("is-open"))
    root().classList.add("atlas-help-open")
    root().classList.add("atlas-modal-open")
    window.requestAnimationFrame(() => elements.close?.focus())
  }

  function closeHelp() {
    const elements = helpElements()
    if (!elements) return
    const opener = helpOpener
    helpOpener = null
    elements.overlay.classList.remove("is-open")
    elements.overlay.setAttribute("aria-hidden", "true")
    root().classList.remove("atlas-help-open")
    syncModalLock()
    window.setTimeout(() => {
      if (!elements.overlay.classList.contains("is-open")) elements.overlay.hidden = true
    }, 220)
    window.requestAnimationFrame(() => opener?.focus())
  }

  function reportElements() {
    const overlay = document.getElementById("atlas-report")
    if (!overlay) return null
    return {
      overlay,
      close: overlay.querySelector('[data-atlas-action="close-report"]'),
      link: overlay.querySelector("[data-atlas-report-link]"),
      concept: overlay.querySelector("[data-atlas-report-concept]"),
    }
  }

  function reportHref() {
    const node = viewState.noteSlug ? atlas.data.get(viewState.noteSlug) : null
    const title = node?.title || "esta nota"
    const message = `Olá, encontrei um problema no conceito "${title}" do Atlas. Pode me ajudar?`
    return "https://wa.me/5512997505188?text=" + encodeURIComponent(message)
  }

  function openReport() {
    if (!isUnlocked() || viewState.mode !== "note") return
    const elements = reportElements()
    if (!elements) return
    const node = viewState.noteSlug ? atlas.data.get(viewState.noteSlug) : null
    if (elements.concept) elements.concept.textContent = node?.title || "esta nota"
    if (elements.link) elements.link.href = reportHref()
    reportOpener = preferredOpener(document.querySelector('[data-atlas-action="open-report"]'))
    elements.overlay.hidden = false
    elements.overlay.setAttribute("aria-hidden", "false")
    root().classList.add("atlas-modal-open")
    window.requestAnimationFrame(() => {
      elements.overlay.classList.add("is-open")
      elements.close?.focus()
    })
  }

  function closeReport() {
    const elements = reportElements()
    if (!elements) return
    const opener = reportOpener
    reportOpener = null
    elements.overlay.classList.remove("is-open")
    elements.overlay.setAttribute("aria-hidden", "true")
    syncModalLock()
    window.setTimeout(() => {
      if (!elements.overlay.classList.contains("is-open")) elements.overlay.hidden = true
    }, 220)
    window.requestAnimationFrame(() => opener?.focus())
  }

  function handleAction(target) {
    const action = target.dataset.atlasAction
    if (action === "toggle-theme") {
      setTheme((root().dataset.theme || currentTheme()) === "dark" ? "light" : "dark")
    } else if (action === "open-search") {
      openSearch()
    } else if (action === "close-search") {
      closeSearch(true)
    } else if (action === "open-search-result") {
      closeSearch(false)
      mobileSearchQuery = ""
      openConcept(target.dataset.atlasSlug || "", { source: "search" })
    } else if (action === "open-area") {
      openAreaSheet()
    } else if (action === "close-area") {
      closeAreaSheet(true)
    } else if (action === "toggle-mobile-menu") {
      toggleMobileMenu()
    } else if (action === "close-mobile-menu") {
      closeMobileMenu(true)
    } else if (action === "toggle-nav") {
      setNavHidden(true)
    } else if (action === "show-nav") {
      setNavHidden(false)
    } else if (action === "go-home") {
      showGraph({ historyMode: "push" })
    } else if (action === "go-back") {
      goBack()
    } else if (action === "expand-graph") {
      expandGraph()
    } else if (action === "return-note") {
      returnToNote()
    } else if (action === "open-preview") {
      openConcept(target.dataset.atlasSlug, { source: "preview" })
    } else if (action === "onboarding-next") {
      advanceOnboarding()
    } else if (action === "open-onboarding") {
      closeMobileMenu(false)
      openOnboarding(true)
    } else if (action === "onboarding-skip") {
      closeOnboarding()
    } else if (action === "open-help") {
      closeMobileMenu(false)
      openHelp()
    } else if (action === "close-help") {
      closeHelp()
    } else if (action === "open-report") {
      openReport()
    } else if (action === "close-report") {
      closeReport()
    }
  }

  function handleClick(event) {
    const picker =
      event.target instanceof Element ? event.target.closest("[data-atlas-area-picker]") : null
    if (picker) {
      const option =
        event.target instanceof Element ? event.target.closest("[data-atlas-area-value]") : null
      if (option && picker.contains(option)) {
        event.preventDefault()
        event.stopPropagation()
        selectArea(option.dataset.atlasAreaValue || "all")
        return
      }
      const trigger =
        event.target instanceof Element ? event.target.closest("[data-atlas-area-trigger]") : null
      if (trigger && picker.contains(trigger)) {
        event.preventDefault()
        event.stopPropagation()
        toggleAreaMenu()
      }
      return
    }
    const areaSheet =
      event.target instanceof Element ? event.target.closest("#atlas-area-sheet") : null
    if (areaSheet) {
      const option =
        event.target instanceof Element ? event.target.closest("[data-atlas-area-value]") : null
      if (option && areaSheet.contains(option)) {
        event.preventDefault()
        event.stopPropagation()
        selectArea(option.dataset.atlasAreaValue || "all")
        return
      }
    }
    closeAreaMenu()
    const target =
      event.target instanceof Element ? event.target.closest("[data-atlas-action]") : null
    if (target) {
      event.preventDefault()
      event.stopPropagation()
      handleAction(target)
      return
    }
    const anchor =
      event.target instanceof Element
        ? event.target.closest("a.internal, a[data-atlas-target]")
        : null
    if (!anchor) return
    const slug = targetFromAnchor(anchor)
    if (!slug) return
    event.preventDefault()
    event.stopPropagation()
    hidePreview(0)
    openConcept(slug, { source: "note" })
  }

  function handlePointerOver(event) {
    if (event.pointerType && event.pointerType !== "mouse") return
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
    if (event.pointerType && event.pointerType !== "mouse") return
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
    if (handleAreaKeydown(event)) return
    if (event.key !== "Escape") return
    if (overlayIsOpen("atlas-search-sheet")) {
      closeSearch(true)
      return
    }
    if (overlayIsOpen("atlas-area-sheet")) {
      closeAreaSheet(true)
      return
    }
    if (overlayIsOpen("atlas-mobile-menu")) {
      closeMobileMenu(true)
      return
    }
    const { menu } = areaPickerElements()
    if (menu && !menu.hidden) {
      closeAreaMenu()
      return
    }
    const onboarding = onboardingElements()
    if (onboarding && !onboarding.overlay.hidden) {
      closeOnboarding()
      return
    }
    const help = helpElements()
    if (help && !help.overlay.hidden) {
      closeHelp()
      return
    }
    const report = reportElements()
    if (report && !report.overlay.hidden) {
      closeReport()
      return
    }
    hidePreview(0)
    if (root().classList.contains("atlas-nav-hidden")) setNavHidden(false)
  }

  function handleModalTab(event) {
    if (event.key !== "Tab") return
    const onboarding = onboardingElements()
    const help = helpElements()
    const report = reportElements()
    const overlay = [
      document.getElementById("atlas-search-sheet"),
      document.getElementById("atlas-area-sheet"),
      document.getElementById("atlas-mobile-menu"),
      onboarding?.overlay,
      help?.overlay,
      report?.overlay,
    ].find((candidate) => candidate && !candidate.hidden && candidate.classList.contains("is-open"))
    if (!overlay) return
    const items = focusable(overlay)
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
    if (event?.target === area) {
      cancelFilterTimer()
      selectedArea = area.value
      setAreaPickerValue(selectedArea)
      applyFilters()
      return
    }
    if (event?.target !== search) return
    scheduleFilterApply()
  }

  function handleMobileSearchInput(event) {
    if (event?.target?.id !== "atlas-mobile-search") return
    mobileSearchQuery = event.target.value
    cancelMobileSearchTimer()
    mobileSearchTimer = window.setTimeout(() => {
      mobileSearchTimer = 0
      renderMobileSearchResults(mobileSearchQuery)
    }, 80)
  }

  function stateFromLocation() {
    const slug = locationSlug()
    const node = atlas.data.get(slug)
    return slug === "index"
      ? { mode: "graph", noteSlug: "", openedFromGraph: false }
      : slug === "roadmap"
        ? { mode: "roadmap", noteSlug: "", openedFromGraph: false }
        : node
          ? { mode: "note", noteSlug: node.slug, openedFromGraph: false }
          : null
  }

  async function renderInitialRoute() {
    const next = stateFromLocation()
    if (!next) return
    viewState = next
    if (next.mode === "roadmap") {
      renderViewState()
      renderNavState()
      return
    }
    if (next.mode === "note") {
      const node = atlas.data.get(next.noteSlug)
      if (!node) return
      rememberLastNote(node)
      if (node.isDevelopment) renderNoteContent(node)
      placeGraphRoot("note")
      const graph = graphRoot()
      if (graph) graph.dataset.atlasGraphMode = "minimap"
      atlas.graph?.mountAll()
      renderViewState()
      renderNavState()
      atlas.graph?.setMode("minimap", node.slug)
      await ensureNoteContent(node)
      enhanceLinks()
    } else {
      placeGraphRoot("graph")
      const graph = graphRoot()
      if (graph) graph.dataset.atlasGraphMode = "explore"
      atlas.graph?.mountAll()
      renderViewState()
      renderNavState()
      enhanceLinks()
    }
  }

  async function refresh() {
    const serial = ++refreshSerial
    setTheme(root().dataset.theme || currentTheme())
    if (!isUnlocked()) {
      setRouteLoading(false)
      hidePreview(0)
      closeSearch(false)
      closeAreaSheet(false)
      closeAreaMenu()
      closeMobileMenu(false)
      atlas.graph?.persist()
      atlas.graph?.destroyAll()
      return
    }
    setRouteLoading(true)
    try {
      if (locationSlug() === "roadmap") {
        viewState = { mode: "roadmap", noteSlug: "", openedFromGraph: false }
        renderViewState()
        renderNavState()
        setRouteLoading(false)
        return
      }
      await atlas.data.load()
      if (serial !== refreshSerial) return
      document.dispatchEvent(new CustomEvent("atlas:data-ready"))
      selectedArea = "all"
      renderAreas()
      await renderInitialRoute()
      if (serial !== refreshSerial) return
      renderNavState()
      if (viewState.mode === "graph") openOnboarding()
      setRouteLoading(false)
      window.setTimeout(maybeShowTouchHint, 260)
    } catch (error) {
      console.error("O Atlas não conseguiu carregar o grafo.", error)
      const mount = document.querySelector("[data-atlas-graph-mount]")
      mount?.querySelector(".atlas-graph-loading")?.remove()
      if (mount && !mount.querySelector(".atlas-graph-error"))
        mount.appendChild(
          make("p", "atlas-graph-error", "Não foi possível carregar o grafo. Recarregue a página."),
        )
      setRouteLoading(false)
    }
  }

  function handlePopState(event) {
    if (!isAtlasLocation() || !isUnlocked() || !atlas.data.index) return
    const state = event.state || {}
    const slug = locationSlug()
    if (slug === "index") {
      showGraph({ contextSlug: state.contextSlug || "" })
      return
    }
    const node = atlas.data.get(slug)
    if (node) {
      navigationSerial += 1
      ensureNoteContent(node)
        .then(() => {
          if (locationSlug() !== node.slug) return
          rememberLastNote(node)
          viewState = {
            mode: "note",
            noteSlug: node.slug,
            openedFromGraph: state.atlasView === "note",
          }
          placeGraphRoot("note")
          renderViewState()
          renderNavState()
          atlas.graph?.setMode("minimap", node.slug)
          enhanceLinks()
          setRouteLoading(false)
        })
        .catch((error) => console.error("Não foi possível restaurar a nota do Atlas.", error))
    }
  }

  document.addEventListener("click", handleClick, true)
  document.addEventListener("pointerover", handlePointerOver)
  document.addEventListener("pointerout", handlePointerOut)
  document.addEventListener("focusin", handleFocusIn)
  document.addEventListener("keydown", handleKeydown)
  document.addEventListener("keydown", handleModalTab)
  document.addEventListener("input", handleFilters)
  document.addEventListener("input", handleMobileSearchInput)
  document.addEventListener("change", handleFilters)
  document.addEventListener("prenav", () => {
    cancelFilterTimer()
    cancelMobileSearchTimer()
    setRouteLoading(true)
    hidePreview(0)
    atlas.graph?.persist()
    atlas.graph?.destroyAll()
  })
  document.addEventListener("nav", () => {
    setRouteLoading(false)
    refresh()
  })
  window.addEventListener("popstate", handlePopState)
  const onViewportChange = () => {
    if (viewportMetricsFrame) return
    viewportMetricsFrame = window.requestAnimationFrame(() => {
      viewportMetricsFrame = 0
      syncViewportMetrics()
    })
  }
  window.addEventListener("resize", onViewportChange)
  window.addEventListener("orientationchange", onViewportChange)
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", onViewportChange)
    window.visualViewport.addEventListener("scroll", onViewportChange)
  }
  syncViewportMetrics()
  window.addEventListener("pagehide", () => {
    cancelFilterTimer()
    cancelMobileSearchTimer()
    if (viewportMetricsFrame) {
      window.cancelAnimationFrame(viewportMetricsFrame)
      viewportMetricsFrame = 0
    }
    atlas.graph?.persist()
  })
  document.addEventListener("atlas-access", refresh)

  setTheme(currentTheme())
  atlas.app = {
    runtimeVersion: 3,
    dismissTouchHint,
    goTo,
    hidePreview,
    openConcept,
    refresh,
    showGraphPreview: showPreview,
  }
  refresh()
})()
