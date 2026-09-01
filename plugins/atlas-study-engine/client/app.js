;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  const {
    button,
    clear,
    focusable,
    iconButton,
    link,
    make,
    normalizeSlug,
    normalizeText,
    pathFor,
    routeSlug,
    setHidden,
    svgIcon,
  } = atlas.dom
  const runtimeKey = "__nutriworkAtlasStudyRuntime"
  const paletteState = { index: -1, commands: [] }
  const appState = {
    bound: false,
    loaded: false,
    refreshPromise: null,
    refreshQueued: false,
    selection: null,
    previewTimer: null,
    previewHideTimer: null,
    lastOverlayTrigger: null,
    lastRoute: "",
    readingTimer: null,
    themeButton: null,
  }

  function currentNode() {
    return atlas.data.get(routeSlug())
  }

  function goTo(slug) {
    const normalized = normalizeSlug(slug)
    const url = new URL(pathFor(normalized), window.location.origin)
    if (typeof window.spaNavigate === "function") window.spaNavigate(url, false)
    else window.location.assign(url.toString())
  }

  function gapPath(title) {
    const url = new URL(pathFor("lacunas-da-rede"), window.location.origin)
    url.searchParams.set("concept", title || "Referência")
    return url.pathname + url.search
  }

  function getTheme() {
    try {
      const stored = window.localStorage.getItem("nutriwork-theme")
      if (stored === "light" || stored === "dark") return stored
    } catch {
      // The first-paint script already selected a safe default.
    }
    return document.documentElement.getAttribute("data-theme") || "dark"
  }

  function setTheme(theme, announce) {
    const next = theme === "light" ? "light" : "dark"
    const root = document.documentElement
    root.classList.add("atlas-theme-transition")
    root.setAttribute("saved-theme", next)
    root.setAttribute("data-theme", next)
    root.style.colorScheme = next
    document.body?.setAttribute("data-theme", next)
    try {
      window.localStorage.setItem("nutriwork-theme", next)
    } catch (error) {
      console.warn("Tema não pôde ser salvo", error)
    }
    atlas.state.savePreferences({ theme: next })
    updateThemeButton()
    window.setTimeout(() => root.classList.remove("atlas-theme-transition"), 380)
    if (announce) toast(next === "dark" ? "Tema escuro ativado" : "Tema claro ativado")
  }

  function createThemeButton() {
    const slot = document.getElementById("atlas-theme-slot")
    if (!slot) return
    if (slot.querySelector(".theme-toggle")) {
      appState.themeButton = slot.querySelector(".theme-toggle")
      updateThemeButton()
      return
    }
    const toggle = make("button", "theme-toggle")
    toggle.type = "button"
    toggle.dataset.atlasAction = "toggle-theme"
    toggle.setAttribute("aria-label", "Alternar tema")
    const track = make("span", "theme-toggle__track")
    const sun = make("span", "theme-toggle__icon theme-toggle__icon--sun")
    sun.appendChild(svgIcon("sun"))
    const moon = make("span", "theme-toggle__icon theme-toggle__icon--moon")
    moon.appendChild(svgIcon("moon"))
    const thumb = make("span", "theme-toggle__thumb")
    thumb.appendChild(svgIcon(getTheme() === "dark" ? "moon" : "sun"))
    track.appendChild(sun)
    track.appendChild(moon)
    track.appendChild(thumb)
    toggle.appendChild(track)
    slot.appendChild(toggle)
    appState.themeButton = toggle
    updateThemeButton()
  }

  function updateThemeButton() {
    const toggle = appState.themeButton || document.querySelector(".theme-toggle")
    if (!toggle) return
    const theme = getTheme()
    toggle.dataset.theme = theme
    toggle.setAttribute("aria-label", theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro")
    toggle.title = theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"
    const thumb = toggle.querySelector(".theme-toggle__thumb")
    if (thumb) {
      clear(thumb)
      thumb.appendChild(svgIcon(theme === "dark" ? "moon" : "sun"))
    }
  }

  function toast(message, tone) {
    const region = document.getElementById("atlas-toast-region")
    if (!region) return
    const item = make("div", "atlas-toast is-" + (tone || "info"), message)
    region.appendChild(item)
    window.setTimeout(() => {
      item.classList.add("is-leaving")
      window.setTimeout(() => item.remove(), 300)
    }, 3200)
  }

  function setOverlay(overlay, open, trigger) {
    if (!overlay) return
    if (open) {
      appState.lastOverlayTrigger = trigger || document.activeElement
      setHidden(overlay, false)
      overlay.classList.add("is-open")
      document.documentElement.classList.add("atlas-overlay-open")
    } else {
      overlay.classList.remove("is-open")
      setHidden(overlay, true)
      if (
        ![...document.querySelectorAll(".atlas-overlay, .atlas-modal-overlay")].some(
          (item) => !item.hidden,
        )
      )
        document.documentElement.classList.remove("atlas-overlay-open")
      if (
        appState.lastOverlayTrigger instanceof HTMLElement &&
        appState.lastOverlayTrigger.getClientRects().length
      )
        appState.lastOverlayTrigger.focus()
      appState.lastOverlayTrigger = null
    }
  }

  function closePalette() {
    setOverlay(document.getElementById("atlas-command-palette"), false)
    setOverlay(document.getElementById("atlas-advanced-search-modal"), false)
  }

  function paletteCommand(label, detail, action, value) {
    return { label, detail, action, value }
  }

  function openPalette(trigger) {
    const overlay = document.getElementById("atlas-command-palette")
    if (!overlay) return
    renderPaletteResults("")
    setOverlay(overlay, true, trigger)
    window.requestAnimationFrame(() => document.getElementById("atlas-command-input")?.focus())
  }

  function renderPaletteResults(query) {
    const result = document.getElementById("atlas-command-results")
    if (!result) return
    clear(result)
    const commands = [
      paletteCommand("Abrir Hoje", "Seu painel de estudo", "navigate", "hoje"),
      paletteCommand("Começar uma sessão", "Active recall", "start-study"),
      paletteCommand("Revisar hoje", "Revisões vencidas", "navigate", "revisar"),
      paletteCommand("Explorar o grafo", "Mapa de relações", "navigate", "grafo"),
      paletteCommand("Abrir trilhas", "Sequências guiadas", "navigate", "trilhas"),
      paletteCommand("Abrir biblioteca", "Destaques e cartões", "navigate", "biblioteca"),
      paletteCommand("Conceito aleatório", "Deixe a rede escolher", "random"),
    ]
    const concepts = atlas.data
      .concepts()
      .filter((node) => atlas.dom.searchMatch(node, query))
      .slice(0, 8)
      .map((node) => paletteCommand(node.title, node.areaLabel, "navigate", node.slug))
    paletteState.commands = [...commands, ...concepts]
    const visible = paletteState.commands.slice(0, 16)
    visible.forEach((command, index) => {
      const row = button(
        "",
        "palette-command",
        "atlas-palette-command" + (index === 0 ? " is-selected" : ""),
      )
      row.dataset.commandIndex = String(index)
      row.dataset.commandAction = command.action
      if (command.value) row.dataset.commandValue = command.value
      row.appendChild(
        make(
          "span",
          "atlas-palette-command-icon",
          command.action === "navigate" ? "↗" : command.action === "random" ? "✦" : "◌",
        ),
      )
      const copy = make("span", "atlas-palette-command-copy")
      copy.appendChild(make("strong", null, command.label))
      copy.appendChild(make("small", null, command.detail))
      row.appendChild(copy)
      result.appendChild(row)
    })
    paletteState.index = visible.length ? 0 : -1
    if (!visible.length)
      result.appendChild(make("p", "atlas-empty-copy", "Nenhum comando encontrado."))
  }

  function executePaletteCommand(target) {
    const command = paletteState.commands[Number(target?.dataset.commandIndex)]
    if (!command) return
    closePalette()
    if (command.action === "navigate") goTo(command.value)
    else if (command.action === "random") randomConcept()
    else if (command.action === "start-study") atlas.views.openStudySetup()
  }

  function openAdvancedSearch(area) {
    const overlay = document.getElementById("atlas-advanced-search-modal")
    const content = document.getElementById("atlas-advanced-search-modal-content")
    if (!overlay || !content) return
    clear(content)
    const form = make("form", "atlas-modal-form atlas-advanced-search-form")
    form.dataset.atlasForm = "advanced-search"
    const query = make("input", "atlas-search-input")
    query.name = "query"
    query.type = "search"
    query.placeholder = "Buscar por título ou trecho útil..."
    form.appendChild(query)
    const areaLabel = make("label", "atlas-form-field")
    areaLabel.appendChild(make("span", null, "Área"))
    const select = document.createElement("select")
    select.name = "area"
    ;[
      ["all", "Todas as áreas"],
      ...(atlas.data.index?.areas || []).map((item) => [item.id, item.label]),
    ].forEach(([value, label]) => {
      const option = make("option", null, label)
      option.value = value
      option.selected = (area || "all") === value
      select.appendChild(option)
    })
    areaLabel.appendChild(select)
    form.appendChild(areaLabel)
    form.appendChild(
      button("Encontrar conceitos", "submit-search", "atlas-button atlas-button-primary"),
    )
    const results = make("div", "atlas-search-results")
    results.dataset.searchResults = ""
    form.appendChild(results)
    content.appendChild(form)
    setOverlay(overlay, true, document.activeElement)
    query.focus()
  }

  function statusChipForPreview(slug) {
    const status = atlas.state.reviewStatus(slug)
    return make(
      "span",
      "atlas-status-chip is-" + status,
      {
        new: "Novo",
        learning: "Estudando",
        scheduled: "Agendado",
        due: "Revisar",
        mastered: "Consolidado",
      }[status],
    )
  }

  function showPreview(node, anchorOrGraph, graphPreview) {
    if (!node) return
    const preview = document.getElementById("atlas-link-preview")
    if (!preview) return
    if (appState.previewHideTimer) window.clearTimeout(appState.previewHideTimer)
    if (appState.previewTimer) window.clearTimeout(appState.previewTimer)
    appState.previewTimer = window.setTimeout(
      () => {
        clear(preview)
        preview.appendChild(
          make("span", "atlas-preview-eyebrow", graphPreview ? "NÓ EM FOCO" : "PRÉVIA DO CONCEITO"),
        )
        preview.appendChild(make("h3", null, node.title))
        preview.appendChild(make("span", "atlas-card-area", node.areaLabel))
        preview.appendChild(make("p", "atlas-preview-excerpt", node.excerpt || node.description))
        const relations = make("div", "atlas-preview-relations")
        ;(node.related || []).slice(0, 3).forEach((item) => {
          const related = atlas.data.get(item.slug)
          if (related) relations.appendChild(link(related, related.title, "atlas-study-link"))
        })
        preview.appendChild(relations)
        const footer = make("div", "atlas-preview-footer")
        footer.appendChild(statusChipForPreview(node.slug))
        const open = button("Abrir conceito", "open-preview", "atlas-button atlas-button-primary")
        open.dataset.previewSlug = node.slug
        footer.appendChild(open)
        preview.appendChild(footer)
        setHidden(preview, false)
        const rect = anchorOrGraph?.getBoundingClientRect?.()
        if (rect) {
          const previewWidth = preview.offsetWidth || Math.min(336, window.innerWidth - 28)
          const previewHeight = preview.offsetHeight || 320
          const left = graphPreview ? rect.left + rect.width - previewWidth : rect.left
          let top = graphPreview ? rect.top + 28 : rect.bottom + 12
          if (!graphPreview && top + previewHeight > window.innerHeight - 14) {
            const above = rect.top - previewHeight - 12
            if (above >= 74) top = above
          }
          preview.style.left = `${Math.max(14, Math.min(window.innerWidth - previewWidth - 14, left))}px`
          preview.style.top = `${Math.max(74, Math.min(window.innerHeight - previewHeight - 14, top))}px`
        }
        preview.classList.add("is-open")
      },
      graphPreview ? 90 : 150,
    )
  }

  function hidePreview(delay) {
    const preview = document.getElementById("atlas-link-preview")
    if (!preview) return
    if (appState.previewHideTimer) window.clearTimeout(appState.previewHideTimer)
    appState.previewHideTimer = window.setTimeout(
      () => {
        preview.classList.remove("is-open")
        window.setTimeout(() => setHidden(preview, true), 220)
      },
      delay === undefined ? 180 : delay,
    )
  }

  function enhanceLinks() {
    const all = atlas.data.concepts()
    const knownByPath = new Map(
      all.map((node) => [
        new URL(pathFor(node.slug), window.location.origin).pathname.replace(/\/$/, ""),
        node,
      ]),
    )
    document.querySelectorAll("a.internal").forEach((anchor) => {
      if (anchor.closest(".atlas-graph-shell")) return
      let url
      try {
        url = new URL(anchor.href, window.location.origin)
      } catch {
        return
      }
      const cleanPath = url.pathname.replace(/\/$/, "").replace(/\.html?$/, "")
      const node = knownByPath.get(cleanPath)
      if (node) {
        anchor.dataset.atlasTarget = node.slug
        return
      }
      if (anchor.dataset.noPopover === "true" || anchor.getAttribute("href")?.startsWith("#"))
        return
      const title = anchor.textContent?.trim()
      if (!title || anchor.closest("nav, .atlas-primary-nav, .atlas-sidebar")) return
      if (cleanPath.includes("atlas/") || anchor.closest(".markdown-preview-view")) {
        anchor.dataset.atlasGapTitle = title
        anchor.href = gapPath(title)
      }
    })
  }

  function renderConceptActions() {
    const node = currentNode()
    if (!node) return
    const actions = document.querySelector(".atlas-study-actions")
    if (!actions) return
    const favorite = actions.querySelector('[data-atlas-action="favorite"]')
    if (favorite)
      favorite.textContent = atlas.state.isFavorite(node.slug)
        ? "Remover dos favoritos"
        : "Salvar nos favoritos"
    const focus = actions.querySelector('[data-atlas-action="focus"]')
    if (focus)
      focus.textContent = document.documentElement.classList.contains("atlas-focus-mode")
        ? "Sair do modo foco"
        : "Modo foco"
  }

  function renderContextPanel() {
    const panel = document.getElementById("atlas-context-panel")
    if (!panel) return
    const node = atlas.data.get(panel.dataset.targetSlug || routeSlug()) || currentNode()
    if (!node) return
    const summary = panel.querySelector('[data-atlas-context-content="summary"]')
    if (summary && !summary.childElementCount) {
      clear(summary)
      summary.appendChild(make("p", "atlas-kicker", node.areaLabel))
      summary.appendChild(make("h4", null, node.title))
      summary.appendChild(make("p", "atlas-context-copy", node.excerpt))
      summary.appendChild(statusChipForPreview(node.slug))
    }
    const relations = panel.querySelector('[data-atlas-context-content="relations"]')
    if (relations && !relations.childElementCount) {
      clear(relations)
      relations.appendChild(make("p", "atlas-kicker", "RELAÇÕES PRÓXIMAS"))
      ;(node.related || []).slice(0, 7).forEach((item) => {
        const related = atlas.data.get(item.slug)
        if (related) relations.appendChild(link(related, related.title, "atlas-study-link"))
      })
    }
    const backlinks = panel.querySelector('[data-atlas-context-content="backlinks"]')
    if (backlinks && !backlinks.childElementCount) {
      clear(backlinks)
      backlinks.appendChild(make("p", "atlas-kicker", "LINKS RECEBIDOS"))
      ;(node.incoming || []).slice(0, 10).forEach((slug) => {
        const source = atlas.data.get(slug)
        if (source) backlinks.appendChild(link(source, source.title, "atlas-study-link"))
      })
      if (!backlinks.childElementCount)
        backlinks.appendChild(make("p", "atlas-empty-copy", "Nenhum link recebido."))
    }
  }

  function setActiveNav() {
    const current = routeSlug()
    document.querySelectorAll("[data-atlas-nav-slug]").forEach((item) => {
      const slug = normalizeSlug(item.dataset.atlasNavSlug)
      const active =
        slug === current ||
        (slug === "atlas/index" && current === "index") ||
        (slug === "index" && current === "atlas/index")
      item.classList.toggle("is-active", active)
      if (active) item.setAttribute("aria-current", "page")
      else item.removeAttribute("aria-current")
    })
  }

  function saveReadingPosition() {
    const node = currentNode()
    if (!node || !document.body) return
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    const scroll = Math.round((window.scrollY / max) * 100)
    const headings = [
      ...document.querySelectorAll(".markdown-preview-view h2, .markdown-preview-view h3"),
    ]
    const heading = headings.filter((item) => item.getBoundingClientRect().top <= 160).pop()
    const session = atlas.state.get().activeSession
    atlas.state.setResume({
      slug: node.slug,
      scroll,
      section: heading?.textContent?.trim() || "",
      sessionId: session?.id || "",
      pathId: session?.pathId || "",
    })
  }

  function restoreReadingPosition() {
    const resume = atlas.state.get().resume
    const node = currentNode()
    if (!resume || !node || resume.slug !== node.slug || Number(resume.scroll || 0) < 4) return
    window.setTimeout(() => {
      const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      window.scrollTo({ top: max * (Number(resume.scroll) / 100), behavior: "smooth" })
    }, 360)
  }

  function recordCurrentVisit() {
    const node = currentNode()
    if (!node || appState.lastRoute === node.slug) return
    appState.lastRoute = node.slug
    atlas.state.recordVisit(node.slug, "leitura")
    restoreReadingPosition()
  }

  function toggleSidebar(open) {
    const shouldOpen =
      open === undefined ? !document.body.classList.contains("atlas-sidebar-open") : open
    document.body.classList.toggle("atlas-sidebar-open", shouldOpen)
    document
      .querySelector("[data-atlas-action='toggle-sidebar']")
      ?.setAttribute("aria-expanded", String(shouldOpen))
    document.documentElement.classList.toggle("atlas-sidebar-scroll-lock", shouldOpen)
  }

  function toggleExplorer() {
    const explorer = document.querySelector(".atlas-sidebar-explorer")
    if (!explorer) return
    const collapsed = explorer.classList.toggle("is-collapsed")
    explorer
      .querySelector("[data-atlas-action='toggle-sidebar-explorer']")
      ?.setAttribute("aria-expanded", String(!collapsed))
  }

  function toggleFocus() {
    const active = document.documentElement.classList.toggle("atlas-focus-mode")
    renderConceptActions()
    toast(active ? "Modo foco ativado" : "Modo foco encerrado")
  }

  function randomConcept() {
    const concepts = atlas.data.concepts()
    if (concepts.length) goTo(concepts[Math.floor(Math.random() * concepts.length)].slug)
  }

  function openConcept(slug) {
    hidePreview(0)
    goTo(slug)
  }

  function openGraphRecall(slug) {
    atlas.views.openGraphRecall(slug)
  }

  function handleAction(action, target, event) {
    if (atlas.onboarding.handleAction(action, target)) return true
    if (atlas.graph.handleAction(action, target)) return true
    if (action === "palette") openPalette(target)
    else if (action === "close-palette" || action === "close-advanced") closePalette()
    else if (action === "advanced-search") openAdvancedSearch(target.dataset.atlasArea)
    else if (action === "toggle-theme") setTheme(getTheme() === "dark" ? "light" : "dark", true)
    else if (action === "settings") atlas.views.openSettings()
    else if (action === "open-onboarding") {
      atlas.views.closeModal()
      atlas.onboarding.show(target)
    } else if (action === "toggle-sidebar") toggleSidebar()
    else if (action === "close-sidebar") toggleSidebar(false)
    else if (action === "toggle-sidebar-explorer") toggleExplorer()
    else if (action === "home" || action === "today") goTo("atlas/index")
    else if (action === "graph" || action === "focus-graph") goTo("grafo")
    else if (action === "review") goTo("revisar")
    else if (action === "paths") goTo("trilhas")
    else if (action === "library") goTo("biblioteca")
    else if (action === "recent") goTo("recentes")
    else if (action === "favorites") goTo("favoritos")
    else if (action === "connected") goTo("mais-conectados")
    else if (action === "map") goTo("mapa-do-atlas")
    else if (action === "structure") goTo("estrutura-da-rede")
    else if (action === "random") randomConcept()
    else if (action === "favorite") {
      const node = currentNode()
      if (node) {
        const isNowFavorite = atlas.state.toggleFavorite(node.slug)
        target.textContent = isNowFavorite ? "Remover dos favoritos" : "Salvar nos favoritos"
        toast(isNowFavorite ? "Salvo nos favoritos" : "Removido dos favoritos")
      }
    } else if (action === "focus") toggleFocus()
    else if (action === "start-study" || action === "start-study-concept") {
      const slug = target.dataset.slug || currentNode()?.slug
      atlas.views.openStudySetup(slug ? { slug } : undefined)
    } else if (action === "start-review")
      atlas.views.startSession({ mode: "review", duration: 20, area: "all" })
    else if (action === "start-path")
      atlas.views.startSession({ mode: "study", duration: 20, pathId: target.dataset.pathId })
    else if (action === "resume") openConcept(atlas.state.get().resume?.slug || routeSlug())
    else if (action === "compare") atlas.views.openComparison([currentNode()?.slug])
    else if (action === "add-to-list")
      atlas.views.openListChooser(currentNode()?.slug || target.dataset.slug)
    else if (action === "open-preview") openConcept(target.dataset.previewSlug)
    else if (action === "palette-command") executePaletteCommand(target)
    else if (action === "close-modal" || action === "pause-session") atlas.views.closeModal()
    else if (action === "close-modal-go-home") {
      atlas.views.closeModal()
      goTo("atlas/index")
    } else if (action === "reveal-session") atlas.views.revealSession()
    else if (action === "rate-session") atlas.views.rateSession(target.dataset.rating)
    else if (action === "reveal-graph-recall") {
      const reveal = document.querySelector("[data-graph-recall-reveal]")
      if (reveal) {
        reveal.hidden = false
        target.textContent = "Conexões reveladas"
        target.disabled = true
      }
    } else if (action === "library-tab") {
      const view = document.getElementById("atlas-view")
      if (view) {
        view.dataset.view = "library"
        atlas.views.setLibraryTab(target.dataset.libraryTab)
        atlas.views.renderLibrary(view)
      }
    } else if (action === "new-list") atlas.views.openNewList()
    else if (action === "choose-list") {
      atlas.state.addToList(target.dataset.listId, target.dataset.slug)
      atlas.views.closeModal()
      toast("Conceito adicionado à lista")
    } else if (action === "submit-search") {
      const form = target.closest("form")
      if (form) submitSearch(form)
    } else if (action === "save-highlight") {
      if (appState.selection) {
        atlas.state.addHighlight(appState.selection)
        hideSelectionTools()
        toast("Trecho destacado")
      }
    } else if (action === "annotate-selection") {
      if (appState.selection) atlas.views.openAnnotationForm(appState.selection)
    } else if (action === "create-card-selection") {
      if (appState.selection) atlas.views.openCardForm(appState.selection)
    } else return false
    if (
      event &&
      [
        "palette",
        "close-palette",
        "close-advanced",
        "advanced-search",
        "toggle-theme",
        "settings",
        "open-onboarding",
        "toggle-sidebar",
        "close-sidebar",
        "toggle-sidebar-explorer",
        "start-study",
        "start-study-concept",
        "start-review",
        "start-path",
        "resume",
        "compare",
        "add-to-list",
        "open-preview",
        "palette-command",
        "close-modal",
        "pause-session",
        "close-modal-go-home",
        "reveal-session",
        "rate-session",
        "reveal-graph-recall",
        "library-tab",
        "new-list",
        "choose-list",
        "submit-search",
        "save-highlight",
        "annotate-selection",
        "create-card-selection",
      ].includes(action)
    )
      event.preventDefault()
    return true
  }

  function submitSearch(form) {
    const data = new FormData(form)
    const query = String(data.get("query") || "")
    const area = String(data.get("area") || "all")
    atlas.views.renderSearchResults(form, query, area)
  }

  function handleSubmit(event) {
    const form = event.target
    if (!(form instanceof HTMLFormElement)) return
    const kind = form.dataset.atlasForm
    if (!kind) return
    event.preventDefault()
    if (kind === "study-setup") {
      const data = new FormData(form)
      const started = atlas.views.startSession({
        area: String(data.get("area") || "all"),
        pathId: String(data.get("pathId") || ""),
        duration: Number(data.get("duration") || 20),
        initialSlug: String(data.get("initialSlug") || ""),
      })
      if (!started) toast("Não encontramos conceitos para essa seleção", "error")
    } else if (kind === "new-list") {
      const title = String(new FormData(form).get("title") || "")
      if (title.trim()) {
        atlas.state.addList(title)
        atlas.views.closeModal()
        refreshSoon()
        toast("Lista criada")
      }
    } else if (kind === "new-card") {
      const data = new FormData(form)
      atlas.state.addCard({
        front: String(data.get("front") || ""),
        back: String(data.get("back") || ""),
        type: String(data.get("type") || "basic"),
        slug: String(data.get("slug") || routeSlug()),
      })
      atlas.views.closeModal()
      refreshSoon()
      toast("Cartão criado")
    } else if (kind === "annotation") {
      const data = new FormData(form)
      atlas.state.addHighlight({
        ...(appState.selection || {}),
        slug: String(data.get("slug") || routeSlug()),
        note: String(data.get("note") || ""),
      })
      atlas.views.closeModal()
      hideSelectionTools()
      toast("Anotação guardada")
    } else if (kind === "search" || kind === "advanced-search") submitSearch(form)
  }

  function setContextTab(target) {
    const panel = target.closest("#atlas-context-panel")
    if (!panel) return
    const value = target.dataset.atlasContextTab || "summary"
    panel.dataset.activeTab = value
    panel.querySelectorAll("[data-atlas-context-tab]").forEach((tab) => {
      const active = tab === target
      tab.classList.toggle("is-active", active)
      tab.setAttribute("aria-selected", String(active))
      tab.tabIndex = active ? 0 : -1
    })
    panel.querySelectorAll("[data-atlas-context-content]").forEach((content) => {
      content.hidden = content.dataset.atlasContextContent !== value
    })
  }

  function showSelectionTools() {
    const tools = document.getElementById("atlas-selection-tools")
    if (!tools || !appState.selection?.quote) return
    const selection = window.getSelection()
    const rect =
      selection && !selection.isCollapsed ? selection.getRangeAt(0).getBoundingClientRect() : null
    if (rect) {
      tools.style.left = `${Math.max(12, Math.min(window.innerWidth - 270, rect.left + rect.width / 2 - 115))}px`
      tools.style.top = `${Math.max(12, rect.top - 52 + window.scrollY)}px`
    }
    setHidden(tools, false)
    tools.classList.add("is-open")
  }

  function hideSelectionTools() {
    const tools = document.getElementById("atlas-selection-tools")
    if (!tools) return
    tools.classList.remove("is-open")
    setHidden(tools, true)
    appState.selection = null
  }

  function captureSelection() {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return
    const anchor = selection.anchorNode?.parentElement
    const root = anchor?.closest(".markdown-preview-view")
    const node = currentNode()
    if (!root || !node) return
    const quote = selection.toString().trim().replace(/\s+/g, " ")
    const context = anchor?.textContent?.trim().replace(/\s+/g, " ").slice(0, 240) || ""
    const heading = [...root.querySelectorAll("h2, h3, h4")]
      .filter((item) => item.compareDocumentPosition(anchor) & Node.DOCUMENT_POSITION_FOLLOWING)
      .pop()
    appState.selection = {
      slug: node.slug,
      quote,
      context,
      section: heading?.textContent?.trim() || "",
      createdAt: Date.now(),
    }
    showSelectionTools()
  }

  function handleClick(event) {
    const rawTarget = event.target
    const target =
      rawTarget instanceof Element
        ? rawTarget.closest("[data-atlas-action], [data-onboarding-step], [data-atlas-context-tab]")
        : null
    if (target?.dataset.atlasContextTab) {
      setContextTab(target)
      event.preventDefault()
      return
    }
    if (target?.dataset.atlasAction) {
      if (handleAction(target.dataset.atlasAction, target, event)) return
    }
    if (target?.matches("[data-onboarding-step]")) {
      atlas.onboarding.handleAction("step", target)
      return
    }
    if (rawTarget instanceof Element && rawTarget.classList.contains("atlas-modal-overlay"))
      atlas.views.closeModal()
  }

  function handleInput(event) {
    const target = event.target
    if (!(target instanceof Element)) return
    if (atlas.graph.handleInput(target)) return
    if (target.id === "atlas-command-input") {
      renderPaletteResults(target.value)
      return
    }
    if (target.matches("[data-session-recall]")) {
      const slug = target.dataset.sessionRecall
      if (appState.readingTimer) window.clearTimeout(appState.readingTimer)
      appState.readingTimer = window.setTimeout(() => {
        atlas.state.update((state) => {
          if (state.activeSession)
            state.activeSession.recalled = {
              ...(state.activeSession.recalled || {}),
              [slug]: target.value,
            }
        })
      }, 420)
    }
    if (target.matches("[data-compare-slot]"))
      atlas.views.updateComparison(target.dataset.compareSlot, target.value)
    const duration = target.closest(".atlas-duration-option")
    if (duration)
      document
        .querySelectorAll(".atlas-duration-option")
        .forEach((item) => item.classList.toggle("is-selected", item === duration))
    const form = target.closest("form[data-atlas-form='advanced-search']")
    if (form && target.matches(".atlas-search-input")) renderInlineSearch(form)
  }

  function renderInlineSearch(form) {
    const query = form.querySelector("[name='query']")?.value || ""
    const area = form.querySelector("[name='area']")?.value || "all"
    const results = form.querySelector("[data-search-results]")
    if (!results) return
    clear(results)
    atlas.data
      .concepts()
      .filter(
        (node) => (area === "all" || node.area === area) && atlas.dom.searchMatch(node, query),
      )
      .slice(0, 10)
      .forEach((node) => {
        const row = make("div", "atlas-inline-result")
        row.appendChild(link(node, node.title, "atlas-study-link"))
        row.appendChild(make("span", "atlas-card-area", node.areaLabel))
        results.appendChild(row)
      })
  }

  function updateCardFormat(select) {
    const form = select.closest("form[data-atlas-form='new-card']")
    if (!form) return
    const isCloze = select.value === "cloze"
    const frontLabel = form.querySelector(".atlas-card-front-label")
    const backLabel = form.querySelector(".atlas-card-back-label")
    const front = form.querySelector("[name='front']")
    const back = form.querySelector("[name='back']")
    if (frontLabel) frontLabel.textContent = isCloze ? "Texto com lacuna" : "Frente"
    if (backLabel) backLabel.textContent = isCloze ? "Nota auxiliar (opcional)" : "Verso"
    if (front) {
      front.placeholder = isCloze
        ? "Ex.: O ATP é formado por {{adenina, ribose e três grupos fosfato}}."
        : "Pergunta, trecho ou afirmação..."
    }
    if (back) {
      back.required = !isCloze
      back.placeholder = isCloze
        ? "Opcional: contexto para revisar a lacuna..."
        : `Explique ${currentNode()?.title || "este conceito"} com suas palavras...`
    }
  }

  function handleChange(event) {
    const target = event.target
    if (!(target instanceof Element)) return
    atlas.graph.handleInput(target)
    if (target.matches("[data-card-type]")) updateCardFormat(target)
    if (target.matches("[data-compare-slot]"))
      atlas.views.updateComparison(target.dataset.compareSlot, target.value)
    const duration = target.closest(".atlas-duration-option")
    if (duration)
      document
        .querySelectorAll(".atlas-duration-option")
        .forEach((item) => item.classList.toggle("is-selected", item === duration))
  }

  function handleKeydown(event) {
    if (atlas.onboarding.handleKeydown(event)) return
    const overlay = [
      ...document.querySelectorAll(
        "#atlas-command-palette, #atlas-advanced-search-modal, .atlas-modal-overlay",
      ),
    ].find((item) => !item.hidden)
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault()
      if (document.getElementById("atlas-command-palette")?.hidden === false) closePalette()
      else openPalette()
      return
    }
    if (overlay) {
      if (event.key === "Escape") {
        event.preventDefault()
        if (overlay.classList.contains("atlas-modal-overlay")) atlas.views.closeModal()
        else closePalette()
        return
      }
      if (event.key === "Tab") {
        const items = focusable(overlay)
        if (!items.length) return
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
      }
      if (
        overlay.id === "atlas-command-palette" &&
        (event.key === "ArrowDown" || event.key === "ArrowUp")
      ) {
        event.preventDefault()
        const total = overlay.querySelectorAll("[data-command-index]").length
        if (total) {
          paletteState.index =
            (paletteState.index + (event.key === "ArrowDown" ? 1 : -1) + total) % total
          overlay
            .querySelectorAll("[data-command-index]")
            .forEach((item, index) =>
              item.classList.toggle("is-selected", index === paletteState.index),
            )
        }
      }
      if (
        overlay.id === "atlas-command-palette" &&
        event.key === "Enter" &&
        paletteState.index >= 0
      ) {
        event.preventDefault()
        executePaletteCommand(overlay.querySelector(`[data-command-index="${paletteState.index}"]`))
      }
      return
    }
    if (event.key === "Escape") {
      toggleSidebar(false)
      hidePreview(0)
      if (document.documentElement.classList.contains("atlas-focus-mode")) toggleFocus()
      return
    }
    if (!(
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      event.target?.isContentEditable
    )) {
      if (event.key === "/") {
        event.preventDefault()
        openPalette()
      } else if (event.key.toLowerCase() === "g") goTo("grafo")
    }
  }

  function bindEvents() {
    if (appState.bound) return
    appState.bound = true
    document.addEventListener("click", handleClick)
    document.addEventListener("submit", handleSubmit)
    document.addEventListener("input", handleInput)
    document.addEventListener("change", handleChange)
    document.addEventListener("keydown", handleKeydown, true)
    document.addEventListener("mouseup", captureSelection)
    document.addEventListener("pointerover", (event) => {
      const anchor =
        event.target instanceof Element
          ? event.target.closest("a.internal[data-atlas-target]")
          : null
      if (!anchor || (event.relatedTarget instanceof Node && anchor.contains(event.relatedTarget)))
        return
      const node = atlas.data.get(anchor.dataset.atlasTarget)
      if (node) showPreview(node, anchor, false)
    })
    document.addEventListener("pointerout", (event) => {
      const anchor =
        event.target instanceof Element
          ? event.target.closest("a.internal[data-atlas-target]")
          : null
      const preview = document.getElementById("atlas-link-preview")
      if (
        !anchor ||
        (event.relatedTarget instanceof Node &&
          (anchor.contains(event.relatedTarget) || preview?.contains(event.relatedTarget)))
      )
        return
      hidePreview()
    })
    document.addEventListener("focusin", (event) => {
      const anchor =
        event.target instanceof Element
          ? event.target.closest("a.internal[data-atlas-target]")
          : null
      const node = anchor ? atlas.data.get(anchor.dataset.atlasTarget) : null
      if (node) showPreview(node, anchor, false)
    })
    document.addEventListener("focusout", () => hidePreview())
    document.addEventListener(
      "scroll",
      () => {
        if (appState.readingTimer) window.clearTimeout(appState.readingTimer)
        appState.readingTimer = window.setTimeout(saveReadingPosition, 900)
      },
      { passive: true },
    )
    window.addEventListener("resize", () => {
      if (window.innerWidth > 800) toggleSidebar(false)
    })
    document.addEventListener("fullscreenchange", () => {
      document
        .querySelectorAll(".atlas-graph-shell")
        .forEach((graph) =>
          graph.classList.toggle("is-fullscreen", document.fullscreenElement === graph),
        )
    })
    const preview = document.getElementById("atlas-link-preview")
    preview?.addEventListener(
      "pointerenter",
      () => appState.previewHideTimer && window.clearTimeout(appState.previewHideTimer),
    )
    preview?.addEventListener("pointerleave", () => hidePreview())
  }

  function refreshSoon() {
    if (appState.refreshQueued) return
    appState.refreshQueued = true
    window.requestAnimationFrame(() => {
      appState.refreshQueued = false
      refresh()
    })
  }

  async function refresh() {
    if (appState.refreshPromise) return appState.refreshPromise
    appState.refreshPromise = (async () => {
      bindEvents()
      createThemeButton()
      await atlas.state.hydrate()
      const data = await atlas.data.load()
      if (!data?.index) return
      setTheme(getTheme())
      atlas.onboarding.init()
      if (document.getElementById("atlas-home-dashboard")) atlas.views.renderHome(data.index)
      atlas.views.renderView(data.index)
      document.querySelectorAll(".atlas-graph-mount").forEach((mount) => {
        if (!mount.classList.contains("atlas-graph-shell"))
          atlas.graph.mount(mount, { scope: "local", depth: atlas.state.get().graphControls.depth })
      })
      enhanceLinks()
      renderConceptActions()
      const contextPanel = document.getElementById("atlas-context-panel")
      if (contextPanel) {
        contextPanel.dataset.targetSlug = routeSlug()
        contextPanel
          .querySelectorAll("[data-atlas-context-content]")
          .forEach((content) => clear(content))
      }
      renderContextPanel()
      setActiveNav()
      recordCurrentVisit()
      appState.loaded = true
      document.documentElement.classList.add("atlas-ready")
    })()
    try {
      await appState.refreshPromise
    } catch (error) {
      console.error("Não foi possível iniciar a experiência do Atlas", error)
      toast("O Atlas não conseguiu carregar os dados agora", "error")
    } finally {
      appState.refreshPromise = null
    }
  }

  atlas.app = {
    goTo,
    hideGraphPreview: hidePreview,
    hidePreview,
    openConcept,
    openGraphRecall,
    refresh,
    showGraphPreview: (node, graph) => showPreview(node, graph, true),
    showPreview,
    toast,
  }
  window[runtimeKey] = atlas.app
  document.addEventListener("nav", refresh)
  document.addEventListener("render", refresh)
  refresh()
})()
