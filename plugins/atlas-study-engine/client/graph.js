;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  const { clamp, hash, make, normalizeSlug, normalizeText, routeSlug, svgIcon } = atlas.dom
  const graphInstances = new WeakMap()
  const WIDTH = 1800
  const HEIGHT = 1100

  const controlMeta = [
    ["spacing", "Distância", 0.8, 2.2, 0.05],
    ["repulsion", "Repulsão", 0.5, 2, 0.05],
    ["linkStrength", "Conexões", 0.2, 1.2, 0.05],
    ["nodeScale", "Nós", 0.7, 1.5, 0.05],
    ["labelScale", "Rótulos", 0.7, 1.4, 0.05],
    ["edgeOpacity", "Arestas", 0.15, 1, 0.05],
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

  function initialPosition(node, index, nodes, options) {
    const origin = currentCenter()
    const distance = origin ? Math.min(4, bfsDistance(origin.slug, node.slug)) : 1
    const seed = hash(node.slug)
    const angle = seed * Math.PI * 2 + distance * 0.37
    const rings = options.scope === "global" ? 5 : Math.max(2, Number(options.depth || 2) + 1)
    const radius =
      options.scope === "global"
        ? 140 + distance * 145 + seed * 70
        : distance === 0
          ? 0
          : 115 + distance * 170 + seed * 60
    const areaOffset = options.scope === "global" ? hash(node.area) * Math.PI * 2 : 0
    return {
      x: WIDTH / 2 + Math.cos(angle + areaOffset) * radius + (seed - 0.5) * 80,
      y:
        HEIGHT / 2 +
        Math.sin(angle + areaOffset) * radius * 0.68 +
        (hash(node.slug + "y") - 0.5) * 80,
      vx: 0,
      vy: 0,
      pinned: false,
      ring: Math.min(distance, rings),
      index,
    }
  }

  function bfsDistance(start, target) {
    if (start === target) return 0
    const visited = new Set([start])
    const queue = [[start, 0]]
    while (queue.length) {
      const [slug, distance] = queue.shift()
      const node = atlas.data.get(slug)
      if (!node) continue
      for (const neighbor of neighborSlugs(node)) {
        if (neighbor === target) return distance + 1
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          queue.push([neighbor, distance + 1])
        }
      }
      if (distance > 5) break
    }
    return 3
  }

  function createControlPanel(graph, options) {
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
    return Number(value).toFixed(2).replace(/\.00$/, "")
  }

  function createGraph(container, initialOptions) {
    if (!container) return null
    const state = {
      scope: initialOptions?.scope || "local",
      depth: Number(initialOptions?.depth || atlas.state.get().graphControls.depth || 2),
      area: initialOptions?.area || "all",
      query: initialOptions?.query || "",
      positions: new Map(),
      pinned: new Set(),
      selected: "",
      scale: 1,
      panX: 0,
      panY: 0,
      pointers: new Map(),
      drag: null,
      pan: null,
      moved: false,
      lastSelected: "",
      settleFrame: 0,
      settling: false,
      nodes: [],
      edges: [],
    }
    graphInstances.set(container, state)
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
    const controlPanel = createControlPanel(container, {
      ...atlas.state.get().graphControls,
      ...state,
    })
    container.appendChild(controlPanel)
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
    svg.setAttribute("viewBox", `0 0 ${WIDTH} ${HEIGHT}`)
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
    render(container)
    window.requestAnimationFrame(() => {
      loader.classList.add("is-complete")
      window.setTimeout(() => loader.remove(), 480)
    })
    return container
  }

  function ensurePosition(state, node, index, nodes, options) {
    if (!state.positions.has(node.slug))
      state.positions.set(node.slug, initialPosition(node, index, nodes, options))
    return state.positions.get(node.slug)
  }

  function render(container) {
    const state = graphInstances.get(container)
    if (!state) return
    if (state.settleFrame) window.cancelAnimationFrame(state.settleFrame)
    state.settleFrame = 0
    state.settling = false
    const controls = atlas.state.get().graphControls
    const options = { ...controls, ...state }
    state.nodes = visibleNodes(options)
    state.edges = visibleEdges(state.nodes)
    container.classList.toggle("is-dense", state.scope === "global" || state.nodes.length > 48)
    const allowed = new Set(state.nodes.map((node) => node.slug))
    for (const slug of state.positions.keys()) if (!allowed.has(slug)) state.positions.delete(slug)
    state.nodes.forEach((node, index) => ensurePosition(state, node, index, state.nodes, options))
    atlas.dom.clear(state.edgesLayer)
    atlas.dom.clear(state.nodesLayer)
    state.edges.forEach((edge) => {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
      line.dataset.source = edge.source
      line.dataset.target = edge.target
      line.classList.add("atlas-graph-edge")
      if (state.selected && (edge.source === state.selected || edge.target === state.selected))
        line.classList.add("is-related")
      state.edgesLayer.appendChild(line)
      edge.element = line
    })
    state.nodes.forEach((node) => {
      const position = state.positions.get(node.slug)
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.classList.add("atlas-graph-node", "is-" + atlas.state.reviewStatus(node.slug))
      group.dataset.slug = node.slug
      group.setAttribute("role", "button")
      group.setAttribute("tabindex", "0")
      group.setAttribute("aria-label", node.title + ", " + node.areaLabel)
      group.setAttribute("focusable", "true")
      if (state.selected === node.slug) group.classList.add("is-selected")
      if (node.slug === routeSlug()) group.classList.add("is-current")
      if (node.degree >= 20) group.classList.add("is-hub")
      const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      halo.classList.add("atlas-graph-node-halo")
      halo.setAttribute("r", String((node.slug === routeSlug() ? 25 : 18) * controls.nodeScale))
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      circle.classList.add("atlas-graph-node-dot")
      circle.setAttribute(
        "r",
        String(
          (node.slug === routeSlug() ? 10 : 7 + Math.min(5, node.degree / 10)) * controls.nodeScale,
        ),
      )
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text")
      label.classList.add("atlas-graph-node-label")
      label.textContent = node.title.length > 30 ? node.title.slice(0, 29) + "…" : node.title
      label.setAttribute("dy", String(26 * controls.labelScale))
      group.appendChild(halo)
      group.appendChild(circle)
      group.appendChild(label)
      group.addEventListener("pointerenter", () => selectNode(container, node.slug, true))
      group.addEventListener("pointerleave", () => clearSelection(container, node.slug))
      group.addEventListener("focus", () => selectNode(container, node.slug, true))
      group.addEventListener("blur", () => clearSelection(container, node.slug))
      group.addEventListener("click", (event) => {
        if (state.moved) {
          state.moved = false
          return
        }
        if (
          event.target === group ||
          event.target === circle ||
          event.target === halo ||
          event.target === label
        ) {
          if (typeof atlas.app?.openConcept === "function") atlas.app.openConcept(node.slug)
        }
      })
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          if (typeof atlas.app?.openConcept === "function") atlas.app.openConcept(node.slug)
        }
      })
      state.nodesLayer.appendChild(group)
      node.element = group
    })
    applyView(state)
    updateEdges(state)
    updateGraphVisuals(state)
    updatePinButton(state)
    state.settling = true
    settle(container, 0)
  }

  function applyView(state) {
    const width = WIDTH / state.scale
    const height = HEIGHT / state.scale
    state.svg.setAttribute("viewBox", `${state.panX} ${state.panY} ${width} ${height}`)
  }

  function updateEdges(state) {
    state.nodes.forEach((node) => {
      const position = state.positions.get(node.slug)
      if (!position || !node.element) return
      node.element.setAttribute("transform", `translate(${position.x} ${position.y})`)
    })
    state.edges.forEach((edge) => {
      const source = state.positions.get(edge.source)
      const target = state.positions.get(edge.target)
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
      const element = node.element
      if (!element) return
      const halo = element.querySelector(".atlas-graph-node-halo")
      const dot = element.querySelector(".atlas-graph-node-dot")
      const label = element.querySelector(".atlas-graph-node-label")
      if (halo)
        halo.setAttribute("r", String((node.slug === routeSlug() ? 25 : 18) * controls.nodeScale))
      if (dot)
        dot.setAttribute(
          "r",
          String(
            (node.slug === routeSlug() ? 10 : 7 + Math.min(5, node.degree / 10)) *
              controls.nodeScale,
          ),
        )
      if (label) {
        label.setAttribute("dy", String(26 * controls.labelScale))
        label.setAttribute("font-size", String(15 * controls.labelScale))
      }
    })
    state.edges.forEach((edge) => {
      edge.element?.style.setProperty("--atlas-edge-opacity", String(controls.edgeOpacity))
    })
  }

  function settle(container, frame) {
    const state = graphInstances.get(container)
    if (!state || !state.settling) return
    const controls = atlas.state.get().graphControls
    const nodes = state.nodes
    const positions = state.positions
    const edgePairs = state.edges
    const bySlug = new Map(nodes.map((node) => [node.slug, positions.get(node.slug)]))
    nodes.forEach((node, index) => {
      const position = positions.get(node.slug)
      if (!position || position.pinned) return
      let fx = (WIDTH / 2 - position.x) * 0.002
      let fy = (HEIGHT / 2 - position.y) * 0.002
      for (let otherIndex = index + 1; otherIndex < nodes.length; otherIndex += 1) {
        const other = positions.get(nodes[otherIndex].slug)
        if (!other) continue
        const dx = position.x - other.x
        const dy = position.y - other.y
        const distanceSquared = Math.max(180, dx * dx + dy * dy)
        const distance = Math.sqrt(distanceSquared)
        const force = (6800 * Number(controls.repulsion || 1)) / distanceSquared
        fx += (dx / distance) * force
        fy += (dy / distance) * force
        if (!other.pinned) {
          other.vx -= (dx / distance) * force * 0.16
          other.vy -= (dy / distance) * force * 0.16
        }
      }
      position.vx = (position.vx + fx) * 0.82
      position.vy = (position.vy + fy) * 0.82
    })
    edgePairs.forEach((edge) => {
      const source = bySlug.get(edge.source)
      const target = bySlug.get(edge.target)
      if (!source || !target) return
      const dx = target.x - source.x
      const dy = target.y - source.y
      const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy))
      const desired = 155 * Number(controls.spacing || 1)
      const force = (distance - desired) * 0.00034 * Number(controls.linkStrength || 1)
      if (!source.pinned) {
        source.vx += (dx / distance) * force
        source.vy += (dy / distance) * force
      }
      if (!target.pinned) {
        target.vx -= (dx / distance) * force
        target.vy -= (dy / distance) * force
      }
    })
    nodes.forEach((node) => {
      const position = positions.get(node.slug)
      if (!position || position.pinned) return
      position.x = clamp(position.x + position.vx, 50, WIDTH - 50)
      position.y = clamp(position.y + position.vy, 50, HEIGHT - 50)
    })
    updateEdges(state)
    if (frame < 75) {
      state.settleFrame = window.requestAnimationFrame(() => settle(container, frame + 1))
    } else {
      state.settling = false
      state.settleFrame = 0
    }
  }

  function selectNode(container, slug, preview) {
    const state = graphInstances.get(container)
    if (!state) return
    state.selected = normalizeSlug(slug)
    state.lastSelected = state.selected
    const related = new Set([state.selected, ...neighborSlugs(atlas.data.get(state.selected))])
    state.nodes.forEach((node) =>
      node.element?.classList.toggle("is-selected", node.slug === state.selected),
    )
    state.nodes.forEach((node) =>
      node.element?.classList.toggle(
        "is-related",
        related.has(node.slug) && node.slug !== state.selected,
      ),
    )
    state.nodes.forEach((node) =>
      node.element?.classList.toggle("is-dimmed", !related.has(node.slug)),
    )
    state.edges.forEach((edge) =>
      edge.element?.classList.toggle(
        "is-related",
        edge.source === state.selected || edge.target === state.selected,
      ),
    )
    updatePinButton(state)
    if (preview && typeof atlas.app?.showGraphPreview === "function")
      atlas.app.showGraphPreview(atlas.data.get(state.selected), container)
  }

  function updatePinButton(state) {
    const button = state.canvas
      ?.closest(".atlas-graph-shell")
      ?.querySelector("[data-atlas-pin-button]")
    if (!button) return
    const activeSlug = state.selected || state.lastSelected
    const position = activeSlug ? state.positions.get(activeSlug) : null
    button.textContent = position?.pinned ? "Soltar ponto" : "Fixar ponto"
  }

  function clearSelection(container, slug) {
    const state = graphInstances.get(container)
    if (!state || state.drag || state.selected !== normalizeSlug(slug)) return
    state.selected = ""
    state.lastSelected = ""
    state.nodes.forEach((node) =>
      node.element?.classList.remove("is-related", "is-dimmed", "is-selected"),
    )
    state.edges.forEach((edge) => edge.element?.classList.remove("is-related"))
    if (typeof atlas.app?.hideGraphPreview === "function") atlas.app.hideGraphPreview()
  }

  function clientPoint(event, state) {
    const rect = state.svg.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * (WIDTH / state.scale) + state.panX,
      y: ((event.clientY - rect.top) / rect.height) * (HEIGHT / state.scale) + state.panY,
    }
  }

  function distanceBetweenPointers(pointers) {
    const values = [...pointers.values()]
    if (values.length < 2) return 0
    return Math.hypot(values[0].clientX - values[1].clientX, values[0].clientY - values[1].clientY)
  }

  function bindPointerEvents(container, state) {
    const svg = state.svg
    svg.addEventListener("pointerdown", (event) => {
      svg.setPointerCapture?.(event.pointerId)
      state.pointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY })
      const nodeElement =
        event.target instanceof Element ? event.target.closest(".atlas-graph-node") : null
      if (state.pointers.size >= 2) {
        if (state.drag && !state.moved) {
          const position = state.positions.get(state.drag.slug)
          if (position) position.pinned = false
          state.pinned.delete(state.drag.slug)
        }
        state.drag = null
        state.pan = null
        state.pinchStartDistance = distanceBetweenPointers(state.pointers)
        state.pinchStartScale = state.scale
        return
      }
      if (nodeElement) {
        const slug = normalizeSlug(nodeElement.dataset.slug)
        const point = clientPoint(event, state)
        state.drag = {
          slug,
          offsetX: point.x - state.positions.get(slug).x,
          offsetY: point.y - state.positions.get(slug).y,
          startX: event.clientX,
          startY: event.clientY,
        }
        state.moved = false
        const position = state.positions.get(slug)
        if (position) position.pinned = true
        selectNode(container, slug, false)
        container.classList.add("is-dragging")
      } else {
        state.pan = {
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
        state.pointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY })
      if (state.pointers.size >= 2 && state.pinchStartDistance) {
        const distance = distanceBetweenPointers(state.pointers)
        const center = [...state.pointers.values()].reduce(
          (acc, point) => ({ x: acc.x + point.clientX / 2, y: acc.y + point.clientY / 2 }),
          { x: 0, y: 0 },
        )
        const factor = clamp(distance / state.pinchStartDistance, 0.65, 1.65)
        zoomAt(state, center.x, center.y, state.pinchStartScale * factor)
        return
      }
      if (state.drag) {
        const point = clientPoint(event, state)
        const position = state.positions.get(state.drag.slug)
        if (!position) return
        position.x = clamp(point.x - state.drag.offsetX, 30, WIDTH - 30)
        position.y = clamp(point.y - state.drag.offsetY, 30, HEIGHT - 30)
        if (Math.hypot(event.clientX - state.drag.startX, event.clientY - state.drag.startY) > 4) {
          state.moved = true
          state.pinned.add(state.drag.slug)
          updatePinButton(state)
        }
        updateEdges(state)
      } else if (state.pan) {
        const rect = state.svg.getBoundingClientRect()
        state.panX =
          state.pan.originX -
          ((event.clientX - state.pan.startX) / rect.width) * (WIDTH / state.scale)
        state.panY =
          state.pan.originY -
          ((event.clientY - state.pan.startY) / rect.height) * (HEIGHT / state.scale)
        state.moved = true
        applyView(state)
      }
    })
    const endPointer = (event) => {
      const drag = state.drag
      const moved = state.moved
      state.pointers.delete(event.pointerId)
      if (state.pointers.size < 2) state.pinchStartDistance = 0
      if (drag && !moved) {
        const position = state.positions.get(drag.slug)
        if (position) position.pinned = false
        state.pinned.delete(drag.slug)
      }
      state.drag = null
      state.pan = null
      container.classList.remove("is-dragging", "is-panning")
      updatePinButton(state)
      window.setTimeout(() => {
        state.moved = false
      }, 40)
    }
    svg.addEventListener("pointerup", endPointer)
    svg.addEventListener("pointercancel", endPointer)
    svg.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault()
        const next = state.scale * (event.deltaY > 0 ? 0.9 : 1.1)
        zoomAt(state, event.clientX, event.clientY, next)
      },
      { passive: false },
    )
    svg.addEventListener("dblclick", () => fit(container))
  }

  function zoomAt(state, clientX, clientY, nextScale) {
    const previousScale = state.scale
    const next = clamp(nextScale, 0.35, 2.4)
    const rect = state.svg.getBoundingClientRect()
    const before = {
      x: ((clientX - rect.left) / rect.width) * (WIDTH / previousScale) + state.panX,
      y: ((clientY - rect.top) / rect.height) * (HEIGHT / previousScale) + state.panY,
    }
    state.scale = next
    const afterWidth = WIDTH / next
    const afterHeight = HEIGHT / next
    state.panX = before.x - ((clientX - rect.left) / rect.width) * afterWidth
    state.panY = before.y - ((clientY - rect.top) / rect.height) * afterHeight
    applyView(state)
  }

  function fit(container) {
    const state = graphInstances.get(container)
    if (!state || !state.nodes.length) return
    const points = state.nodes.map((node) => state.positions.get(node.slug)).filter(Boolean)
    const minX = Math.min(...points.map((point) => point.x))
    const maxX = Math.max(...points.map((point) => point.x))
    const minY = Math.min(...points.map((point) => point.y))
    const maxY = Math.max(...points.map((point) => point.y))
    const width = Math.max(520, maxX - minX + 260)
    const height = Math.max(360, maxY - minY + 220)
    state.scale = clamp(Math.min(WIDTH / width, HEIGHT / height), 0.42, 1.5)
    state.panX = (minX + maxX) / 2 - WIDTH / state.scale / 2
    state.panY = (minY + maxY) / 2 - HEIGHT / state.scale / 2
    applyView(state)
  }

  function reset(container) {
    const state = graphInstances.get(container)
    if (!state) return
    state.positions.clear()
    state.pinned.clear()
    state.selected = ""
    state.scale = 1
    state.panX = 0
    state.panY = 0
    render(container)
    window.setTimeout(() => fit(container), 90)
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
      if (activeSlug) {
        const position = state.positions.get(activeSlug)
        if (position) {
          position.pinned = !position.pinned
          if (position.pinned) state.pinned.add(activeSlug)
          else state.pinned.delete(activeSlug)
          target.textContent = position.pinned ? "Soltar ponto" : "Fixar ponto"
        }
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
      updateGraphVisuals(state)
      if (["spacing", "repulsion", "linkStrength"].includes(key)) {
        if (state.settleFrame) window.cancelAnimationFrame(state.settleFrame)
        state.settleFrame = 0
        state.settling = true
        settle(graph, 0)
      }
      return true
    }
    if (target.matches("[data-atlas-graph-scope]")) {
      state.scope = target.value
      render(graph)
      return true
    }
    if (target.matches("[data-atlas-graph-area]")) {
      state.area = target.value
      render(graph)
      return true
    }
    if (target.matches("[data-atlas-graph-depth]")) {
      state.depth = Number(target.value) || 2
      atlas.state.update((stored) => {
        stored.graphControls.depth = state.depth
      })
      render(graph)
      return true
    }
    if (target.matches("[data-atlas-graph-search]")) {
      state.query = target.value
      render(graph)
      return true
    }
    return false
  }

  function mount(container, options) {
    return createGraph(container, options)
  }

  atlas.graph = { fit, handleAction, handleInput, mount, render, rerenderAll, reset }
})()
