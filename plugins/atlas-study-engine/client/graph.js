;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  const { clamp, hash, make, normalizeSlug, normalizeText, routeSlug } = atlas.dom
  const graphInstances = new WeakMap()
  const liveStates = new Set()
  const WORLD_WIDTH = 1800
  const WORLD_HEIGHT = 1100
  const POINTER_THRESHOLD = 7
  const MIN_ZOOM = 0.28
  const MAX_ZOOM = 3.8

  const controlMeta = [
    ["spacing", "Distância", 0.8, 2.6, 0.05],
    ["repulsion", "Repulsão", 0.5, 2.3, 0.05],
    ["linkStrength", "Conexões", 0.2, 1.2, 0.05],
    ["nodeScale", "Nós", 0.7, 1.5, 0.05],
    ["labelScale", "Rótulos", 0.7, 1.4, 0.05],
    ["edgeOpacity", "Arestas", 0.15, 1, 0.05],
    ["collisionPadding", "Colisão", 4, 24, 1],
    ["centerForce", "Centro", 0.08, 0.55, 0.01],
  ]

  function currentCenter() {
    const current = atlas.data.get(routeSlug())
    return current || atlas.data.get("atlas/nutrição") || atlas.data.concepts()[0] || null
  }

  function neighborSlugs(node) {
    return new Set([...(node?.outgoing || []), ...(node?.incoming || [])].map(normalizeSlug))
  }

  function visibleNodes(options) {
    const all = atlas.data.concepts()
    const area = options.area || "all"
    const query = normalizeText(options.query || "")
    const matches = (node) =>
      (!area || area === "all" || node.area === area) &&
      (!query || normalizeText([node.title, node.areaLabel].join(" ")).includes(query))
    if (options.scope === "global") return all.filter(matches).slice(0, 180)
    const origin = currentCenter()
    if (!origin) return all.filter(matches).slice(0, 80)
    const distances = new Map([[origin.slug, 0]])
    const queue = [origin.slug]
    while (queue.length) {
      const slug = queue.shift()
      const node = atlas.data.get(slug)
      const distance = distances.get(slug) || 0
      if (!node || distance >= Number(options.depth || 2)) continue
      neighborSlugs(node).forEach((neighbor) => {
        if (!distances.has(neighbor) && atlas.data.get(neighbor)) {
          distances.set(neighbor, distance + 1)
          queue.push(neighbor)
        }
      })
    }
    return all
      .filter((node) => distances.has(node.slug) && matches(node))
      .sort(
        (left, right) =>
          (distances.get(left.slug) || 0) - (distances.get(right.slug) || 0) ||
          right.degree - left.degree ||
          left.title.localeCompare(right.title, "pt-BR"),
      )
      .slice(0, 56)
  }

  function edgeKey(left, right) {
    return [left, right].sort().join("::")
  }

  function visibleEdges(nodes) {
    const allowed = new Set(nodes.map((node) => node.slug))
    const edges = new Map()
    nodes.forEach((node) => {
      ;(node.outgoing || []).forEach((target) => {
        if (!allowed.has(target) || target === node.slug) return
        const key = edgeKey(node.slug, target)
        if (!edges.has(key)) edges.set(key, { source: node.slug, target, direct: true })
      })
      ;(node.incoming || []).forEach((source) => {
        if (!allowed.has(source) || source === node.slug) return
        const key = edgeKey(node.slug, source)
        if (!edges.has(key)) edges.set(key, { source, target: node.slug, direct: true })
      })
    })
    return [...edges.values()]
  }

  function visualRadius(node, controls) {
    const base = node.slug === routeSlug() ? 10.5 : 7 + Math.min(5, node.degree / 10)
    return base * Number(controls.nodeScale || 1)
  }

  function seedPosition(node, index, options) {
    if (node.slug === routeSlug()) return { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, vx: 0, vy: 0 }
    const xSeed = hash(node.slug + ":x")
    const ySeed = hash(node.slug + ":y")
    const scopeSpread = options.scope === "global" ? 0 : 0.18
    const x = 150 + xSeed * (WORLD_WIDTH - 300) + (xSeed - 0.5) * scopeSpread * WORLD_WIDTH
    const y = 130 + ySeed * (WORLD_HEIGHT - 260) + (ySeed - 0.5) * scopeSpread * WORLD_HEIGHT
    return {
      x: clamp(x + (index % 3) * 4, 80, WORLD_WIDTH - 80),
      y: clamp(y + (index % 5) * 3, 70, WORLD_HEIGHT - 70),
      vx: 0,
      vy: 0,
    }
  }

  function createControlPanel(options) {
    const panel = make("div", "atlas-graph-control-panel")
    const heading = make("div", "atlas-graph-control-heading")
    heading.appendChild(make("p", "atlas-kicker", "COMPOSIÇÃO"))
    heading.appendChild(make("span", "atlas-graph-control-hint", "Ajuste o mapa ao seu olhar"))
    panel.appendChild(heading)

    const selects = make("div", "atlas-graph-selects")
    const scopeLabel = make("label", "atlas-graph-select-field")
    scopeLabel.appendChild(make("span", null, "Âmbito"))
    const scope = document.createElement("select")
    scope.dataset.atlasGraphScope = ""
    ;[
      ["local", "Ao redor do conceito"],
      ["global", "Atlas completo"],
    ].forEach(([value, label]) => {
      const option = make("option", null, label)
      option.value = value
      option.selected = options.scope === value
      scope.appendChild(option)
    })
    scopeLabel.appendChild(scope)
    selects.appendChild(scopeLabel)

    const areaLabel = make("label", "atlas-graph-select-field")
    areaLabel.appendChild(make("span", null, "Área"))
    const area = document.createElement("select")
    area.dataset.atlasGraphArea = ""
    const areaOptions = [
      ["all", "Todas as áreas"],
      ...(atlas.data.index?.areas || []).map((item) => [item.id, item.label]),
    ]
    areaOptions.forEach(([value, label]) => {
      const option = make("option", null, label)
      option.value = value
      option.selected = options.area === value
      area.appendChild(option)
    })
    areaLabel.appendChild(area)
    selects.appendChild(areaLabel)

    const depthLabel = make("label", "atlas-graph-select-field")
    depthLabel.appendChild(make("span", null, "Profundidade"))
    const depth = document.createElement("select")
    depth.dataset.atlasGraphDepth = ""
    ;[
      [1, "1 camada"],
      [2, "2 camadas"],
      [3, "3 camadas"],
      [4, "4 camadas"],
    ].forEach(([value, label]) => {
      const option = make("option", null, label)
      option.value = value
      option.selected = Number(options.depth) === value
      depth.appendChild(option)
    })
    depthLabel.appendChild(depth)
    selects.appendChild(depthLabel)
    panel.appendChild(selects)

    const sliders = make("div", "atlas-graph-sliders")
    controlMeta.forEach(([key, label, min, max, step]) => {
      const wrapper = make("label", "atlas-graph-slider")
      const line = make("span", "atlas-graph-slider-label")
      line.appendChild(make("span", null, label))
      const value = make("output", null, formatControlValue(key, options[key]))
      value.dataset.atlasGraphOutput = key
      line.appendChild(value)
      wrapper.appendChild(line)
      const input = document.createElement("input")
      input.type = "range"
      input.min = String(min)
      input.max = String(max)
      input.step = String(step)
      input.value = String(options[key])
      input.dataset.atlasGraphControl = key
      input.setAttribute("aria-label", label)
      wrapper.appendChild(input)
      sliders.appendChild(wrapper)
    })
    panel.appendChild(sliders)
    return panel
  }

  function formatControlValue(key, value) {
    if (key === "edgeOpacity") return Math.round(Number(value) * 100) + "%"
    if (key === "collisionPadding") return Math.round(Number(value)) + " px"
    return Number(value).toFixed(2).replace(/\.00$/, "")
  }

  function createGraph(container, initialOptions) {
    if (!container) return null
    const previous = graphInstances.get(container)
    if (previous) destroy(container)
    const state = {
      scope: initialOptions?.scope || "local",
      depth: Number(initialOptions?.depth || atlas.state.get().graphControls.depth || 2),
      area: initialOptions?.area || "all",
      query: initialOptions?.query || "",
      positions: new Map(),
      pinned: new Set(),
      selected: "",
      lastSelected: "",
      scale: 1,
      panX: 0,
      panY: 0,
      viewportWidth: 0,
      viewportHeight: 0,
      pointers: new Map(),
      drag: null,
      pan: null,
      pinchStartDistance: 0,
      pinchStartScale: 1,
      moved: false,
      suppressClickUntil: 0,
      nodes: [],
      edges: [],
      nodeBySlug: new Map(),
      nodeElements: new Map(),
      edgeElements: new Map(),
      simulation: null,
      physics: null,
      resizeObserver: null,
      cameraFrame: 0,
      timers: new Set(),
      hoverClearTimer: 0,
      hasInteractedCamera: false,
      hasInitialFit: false,
      destroyed: false,
      resetting: false,
      loaderRemoved: false,
      renderVersion: 0,
    }
    graphInstances.set(container, state)
    liveStates.add(state)
    container.classList.add("atlas-graph-shell")
    atlas.dom.clear(container)

    const header = make("div", "atlas-graph-header")
    const titleWrap = make("div", null)
    titleWrap.appendChild(make("p", "atlas-kicker", "MAPA DE RELAÇÕES"))
    titleWrap.appendChild(make("h2", null, initialOptions?.title || "Grafo do Atlas"))
    titleWrap.appendChild(
      make(
        "p",
        "atlas-graph-subtitle",
        "Uma composição viva das ideias que se encostam, se explicam e se transformam.",
      ),
    )
    header.appendChild(titleWrap)
    const actions = make("div", "atlas-graph-actions")
    const pinButton = atlas.dom.button("Fixar ponto", "pin-active-node", "atlas-graph-action")
    pinButton.dataset.atlasPinButton = ""
    actions.appendChild(pinButton)
    actions.appendChild(
      atlas.dom.iconButton(
        "refresh",
        "Reorganizar grafo",
        "graph-reset",
        "atlas-graph-icon-action",
      ),
    )
    actions.appendChild(
      atlas.dom.iconButton("target", "Enquadrar grafo", "graph-fit", "atlas-graph-icon-action"),
    )
    actions.appendChild(
      atlas.dom.iconButton("expand", "Tela cheia", "fullscreen-graph", "atlas-graph-icon-action"),
    )
    actions.appendChild(
      atlas.dom.button("Graph Recall", "graph-recall", "atlas-graph-recall-action"),
    )
    header.appendChild(actions)
    container.appendChild(header)
    container.appendChild(
      createControlPanel({
        ...atlas.state.get().graphControls,
        ...state,
      }),
    )

    const canvas = make("div", "atlas-graph-canvas")
    canvas.tabIndex = 0
    canvas.setAttribute(
      "aria-label",
      "Mapa interativo de conceitos. Use o mouse ou o toque para explorar.",
    )
    const loader = make("div", "atlas-graph-loader")
    loader.appendChild(make("span", null))
    loader.appendChild(make("span", null))
    loader.appendChild(make("span", null))
    loader.appendChild(make("p", null, "Formando a rede"))
    canvas.appendChild(loader)

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("viewBox", `0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`)
    svg.setAttribute("role", "application")
    svg.setAttribute("aria-label", "Grafo interativo")
    svg.classList.add("atlas-graph-svg")
    const viewport = document.createElementNS("http://www.w3.org/2000/svg", "g")
    viewport.classList.add("atlas-graph-viewport")
    const edgesLayer = document.createElementNS("http://www.w3.org/2000/svg", "g")
    edgesLayer.classList.add("atlas-graph-edges")
    const nodesLayer = document.createElementNS("http://www.w3.org/2000/svg", "g")
    nodesLayer.classList.add("atlas-graph-nodes")
    viewport.appendChild(edgesLayer)
    viewport.appendChild(nodesLayer)
    svg.appendChild(viewport)
    canvas.appendChild(svg)
    container.appendChild(canvas)

    const footer = make("div", "atlas-graph-footer")
    const legend = make("div", "atlas-graph-legend")
    ;[
      ["new", "Nunca estudado"],
      ["learning", "Estudando"],
      ["due", "Revisar"],
      ["mastered", "Consolidado"],
    ].forEach(([status, label]) => {
      const item = make("span", "atlas-graph-legend-item")
      item.appendChild(make("i", "atlas-graph-legend-dot is-" + status))
      item.appendChild(make("span", null, label))
      legend.appendChild(item)
    })
    footer.appendChild(legend)
    footer.appendChild(
      make("span", "atlas-graph-help", "Arraste · role para aproximar · clique para abrir"),
    )
    container.appendChild(footer)

    state.canvas = canvas
    state.svg = svg
    state.viewport = viewport
    state.edgesLayer = edgesLayer
    state.nodesLayer = nodesLayer
    state.loader = loader
    bindPointerEvents(container, state)
    observeResize(state)
    render(container, { fitAfter: true })
    return container
  }

  function observeResize(state) {
    if (typeof ResizeObserver === "undefined") return
    state.resizeObserver = new ResizeObserver((entries) => {
      if (state.destroyed) return
      const rect = entries[0]?.contentRect
      if (!rect?.width || !rect?.height) return
      const changed = rect.width !== state.viewportWidth || rect.height !== state.viewportHeight
      state.viewportWidth = rect.width
      state.viewportHeight = rect.height
      applyView(state)
      if (changed && state.physics) state.physics.resize(WORLD_WIDTH, WORLD_HEIGHT)
    })
    state.resizeObserver.observe(state.canvas)
  }

  function savePositions(state) {
    if (state.resetting) return
    state.nodes.forEach((node) => {
      if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return
      state.positions.set(node.slug, {
        x: node.x,
        y: node.y,
        vx: Number(node.vx) || 0,
        vy: Number(node.vy) || 0,
      })
    })
  }

  function stopSimulation(state) {
    if (!state.simulation) return
    state.simulation.on("tick", null).on("end", null).stop()
    state.simulation = null
    state.physics = null
  }

  function createPhysicalNode(node, index, state, options) {
    const stored = state.positions.get(node.slug)
    const seed = stored || seedPosition(node, index, options)
    const radius = visualRadius(node, options)
    const hasStoredPosition =
      stored && Number.isFinite(Number(stored.x)) && Number.isFinite(Number(stored.y))
    const physical = {
      ...node,
      id: node.slug,
      x: hasStoredPosition
        ? Number(seed.x)
        : clamp(Number(seed.x) || WORLD_WIDTH / 2, radius, WORLD_WIDTH - radius),
      y: hasStoredPosition
        ? Number(seed.y)
        : clamp(Number(seed.y) || WORLD_HEIGHT / 2, radius, WORLD_HEIGHT - radius),
      vx: Number(seed.vx) || 0,
      vy: Number(seed.vy) || 0,
      radius,
      collisionRadius: radius,
    }
    if (state.pinned.has(node.slug)) {
      physical.fx = physical.x
      physical.fy = physical.y
    }
    return physical
  }

  function render(container, renderOptions) {
    const state = graphInstances.get(container)
    if (!state || state.destroyed) return
    savePositions(state)
    stopSimulation(state)
    const controls = { ...atlas.state.get().graphControls }
    const options = { ...controls, ...state }
    const rawNodes = visibleNodes(options)
    const rawEdges = visibleEdges(rawNodes)
    const previousSlugs = new Set(state.nodeBySlug.keys())
    state.nodes = rawNodes.map((node, index) => createPhysicalNode(node, index, state, options))
    state.edges = rawEdges.map((edge) => ({ ...edge }))
    state.nodeBySlug = new Map(state.nodes.map((node) => [node.slug, node]))
    state.renderVersion += 1
    container.classList.toggle("is-dense", state.scope === "global" || state.nodes.length > 48)

    reconcileEdges(state)
    reconcileNodes(container, state, previousSlugs)
    updateGraphVisuals(state)
    updatePinButton(state)
    applyView(state)
    renderPositions(state)

    state.physics = atlas.graphPhysics?.create(
      state.nodes,
      state.edges,
      controls,
      WORLD_WIDTH,
      WORLD_HEIGHT,
    )
    state.simulation = state.physics?.simulation || null
    if (state.simulation) {
      const renderVersion = state.renderVersion
      state.simulation.on("tick", () => {
        if (state.destroyed || state.renderVersion !== renderVersion) return
        renderPositions(state)
      })
      state.simulation.on("end", () => {
        if (!state.destroyed && state.renderVersion === renderVersion) {
          container.classList.remove("is-reheating")
          renderPositions(state)
          if (!state.hasInteractedCamera) fit(container, 520, true)
          state.hasInitialFit = true
        }
      })
      container.classList.add("is-reheating")
      state.simulation.alpha(1).restart()
    }

    if (!state.loaderRemoved) {
      state.loader.classList.remove("is-complete")
      schedule(
        state,
        () => {
          state.loader.classList.add("is-complete")
          schedule(
            state,
            () => {
              state.loader.remove()
              state.loaderRemoved = true
            },
            480,
          )
        },
        360,
      )
    }
    if (renderOptions?.fitAfter || !state.hasInitialFit) scheduleInitialFit(container, state)
  }

  function scheduleInitialFit(container, state) {
    if (state.initialFitTimer) return
    state.initialFitTimer = schedule(
      state,
      () => {
        state.initialFitTimer = 0
        if (!state.destroyed && !state.hasInteractedCamera) fit(container, 520, true)
        state.hasInitialFit = true
      },
      720,
    )
  }

  function schedule(state, callback, delay) {
    const timer = window.setTimeout(() => {
      state.timers.delete(timer)
      callback()
    }, delay)
    state.timers.add(timer)
    return timer
  }

  function createSvgElement(tag) {
    return document.createElementNS("http://www.w3.org/2000/svg", tag)
  }

  function createEdgeElement(state, edge) {
    const line = createSvgElement("line")
    line.classList.add("atlas-graph-edge", "is-entering")
    line.dataset.source = edge.source
    line.dataset.target = edge.target
    state.edgesLayer.appendChild(line)
    schedule(state, () => line.classList.remove("is-entering"), 280)
    return line
  }

  function reconcileEdges(state) {
    const next = new Map(state.edges.map((edge) => [edgeKey(edge.source, edge.target), edge]))
    state.edgeElements.forEach((element, key) => {
      if (next.has(key)) return
      state.edgeElements.delete(key)
      element.classList.add("is-exiting")
      schedule(
        state,
        () => {
          if (!state.edgeElements.has(key)) element.remove()
        },
        280,
      )
    })
    next.forEach((edge, key) => {
      let element = state.edgeElements.get(key)
      if (!element) {
        element = createEdgeElement(state, edge)
        state.edgeElements.set(key, element)
      }
      element.dataset.source = edge.source
      element.dataset.target = edge.target
      edge.element = element
    })
  }

  function createNodeElement(container, state, node) {
    const group = createSvgElement("g")
    group.classList.add("atlas-graph-node", "is-entering")
    group.dataset.slug = node.slug
    group.setAttribute("role", "button")
    group.setAttribute("tabindex", "0")
    group.setAttribute("focusable", "true")

    const halo = createSvgElement("circle")
    halo.classList.add("atlas-graph-node-halo")
    const circle = createSvgElement("circle")
    circle.classList.add("atlas-graph-node-dot")
    const pin = createSvgElement("circle")
    pin.classList.add("atlas-graph-node-pin")
    pin.setAttribute("cx", "0")
    pin.setAttribute("cy", "0")
    const label = createSvgElement("text")
    label.classList.add("atlas-graph-node-label")
    group.appendChild(halo)
    group.appendChild(circle)
    group.appendChild(pin)
    group.appendChild(label)
    state.nodesLayer.appendChild(group)

    group.addEventListener("pointerenter", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return
      selectNode(container, group.dataset.slug, true, group)
    })
    group.addEventListener("pointerleave", () => clearSelection(container, group.dataset.slug))
    group.addEventListener("focus", () => selectNode(container, group.dataset.slug, true, group))
    group.addEventListener("blur", () => clearSelection(container, group.dataset.slug))
    group.addEventListener("click", (event) => {
      if (Date.now() < state.suppressClickUntil) {
        event.preventDefault()
        return
      }
      if (state.moved) {
        state.moved = false
        event.preventDefault()
        return
      }
      const slug = normalizeSlug(group.dataset.slug)
      if (slug && typeof atlas.app?.openConcept === "function") atlas.app.openConcept(slug)
    })
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        if (typeof atlas.app?.openConcept === "function") atlas.app.openConcept(group.dataset.slug)
      }
    })
    schedule(state, () => group.classList.remove("is-entering"), 320)
    return group
  }

  function reconcileNodes(container, state, previousSlugs) {
    const next = new Map(state.nodes.map((node) => [node.slug, node]))
    state.nodeElements.forEach((element, slug) => {
      if (next.has(slug)) return
      state.nodeElements.delete(slug)
      element.classList.add("is-exiting")
      schedule(
        state,
        () => {
          if (!state.nodeElements.has(slug)) element.remove()
        },
        320,
      )
    })
    next.forEach((node, slug) => {
      let element = state.nodeElements.get(slug)
      if (!element) {
        element = createNodeElement(container, state, node)
        state.nodeElements.set(slug, element)
      } else if (!previousSlugs.has(slug)) {
        element.classList.add("is-entering")
        schedule(state, () => element.classList.remove("is-entering"), 320)
      }
      node.element = element
      syncNodeElement(state, node)
    })
  }

  function syncNodeElement(state, node) {
    const element = node.element
    if (!element) return
    const status = atlas.state.reviewStatus(node.slug)
    element.classList.remove("is-new", "is-learning", "is-due", "is-scheduled", "is-mastered")
    element.classList.add("is-" + status)
    element.classList.toggle("is-selected", state.selected === node.slug)
    element.classList.toggle("is-current", node.slug === routeSlug())
    element.classList.toggle("is-hub", node.degree >= 20)
    element.classList.toggle("is-pinned", state.pinned.has(node.slug))
    element.dataset.slug = node.slug
    element.setAttribute("aria-label", node.title + ", " + node.areaLabel)
    const label = element.querySelector(".atlas-graph-node-label")
    if (label)
      label.textContent = node.title.length > 30 ? node.title.slice(0, 29) + "…" : node.title
  }

  function viewSize(state, scale) {
    const aspect =
      state.viewportWidth > 0 && state.viewportHeight > 0
        ? state.viewportWidth / state.viewportHeight
        : WORLD_WIDTH / WORLD_HEIGHT
    const height = WORLD_HEIGHT / scale
    return { width: height * aspect, height }
  }

  function applyView(state) {
    if (!state.svg) return
    const size = viewSize(state, state.scale)
    state.svg.setAttribute("viewBox", `${state.panX} ${state.panY} ${size.width} ${size.height}`)
    state.svg.dataset.zoom = state.scale.toFixed(3)
    state.svg.classList.toggle("is-panning", Boolean(state.pan))
  }

  function renderPositions(state) {
    if (state.destroyed) return
    state.nodes.forEach((node) => {
      if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return
      node.element?.setAttribute("transform", `translate(${node.x} ${node.y})`)
      state.positions.set(node.slug, {
        x: node.x,
        y: node.y,
        vx: Number(node.vx) || 0,
        vy: Number(node.vy) || 0,
      })
    })
    state.edges.forEach((edge) => {
      const source =
        typeof edge.source === "object" ? edge.source : state.nodeBySlug.get(edge.source)
      const target =
        typeof edge.target === "object" ? edge.target : state.nodeBySlug.get(edge.target)
      if (!source || !target || !edge.element) return
      edge.element.setAttribute("x1", String(source.x))
      edge.element.setAttribute("y1", String(source.y))
      edge.element.setAttribute("x2", String(target.x))
      edge.element.setAttribute("y2", String(target.y))
    })
  }

  function updateGraphVisuals(state) {
    const controls = atlas.state.get().graphControls
    state.nodes.forEach((node) => {
      node.radius = visualRadius(node, controls)
      node.collisionRadius = node.radius
      syncNodeElement(state, node)
      const element = node.element
      if (!element) return
      const halo = element.querySelector(".atlas-graph-node-halo")
      const dot = element.querySelector(".atlas-graph-node-dot")
      const pin = element.querySelector(".atlas-graph-node-pin")
      const label = element.querySelector(".atlas-graph-node-label")
      const isCurrent = node.slug === routeSlug()
      if (halo) halo.setAttribute("r", String((isCurrent ? 27 : 19) * controls.nodeScale))
      if (dot) dot.setAttribute("r", String(node.radius))
      if (pin) {
        pin.setAttribute("r", String(Math.max(2.5, node.radius * 0.27)))
        pin.setAttribute("cx", String(node.radius * 0.72))
        pin.setAttribute("cy", String(-node.radius * 0.72))
      }
      if (label) {
        label.setAttribute("dy", String((node.radius + 18) * controls.labelScale))
        label.setAttribute("font-size", String(15 * controls.labelScale))
      }
    })
    state.edges.forEach((edge) =>
      edge.element?.style.setProperty("--atlas-edge-opacity", String(controls.edgeOpacity)),
    )
  }

  function updatePhysics(state) {
    if (!state.physics) return
    updateGraphVisuals(state)
    state.physics.update(atlas.state.get().graphControls, WORLD_WIDTH, WORLD_HEIGHT)
    state.simulation?.alphaTarget(0).restart()
    state.simulation?.alpha(Math.max(state.simulation.alpha(), 0.62)).restart()
    state.canvas.closest(".atlas-graph-shell")?.classList.add("is-reheating")
  }

  function selectNode(container, slug, preview, anchor) {
    const state = graphInstances.get(container)
    if (!state) return
    if (state.hoverClearTimer) window.clearTimeout(state.hoverClearTimer)
    state.selected = normalizeSlug(slug)
    state.lastSelected = state.selected
    const related = new Set([state.selected, ...neighborSlugs(atlas.data.get(state.selected))])
    state.nodes.forEach((node) => {
      node.element?.classList.toggle("is-selected", node.slug === state.selected)
      node.element?.classList.toggle(
        "is-related",
        related.has(node.slug) && node.slug !== state.selected,
      )
      node.element?.classList.toggle("is-dimmed", !related.has(node.slug))
    })
    state.edges.forEach((edge) =>
      edge.element?.classList.toggle(
        "is-related",
        edge.source === state.selected ||
          edge.target === state.selected ||
          edge.source?.slug === state.selected ||
          edge.target?.slug === state.selected,
      ),
    )
    updatePinButton(state)
    if (preview && typeof atlas.app?.showGraphPreview === "function") {
      atlas.app.showGraphPreview(
        atlas.data.get(state.selected),
        anchor || state.nodeElements.get(state.selected),
      )
    }
  }

  function updatePinButton(state) {
    const button = state.canvas
      ?.closest(".atlas-graph-shell")
      ?.querySelector("[data-atlas-pin-button]")
    if (!button) return
    const activeSlug = state.selected || state.lastSelected
    button.textContent = activeSlug && state.pinned.has(activeSlug) ? "Soltar ponto" : "Fixar ponto"
  }

  function clearSelection(container, slug) {
    const state = graphInstances.get(container)
    if (!state || state.drag || state.selected !== normalizeSlug(slug)) return
    if (state.hoverClearTimer) window.clearTimeout(state.hoverClearTimer)
    state.hoverClearTimer = window.setTimeout(() => {
      const preview = document.getElementById("atlas-link-preview")
      if (preview?.matches(":hover")) return
      state.selected = ""
      state.nodes.forEach((node) =>
        node.element?.classList.remove("is-related", "is-dimmed", "is-selected"),
      )
      state.edges.forEach((edge) => edge.element?.classList.remove("is-related"))
      updatePinButton(state)
      if (typeof atlas.app?.hideGraphPreview === "function") atlas.app.hideGraphPreview()
    }, 260)
  }

  function clientPoint(event, state) {
    const rect = state.svg.getBoundingClientRect()
    const size = viewSize(state, state.scale)
    return {
      x: ((event.clientX - rect.left) / rect.width) * size.width + state.panX,
      y: ((event.clientY - rect.top) / rect.height) * size.height + state.panY,
    }
  }

  function distanceBetweenPointers(pointers) {
    const values = [...pointers.values()]
    if (values.length < 2) return 0
    return Math.hypot(values[0].clientX - values[1].clientX, values[0].clientY - values[1].clientY)
  }

  function midpoint(pointers) {
    const values = [...pointers.values()]
    return {
      x: values.reduce((sum, item) => sum + item.clientX, 0) / values.length,
      y: values.reduce((sum, item) => sum + item.clientY, 0) / values.length,
    }
  }

  function releaseDrag(state, reheat) {
    const drag = state.drag
    if (!drag) return
    const node = state.nodeBySlug.get(drag.slug)
    if (node) {
      if (drag.wasPinned) {
        node.fx = node.x
        node.fy = node.y
      } else {
        node.fx = null
        node.fy = null
      }
    }
    if (reheat && state.simulation) {
      state.simulation.alphaTarget(0)
      state.simulation.alpha(Math.max(state.simulation.alpha(), 0.34)).restart()
    }
    state.drag = null
  }

  function bindPointerEvents(container, state) {
    const svg = state.svg
    svg.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) return
      event.preventDefault()
      state.pointers.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
        pointerType: event.pointerType,
      })
      if (state.pointers.size >= 2) {
        const interruptedDrag = state.drag
        releaseDrag(state, true)
        if (interruptedDrag) {
          state.nodeElements.get(interruptedDrag.slug)?.classList.remove("is-dragging")
          container.classList.remove("is-dragging")
        }
        state.pan = null
        state.pinchStartDistance = distanceBetweenPointers(state.pointers)
        state.pinchStartScale = state.scale
        return
      }
      const target =
        event.target instanceof Element ? event.target.closest(".atlas-graph-node") : null
      if (target) {
        const slug = normalizeSlug(target.dataset.slug)
        const node = state.nodeBySlug.get(slug)
        if (!node) return
        try {
          target.setPointerCapture?.(event.pointerId)
        } catch {
          // Synthetic events and a cancelled pointer may not have an active capture target.
        }
        const point = clientPoint(event, state)
        state.drag = {
          slug,
          pointerId: event.pointerId,
          offsetX: point.x - node.x,
          offsetY: point.y - node.y,
          startX: event.clientX,
          startY: event.clientY,
          wasPinned: state.pinned.has(slug),
          moved: false,
        }
        state.moved = false
        node.fx = node.x
        node.fy = node.y
        state.simulation?.alphaTarget(0.26).restart()
        selectNode(container, slug, false, target)
        target.classList.add("is-dragging")
        container.classList.add("is-dragging")
      } else {
        try {
          svg.setPointerCapture?.(event.pointerId)
        } catch {
          // Synthetic events and a cancelled pointer may not have an active capture target.
        }
        state.pan = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          originX: state.panX,
          originY: state.panY,
        }
        state.moved = false
        container.classList.add("is-panning")
      }
    })

    svg.addEventListener("pointermove", (event) => {
      if (state.pointers.has(event.pointerId))
        state.pointers.set(event.pointerId, {
          clientX: event.clientX,
          clientY: event.clientY,
          pointerType: event.pointerType,
        })
      if (state.pointers.size >= 2 && state.pinchStartDistance) {
        event.preventDefault()
        const distance = distanceBetweenPointers(state.pointers)
        const center = midpoint(state.pointers)
        const factor = clamp(distance / state.pinchStartDistance, 0.55, 1.85)
        zoomAt(state, center.x, center.y, state.pinchStartScale * factor)
        return
      }
      if (state.drag?.pointerId === event.pointerId) {
        const node = state.nodeBySlug.get(state.drag.slug)
        if (!node) return
        const point = clientPoint(event, state)
        const distance = Math.hypot(
          event.clientX - state.drag.startX,
          event.clientY - state.drag.startY,
        )
        if (distance > POINTER_THRESHOLD) {
          state.drag.moved = true
          state.moved = true
          state.suppressClickUntil = Date.now() + 300
        }
        // Keep the pointer-to-node mapping faithful to the force simulation. The
        // camera is intentionally unbounded, so a world-sized clamp here would
        // make a node jump when the settled graph extends beyond its seed area.
        const nextX = point.x - state.drag.offsetX
        const nextY = point.y - state.drag.offsetY
        node.fx = Number.isFinite(nextX) ? nextX : node.x
        node.fy = Number.isFinite(nextY) ? nextY : node.y
        node.x = node.fx
        node.y = node.fy
        renderPositions(state)
      } else if (state.pan?.pointerId === event.pointerId) {
        const rect = state.svg.getBoundingClientRect()
        const size = viewSize(state, state.scale)
        state.panX =
          state.pan.originX - ((event.clientX - state.pan.startX) / rect.width) * size.width
        state.panY =
          state.pan.originY - ((event.clientY - state.pan.startY) / rect.height) * size.height
        state.moved = true
        state.hasInteractedCamera = true
        applyView(state)
      }
    })

    const endPointer = (event) => {
      const drag = state.drag
      const wasMoved = Boolean(drag?.moved || state.moved)
      state.pointers.delete(event.pointerId)
      if (state.pointers.size < 2) state.pinchStartDistance = 0
      if (drag?.pointerId === event.pointerId) {
        releaseDrag(state, true)
        const element = state.nodeElements.get(drag.slug)
        element?.classList.remove("is-dragging")
        if (wasMoved) state.suppressClickUntil = Date.now() + 280
      }
      state.pan = null
      container.classList.remove("is-dragging", "is-panning")
      updatePinButton(state)
      window.setTimeout(() => {
        state.moved = false
      }, 80)
    }
    svg.addEventListener("pointerup", endPointer)
    svg.addEventListener("pointercancel", endPointer)
    svg.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault()
        state.hasInteractedCamera = true
        zoomAt(state, event.clientX, event.clientY, state.scale * Math.exp(-event.deltaY * 0.0012))
      },
      { passive: false },
    )
    svg.addEventListener("dblclick", () => {
      state.hasInteractedCamera = true
      fit(container, 420)
    })
  }

  function zoomAt(state, clientX, clientY, nextScale) {
    const previousScale = state.scale
    const next = clamp(nextScale, MIN_ZOOM, MAX_ZOOM)
    const rect = state.svg.getBoundingClientRect()
    const beforeSize = viewSize(state, previousScale)
    const afterSize = viewSize(state, next)
    const ratioX = clamp((clientX - rect.left) / rect.width, 0, 1)
    const ratioY = clamp((clientY - rect.top) / rect.height, 0, 1)
    const before = {
      x: ratioX * beforeSize.width + state.panX,
      y: ratioY * beforeSize.height + state.panY,
    }
    state.scale = next
    state.panX = before.x - ratioX * afterSize.width
    state.panY = before.y - ratioY * afterSize.height
    applyView(state)
  }

  function animateCamera(state, target, duration) {
    if (state.cameraFrame) window.cancelAnimationFrame(state.cameraFrame)
    const start = {
      scale: state.scale,
      panX: state.panX,
      panY: state.panY,
    }
    const startedAt = performance.now()
    const tick = (now) => {
      if (state.destroyed) return
      const progress = clamp((now - startedAt) / duration, 0, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      state.scale = start.scale + (target.scale - start.scale) * eased
      state.panX = start.panX + (target.panX - start.panX) * eased
      state.panY = start.panY + (target.panY - start.panY) * eased
      applyView(state)
      if (progress < 1) state.cameraFrame = window.requestAnimationFrame(tick)
      else state.cameraFrame = 0
    }
    state.cameraFrame = window.requestAnimationFrame(tick)
  }

  function fit(container, duration = 460, initial = false) {
    const state = graphInstances.get(container)
    if (!state || !state.nodes.length) return
    const points = state.nodes.filter((node) => Number.isFinite(node.x) && Number.isFinite(node.y))
    if (!points.length) return
    const minX = Math.min(...points.map((point) => point.x - point.radius))
    const maxX = Math.max(...points.map((point) => point.x + point.radius))
    const minY = Math.min(...points.map((point) => point.y - point.radius))
    const maxY = Math.max(...points.map((point) => point.y + point.radius))
    const aspect =
      state.viewportWidth > 0 && state.viewportHeight > 0
        ? state.viewportWidth / state.viewportHeight
        : WORLD_WIDTH / WORLD_HEIGHT
    const paddingX = 120
    const paddingY = 100
    const contentWidth = Math.max(320, maxX - minX + paddingX * 2)
    const contentHeight = Math.max(240, maxY - minY + paddingY * 2)
    const targetScale = clamp(
      Math.min((WORLD_HEIGHT * aspect) / contentWidth, WORLD_HEIGHT / contentHeight),
      MIN_ZOOM,
      2.2,
    )
    const targetSize = viewSize(state, targetScale)
    const target = {
      scale: targetScale,
      panX: (minX + maxX) / 2 - targetSize.width / 2,
      panY: (minY + maxY) / 2 - targetSize.height / 2,
    }
    animateCamera(state, target, duration)
    if (!initial) state.hasInteractedCamera = true
  }

  function reset(container) {
    const state = graphInstances.get(container)
    if (!state) return
    state.resetting = true
    stopSimulation(state)
    state.positions.clear()
    state.pinned.clear()
    state.selected = ""
    state.lastSelected = ""
    state.scale = 1
    state.panX = 0
    state.panY = 0
    state.hasInteractedCamera = false
    state.hasInitialFit = false
    state.resetting = false
    render(container, { fitAfter: true })
  }

  function destroy(container) {
    if (!container) return
    const state = graphInstances.get(container)
    if (!state) return
    state.destroyed = true
    stopSimulation(state)
    state.resizeObserver?.disconnect()
    if (state.cameraFrame) window.cancelAnimationFrame(state.cameraFrame)
    state.timers.forEach((timer) => window.clearTimeout(timer))
    state.timers.clear()
    if (state.hoverClearTimer) window.clearTimeout(state.hoverClearTimer)
    state.pointers.clear()
    liveStates.delete(state)
    graphInstances.delete(container)
  }

  function destroyAll() {
    liveStates.forEach((state) => {
      const container = state.canvas?.closest(".atlas-graph-shell")
      if (container) destroy(container)
    })
  }

  function rerenderAll() {
    document.querySelectorAll(".atlas-graph-shell").forEach((container) => render(container))
  }

  function handleAction(action, target) {
    const graph = target?.closest?.(".atlas-graph-shell")
    if (!graph) return false
    const state = graphInstances.get(graph)
    if (!state) return false
    if (action === "graph-reset") reset(graph)
    else if (action === "graph-fit") fit(graph)
    else if (action === "fullscreen-graph") {
      if (document.fullscreenElement === graph) document.exitFullscreen?.()
      else {
        const request = graph.requestFullscreen?.()
        if (request?.catch) request.catch(() => graph.classList.toggle("is-fullscreen"))
        else if (!request) graph.classList.toggle("is-fullscreen")
      }
    } else if (action === "pin-active-node") {
      const activeSlug = state.selected || state.lastSelected
      const node = activeSlug ? state.nodeBySlug.get(activeSlug) : null
      if (node) {
        if (state.pinned.has(activeSlug)) {
          state.pinned.delete(activeSlug)
          node.fx = null
          node.fy = null
        } else {
          state.pinned.add(activeSlug)
          node.fx = node.x
          node.fy = node.y
        }
        node.element?.classList.toggle("is-pinned", state.pinned.has(activeSlug))
        updatePinButton(state)
        state.simulation?.alpha(0.42).restart()
      }
    } else if (action === "graph-recall") {
      if (typeof atlas.app?.openGraphRecall === "function")
        atlas.app.openGraphRecall(
          state.selected ||
            state.lastSelected ||
            currentCenter()?.slug ||
            atlas.data.concepts()[0]?.slug,
        )
    } else return false
    return true
  }

  function handleInput(target) {
    const graph = target.closest?.(".atlas-graph-shell")
    if (!graph) return false
    const state = graphInstances.get(graph)
    if (!state) return false
    if (target.matches("[data-atlas-graph-control]")) {
      const key = target.dataset.atlasGraphControl
      const value = Number(target.value)
      atlas.state.update((stored) => {
        stored.graphControls[key] = value
      })
      const output = graph.querySelector(`[data-atlas-graph-output="${key}"]`)
      if (output) output.textContent = formatControlValue(key, value)
      updatePhysics(state)
      return true
    }
    if (target.matches("[data-atlas-graph-scope]")) {
      state.scope = target.value
      render(graph, { fitAfter: true })
      return true
    }
    if (target.matches("[data-atlas-graph-area]")) {
      state.area = target.value
      render(graph, { fitAfter: true })
      return true
    }
    if (target.matches("[data-atlas-graph-depth]")) {
      state.depth = Number(target.value) || 2
      atlas.state.update((stored) => {
        stored.graphControls.depth = state.depth
      })
      render(graph, { fitAfter: true })
      return true
    }
    if (target.matches("[data-atlas-graph-search]")) {
      state.query = target.value
      render(graph, { fitAfter: true })
      return true
    }
    return false
  }

  document.addEventListener("prenav", destroyAll)
  document.addEventListener("render", () => {
    liveStates.forEach((state) => {
      const container = state.canvas?.closest(".atlas-graph-shell")
      if (container && !container.isConnected) destroy(container)
    })
  })
  window.addEventListener("beforeunload", destroyAll)

  function mount(container, options) {
    return createGraph(container, options)
  }

  atlas.graph = { destroy, fit, handleAction, handleInput, mount, render, rerenderAll, reset }
})()
