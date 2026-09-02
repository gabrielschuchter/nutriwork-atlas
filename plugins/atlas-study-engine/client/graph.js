;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  const { WORLD, create: createPhysics } = atlas.graphPhysics
  const { clamp, hash, link, make, searchMatch } = atlas.dom

  const instances = new Set()
  const instanceByMount = new WeakMap()
  const layoutKey = "nutriwork-atlas-graph-layout-v2"
  const cameraKey = "nutriwork-atlas-graph-camera-v1"
  const filterState = { query: "", area: "all" }
  const areaColors = ["#1263FF", "#29A8FF", "#6D9DFF", "#8EB9FF", "#2D72D9", "#77C8FF", "#4D82E8"]

  let storedLayout = readSession(layoutKey)
  let storedCamera = readSession(cameraKey)

  function readSession(key) {
    try {
      const value = window.sessionStorage.getItem(key)
      return value ? JSON.parse(value) : null
    } catch {
      return null
    }
  }

  function writeSession(key, value) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      // The graph remains fully usable when storage is unavailable.
    }
  }

  function validPoint(value) {
    return Number.isFinite(value?.x) && Number.isFinite(value?.y)
  }

  function seedPoint(node, index) {
    const angle = hash(node.slug + ":angle") * Math.PI * 2
    const distance = 180 + hash(node.slug + ":radius") * 540 + (index % 9) * 18
    return {
      x: WORLD.width / 2 + Math.cos(angle) * distance,
      y: WORLD.height / 2 + Math.sin(angle) * distance,
    }
  }

  function sourceNode(edge, nodeBySlug) {
    return typeof edge.source === "object" ? edge.source : nodeBySlug.get(edge.source)
  }

  function targetNode(edge, nodeBySlug) {
    return typeof edge.target === "object" ? edge.target : nodeBySlug.get(edge.target)
  }

  function isDarkTheme() {
    const root = document.documentElement
    const saved = root.getAttribute("saved-theme") || root.dataset.theme
    return (
      saved === "dark" || (!saved && window.matchMedia?.("(prefers-color-scheme: dark)").matches)
    )
  }

  function colorFor(node) {
    return areaColors[
      Math.floor(hash(node.area || node.slug) * areaColors.length) % areaColors.length
    ]
  }

  function dimensions(state) {
    const rect = state.mount.getBoundingClientRect()
    return {
      width: Math.max(1, rect.width),
      height: Math.max(1, rect.height || (state.mode === "minimap" ? 224 : window.innerHeight)),
    }
  }

  function worldToScreen(state, x, y) {
    return {
      x: (x - state.camera.x) * state.camera.scale,
      y: (y - state.camera.y) * state.camera.scale,
    }
  }

  function screenToWorld(state, x, y) {
    return {
      x: x / state.camera.scale + state.camera.x,
      y: y / state.camera.scale + state.camera.y,
    }
  }

  function localPoint(state, event) {
    const rect = state.canvas.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  function fitAll(state) {
    const size = dimensions(state)
    const nodes = state.nodes
    if (!nodes.length) {
      state.camera = { x: WORLD.width * 0.2, y: WORLD.height * 0.2, scale: 0.4 }
      state.userCamera = false
      return
    }
    const minX = Math.min(...nodes.map((node) => node.x))
    const maxX = Math.max(...nodes.map((node) => node.x))
    const minY = Math.min(...nodes.map((node) => node.y))
    const maxY = Math.max(...nodes.map((node) => node.y))
    const width = Math.max(260, maxX - minX)
    const height = Math.max(220, maxY - minY)
    const padding = state.mode === "minimap" ? 22 : Math.min(92, Math.max(46, size.width * 0.055))
    const scale = clamp(
      Math.min((size.width - padding * 2) / width, (size.height - padding * 2) / height),
      state.mode === "minimap" ? 0.08 : 0.12,
      state.mode === "minimap" ? 1.2 : 1.85,
    )
    const contentWidth = width * scale
    const contentHeight = height * scale
    state.camera = {
      x: minX - Math.max(padding, (size.width - contentWidth) / 2) / scale,
      y: minY - Math.max(padding, (size.height - contentHeight) / 2) / scale,
      scale,
    }
    state.userCamera = false
  }

  function resizeCanvas(state) {
    const size = dimensions(state)
    const ratio = Math.min(2, Math.max(1, window.devicePixelRatio || 1))
    state.width = size.width
    state.height = size.height
    state.canvas.width = Math.round(size.width * ratio)
    state.canvas.height = Math.round(size.height * ratio)
    state.canvas.style.width = size.width + "px"
    state.canvas.style.height = size.height + "px"
    state.ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    if (state.mode === "minimap" || !state.userCamera) fitAll(state)
    scheduleDraw(state)
  }

  function relatedTo(state, slug) {
    if (!slug) return new Set()
    const node = state.nodeBySlug.get(slug)
    return new Set([...(node?.outgoing || []), ...(node?.incoming || [])])
  }

  function drawEdge(state, edge, highlight) {
    const source = sourceNode(edge, state.nodeBySlug)
    const target = targetNode(edge, state.nodeBySlug)
    if (!source || !target) return
    const start = worldToScreen(state, source.x, source.y)
    const end = worldToScreen(state, target.x, target.y)
    const dark = isDarkTheme()
    state.ctx.beginPath()
    state.ctx.moveTo(start.x, start.y)
    state.ctx.lineTo(end.x, end.y)
    state.ctx.lineWidth = highlight ? 1.25 : state.mode === "minimap" ? 0.45 : 0.65
    state.ctx.strokeStyle = highlight
      ? dark
        ? "rgba(142,185,255,.58)"
        : "rgba(11,99,246,.48)"
      : dark
        ? "rgba(142,185,255,.13)"
        : "rgba(18,99,255,.16)"
    state.ctx.stroke()
  }

  function drawNode(state, node) {
    const point = worldToScreen(state, node.x, node.y)
    const radius = Math.max(
      state.mode === "minimap" ? 2.2 : 3.3,
      (4.2 + Math.min(7.8, Math.sqrt(node.degree + 1) * 1.25)) * state.camera.scale,
    )
    const active = node.slug === state.hoveredSlug || node.slug === state.currentSlug
    const dark = isDarkTheme()
    if (active && state.mode !== "minimap") {
      state.ctx.beginPath()
      state.ctx.arc(point.x, point.y, radius * 2.25, 0, Math.PI * 2)
      state.ctx.fillStyle = dark ? "rgba(41,168,255,.14)" : "rgba(18,99,255,.11)"
      state.ctx.fill()
    }
    state.ctx.beginPath()
    state.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
    state.ctx.fillStyle = colorFor(node)
    state.ctx.globalAlpha =
      state.filterState.query || state.filterState.area !== "all" ? (active ? 1 : 0.82) : 0.92
    state.ctx.fill()
    state.ctx.globalAlpha = 1
    if (active) {
      state.ctx.lineWidth = 1.5
      state.ctx.strokeStyle = dark ? "#F5F7FF" : "#07152A"
      state.ctx.stroke()
    }

    const labelVisible =
      state.mode === "minimap" ? active : active || (state.camera.scale > 0.52 && node.degree >= 18)
    if (labelVisible) {
      state.ctx.font = "600 12px Poppins, Arial, sans-serif"
      state.ctx.fillStyle = dark ? "#F5F7FF" : "#07152A"
      state.ctx.textBaseline = "middle"
      state.ctx.fillText(node.title, point.x + radius + 7, point.y)
    }
  }

  function draw(state) {
    if (state.destroyed) return
    state.frame = 0
    const ctx = state.ctx
    ctx.clearRect(0, 0, state.width, state.height)
    const highlighted = relatedTo(state, state.hoveredSlug || state.currentSlug)
    for (const edge of state.edges) {
      const source = sourceNode(edge, state.nodeBySlug)
      const target = targetNode(edge, state.nodeBySlug)
      const highlight =
        Boolean(state.hoveredSlug) &&
        (source?.slug === state.hoveredSlug ||
          target?.slug === state.hoveredSlug ||
          highlighted.has(source?.slug) ||
          highlighted.has(target?.slug))
      drawEdge(state, edge, highlight)
    }
    for (const node of state.nodes) drawNode(state, node)
    if (state.emptyMessage) {
      state.emptyMessage.hidden = state.nodes.length > 0
    }
  }

  function scheduleDraw(state) {
    if (state.frame || state.destroyed) return
    state.frame = window.requestAnimationFrame(() => draw(state))
  }

  function anchorFor(state, node) {
    const point = worldToScreen(state, node.x, node.y)
    const rect = state.canvas.getBoundingClientRect()
    return {
      left: rect.left + point.x,
      top: rect.top + point.y,
      right: rect.left + point.x + 1,
      bottom: rect.top + point.y + 1,
      width: 1,
      height: 1,
    }
  }

  function hitTest(state, point) {
    let candidate = null
    let distance = Infinity
    for (const node of state.nodes) {
      const screen = worldToScreen(state, node.x, node.y)
      const radius = Math.max(10, (7 + Math.sqrt(node.degree + 1)) * state.camera.scale)
      const nextDistance = Math.hypot(screen.x - point.x, screen.y - point.y)
      if (nextDistance <= radius && nextDistance < distance) {
        candidate = node
        distance = nextDistance
      }
    }
    return candidate
  }

  function updateHover(state, node, event) {
    const nextSlug = node?.slug || ""
    if (nextSlug === state.hoveredSlug) return
    state.hoveredSlug = nextSlug
    state.canvas.style.cursor = node ? "pointer" : "grab"
    if (node && event?.pointerType !== "touch") {
      atlas.app?.showGraphPreview(node, anchorFor(state, node))
    } else if (!node) {
      atlas.app?.hidePreview()
    }
    scheduleDraw(state)
  }

  function beginPointer(state, event) {
    const point = localPoint(state, event)
    const node = hitTest(state, point)
    state.pointer = {
      id: event.pointerId,
      node,
      startX: point.x,
      startY: point.y,
      lastX: point.x,
      lastY: point.y,
      moved: false,
    }
    state.canvas.setPointerCapture?.(event.pointerId)
    if (node) {
      node.fx = node.x
      node.fy = node.y
    }
    event.preventDefault()
  }

  function movePointer(state, event) {
    const point = localPoint(state, event)
    const pointer = state.pointer
    if (!pointer || pointer.id !== event.pointerId) {
      updateHover(state, hitTest(state, point), event)
      return
    }
    const dx = point.x - pointer.lastX
    const dy = point.y - pointer.lastY
    if (Math.hypot(point.x - pointer.startX, point.y - pointer.startY) > 4) {
      pointer.moved = true
    }
    if (pointer.node) {
      const position = screenToWorld(state, point.x, point.y)
      pointer.node.fx = position.x
      pointer.node.fy = position.y
      pointer.node.x = position.x
      pointer.node.y = position.y
      state.physics?.reheat(0.18)
    } else if (pointer.moved) {
      state.camera.x -= dx / state.camera.scale
      state.camera.y -= dy / state.camera.scale
      state.userCamera = true
    }
    pointer.lastX = point.x
    pointer.lastY = point.y
    scheduleDraw(state)
    event.preventDefault()
  }

  function endPointer(state, event) {
    const pointer = state.pointer
    if (!pointer || pointer.id !== event.pointerId) return
    state.pointer = null
    if (pointer.node) {
      pointer.node.fx = null
      pointer.node.fy = null
    }
    state.canvas.releasePointerCapture?.(event.pointerId)
    if (!pointer.moved && pointer.node) {
      atlas.app?.openConcept(pointer.node.slug)
    }
    persist()
    scheduleDraw(state)
  }

  function zoomAt(state, point, factor) {
    const before = screenToWorld(state, point.x, point.y)
    state.camera.scale = clamp(
      state.camera.scale * factor,
      state.mode === "minimap" ? 0.08 : 0.12,
      state.mode === "minimap" ? 2.5 : 4.5,
    )
    const after = screenToWorld(state, point.x, point.y)
    state.camera.x += before.x - after.x
    state.camera.y += before.y - after.y
    state.userCamera = true
    scheduleDraw(state)
  }

  function handleWheel(state, event) {
    const point = localPoint(state, event)
    zoomAt(state, point, Math.exp(-event.deltaY * 0.0012))
    event.preventDefault()
  }

  function handleKey(state, event) {
    if (event.key === "+" || event.key === "=") {
      zoomAt(state, { x: state.width / 2, y: state.height / 2 }, 1.18)
      event.preventDefault()
    } else if (event.key === "-" || event.key === "_") {
      zoomAt(state, { x: state.width / 2, y: state.height / 2 }, 0.84)
      event.preventDefault()
    } else if (event.key === "0") {
      fitAll(state)
      scheduleDraw(state)
      event.preventDefault()
    }
  }

  function addAccessibleList(state) {
    if (state.mode !== "explore") return
    const details = make("details", "atlas-graph-list")
    const summary = make("summary", "", "Lista de conceitos")
    summary.title = "Alternativa acessível ao grafo"
    const list = make("ol", "atlas-graph-list-items")
    details.append(summary, list)
    details.addEventListener("toggle", () => {
      if (!details.open || details.dataset.ready === "true") return
      const nodes = [...state.allNodes].sort((left, right) =>
        left.title.localeCompare(right.title, "pt-BR"),
      )
      for (const node of nodes) {
        const item = make("li")
        item.appendChild(link(node, node.title, "atlas-concept-list-link"))
        list.appendChild(item)
      }
      details.dataset.ready = "true"
    })
    state.mount.appendChild(details)
  }

  function buildScene(state) {
    const index = atlas.data.index
    const concepts = Array.isArray(index?.concepts) ? index.concepts : []
    const allNodes = concepts.map((node, index) => {
      const saved = storedLayout?.[node.slug]
      const point = validPoint(saved) ? saved : seedPoint(node, index)
      return { ...node, id: node.slug, x: point.x, y: point.y, vx: 0, vy: 0 }
    })
    const allBySlug = new Map(allNodes.map((node) => [node.slug, node]))
    const visibleNodes = allNodes.filter(
      (node) =>
        searchMatch(node, filterState.query) &&
        (filterState.area === "all" || node.area === filterState.area),
    )
    const visibleSlugs = new Set(visibleNodes.map((node) => node.slug))
    const edges = (Array.isArray(index?.edges) ? index.edges : [])
      .filter((edge) => visibleSlugs.has(edge.source) && visibleSlugs.has(edge.target))
      .map((edge) => ({ source: edge.source, target: edge.target }))

    state.allNodes = allNodes
    state.nodes = visibleNodes
    state.nodeBySlug = new Map(visibleNodes.map((node) => [node.slug, node]))
    state.edges = edges
    state.filterState = { ...filterState }
    state.currentSlug = state.mount.dataset.atlasCurrent || ""
    state.emptyMessage.hidden = visibleNodes.length > 0

    const hasSavedLayout =
      allNodes.length > 0 && allNodes.every((node) => validPoint(storedLayout?.[node.slug]))
    if (hasSavedLayout) {
      state.physics = null
      state.simulationDone = true
      state.camera = state.mode === "minimap" ? null : readCameraForRoot()
      if (!state.camera || state.mode === "minimap") fitAll(state)
      scheduleDraw(state)
      return
    }

    const physics = createPhysics(visibleNodes, edges)
    state.physics = physics
    state.simulationDone = false
    if (!physics) {
      fitAll(state)
      scheduleDraw(state)
      return
    }
    physics.simulation.on("tick", () => {
      scheduleDraw(state)
      if (physics.simulation.alpha() < 0.08 && !state.simulationDone) {
        state.simulationDone = true
        fitAll(state)
        persist()
      }
    })
    physics.simulation.on("end", () => {
      state.simulationDone = true
      fitAll(state)
      persist()
      scheduleDraw(state)
    })
    if (state.mode === "minimap") fitAll(state)
    scheduleDraw(state)
  }

  function readCameraForRoot() {
    return validPoint(storedCamera) && Number.isFinite(storedCamera.scale)
      ? { x: storedCamera.x, y: storedCamera.y, scale: storedCamera.scale }
      : null
  }

  function createState(mount) {
    const state = {
      mount,
      mode: mount.dataset.atlasGraphMode || "explore",
      canvas: null,
      ctx: null,
      width: 1,
      height: 1,
      camera: { x: 0, y: 0, scale: 0.4 },
      userCamera: false,
      nodes: [],
      allNodes: [],
      edges: [],
      nodeBySlug: new Map(),
      currentSlug: "",
      hoveredSlug: "",
      filterState: { ...filterState },
      physics: null,
      simulationDone: false,
      pointer: null,
      frame: 0,
      destroyed: false,
      cleanups: [],
      emptyMessage: null,
    }
    const canvas = document.createElement("canvas")
    canvas.className = "atlas-graph-canvas"
    canvas.tabIndex = 0
    canvas.setAttribute(
      "aria-label",
      state.mode === "minimap"
        ? "Minimapa do grafo de conceitos. Arraste, use o zoom ou selecione um conceito."
        : "Grafo de conceitos do Nutriwork Atlas. Arraste, use o zoom ou selecione um conceito.",
    )
    canvas.setAttribute("role", "img")
    canvas.setAttribute("data-atlas-graph-canvas", "")
    state.canvas = canvas
    state.ctx = canvas.getContext("2d")
    if (!state.ctx) return state

    const empty = make("p", "atlas-graph-empty", "Nenhum conceito corresponde ao filtro.")
    empty.hidden = true
    empty.setAttribute("role", "status")
    state.emptyMessage = empty
    mount.replaceChildren(canvas)
    if (state.mode === "minimap") {
      const label = make("span", "atlas-minimap-label", "MINIMAPA")
      label.setAttribute("aria-hidden", "true")
      mount.append(label)
    }
    mount.append(empty)
    addAccessibleList(state)

    const onPointerDown = (event) => beginPointer(state, event)
    const onPointerMove = (event) => movePointer(state, event)
    const onPointerUp = (event) => endPointer(state, event)
    const onPointerLeave = () => {
      if (!state.pointer) updateHover(state, null)
    }
    const onWheel = (event) => handleWheel(state, event)
    const onKey = (event) => handleKey(state, event)
    canvas.addEventListener("pointerdown", onPointerDown)
    canvas.addEventListener("pointermove", onPointerMove)
    canvas.addEventListener("pointerup", onPointerUp)
    canvas.addEventListener("pointercancel", onPointerUp)
    canvas.addEventListener("pointerleave", onPointerLeave)
    canvas.addEventListener("wheel", onWheel, { passive: false })
    canvas.addEventListener("keydown", onKey)
    state.cleanups.push(
      () => canvas.removeEventListener("pointerdown", onPointerDown),
      () => canvas.removeEventListener("pointermove", onPointerMove),
      () => canvas.removeEventListener("pointerup", onPointerUp),
      () => canvas.removeEventListener("pointercancel", onPointerUp),
      () => canvas.removeEventListener("pointerleave", onPointerLeave),
      () => canvas.removeEventListener("wheel", onWheel),
      () => canvas.removeEventListener("keydown", onKey),
    )

    if (window.ResizeObserver) {
      const observer = new ResizeObserver(() => resizeCanvas(state))
      observer.observe(mount)
      state.cleanups.push(() => observer.disconnect())
    } else {
      const onResize = () => resizeCanvas(state)
      window.addEventListener("resize", onResize)
      state.cleanups.push(() => window.removeEventListener("resize", onResize))
    }
    buildScene(state)
    resizeCanvas(state)
    return state
  }

  function destroyState(state) {
    state.destroyed = true
    if (state.frame) window.cancelAnimationFrame(state.frame)
    state.physics?.simulation.stop()
    for (const cleanup of state.cleanups) cleanup()
    state.mount.replaceChildren()
    instances.delete(state)
    instanceByMount.delete(state.mount)
  }

  function persist() {
    const positions = { ...(storedLayout || {}) }
    for (const state of instances) {
      for (const node of state.allNodes) {
        if (validPoint(node)) positions[node.slug] = { x: node.x, y: node.y }
      }
      if (state.mode === "explore" && state.camera) {
        storedCamera = { ...state.camera }
      }
    }
    storedLayout = positions
    writeSession(layoutKey, positions)
    if (storedCamera) writeSession(cameraKey, storedCamera)
  }

  function mountAll() {
    if (!atlas.data.index) return
    const mounts = document.querySelectorAll("[data-atlas-graph-mode]")
    for (const mount of mounts) {
      if (instanceByMount.has(mount)) continue
      const state = createState(mount)
      if (state.ctx) {
        instances.add(state)
        instanceByMount.set(mount, state)
      }
    }
  }

  function refresh() {
    const active = [...instances]
    for (const state of active) destroyState(state)
    mountAll()
  }

  function destroyAll() {
    for (const state of [...instances]) destroyState(state)
  }

  function setFilter(query, area) {
    filterState.query = String(query || "").trim()
    filterState.area = String(area || "all")
    refresh()
  }

  atlas.graph = {
    destroyAll,
    mountAll,
    persist,
    refresh,
    setFilter,
  }
})()
