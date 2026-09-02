;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  const { WORLD, create: createPhysics } = atlas.graphPhysics
  const { clamp, hash, link, make, searchMatch } = atlas.dom

  const instances = new Set()
  const instanceByMount = new WeakMap()
  const layoutKey = "nutriwork-atlas-graph-layout-v3"
  const cameraKey = "nutriwork-atlas-graph-camera-v2"
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
      // The graph remains usable when session storage is unavailable.
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
    if (node.isDevelopment) return isDarkTheme() ? "#8591A3" : "#78869A"
    return areaColors[
      Math.floor(hash(node.area || node.slug) * areaColors.length) % areaColors.length
    ]
  }

  function scaleBounds(state) {
    const viewport = Math.max(
      1,
      Math.min(state.width || window.innerWidth, state.height || window.innerHeight),
    )
    const logicalSize = Math.max(WORLD.width, WORLD.height)
    return {
      min: Math.max(0.008, Math.min(0.08, viewport / (logicalSize * 10))),
      max: Math.max(
        16,
        Math.max(state.width || window.innerWidth, state.height || window.innerHeight) / 6,
      ),
    }
  }

  function dimensions(state) {
    const rect = state.mount.getBoundingClientRect()
    const fullscreen = state.mount.parentElement?.id === "atlas-graph-view"
    const viewportWidth = window.visualViewport?.width || window.innerWidth
    const viewportHeight = window.visualViewport?.height || window.innerHeight
    return {
      width: Math.max(1, rect.width, fullscreen ? viewportWidth : 0),
      height: Math.max(
        1,
        rect.height || (state.mode === "minimap" ? 224 : viewportHeight),
        fullscreen ? viewportHeight : 0,
      ),
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

  function nodesForFit(state) {
    return state.nodes.length ? state.nodes : state.allNodes
  }

  function calculateFit(state) {
    const size = dimensions(state)
    const nodes = nodesForFit(state)
    const bounds = scaleBounds(state)
    if (!nodes.length) {
      return {
        x: WORLD.width / 2 - size.width / (2 * bounds.min),
        y: WORLD.height / 2 - size.height / (2 * bounds.min),
        scale: bounds.min,
      }
    }
    const minX = Math.min(...nodes.map((node) => node.x))
    const maxX = Math.max(...nodes.map((node) => node.x))
    const minY = Math.min(...nodes.map((node) => node.y))
    const maxY = Math.max(...nodes.map((node) => node.y))
    const width = Math.max(260, maxX - minX)
    const height = Math.max(220, maxY - minY)
    const padding = state.mode === "minimap" ? 22 : Math.min(92, Math.max(46, size.width * 0.055))
    const scale = clamp(
      Math.min(
        Math.max(1, size.width - padding * 2) / width,
        Math.max(1, size.height - padding * 2) / height,
      ),
      bounds.min,
      bounds.max,
    )
    const contentWidth = width * scale
    const contentHeight = height * scale
    return {
      x: minX - Math.max(padding, (size.width - contentWidth) / 2) / scale,
      y: minY - Math.max(padding, (size.height - contentHeight) / 2) / scale,
      scale,
    }
  }

  function fitAll(state) {
    state.camera = calculateFit(state)
    state.userCamera = false
    scheduleDraw(state)
  }

  function resizeCanvas(state, { fit = state.mode === "minimap" || !state.userCamera } = {}) {
    const size = dimensions(state)
    const ratio = Math.min(2, Math.max(1, window.devicePixelRatio || 1))
    state.width = size.width
    state.height = size.height
    state.canvas.width = Math.round(size.width * ratio)
    state.canvas.height = Math.round(size.height * ratio)
    state.canvas.style.width = size.width + "px"
    state.canvas.style.height = size.height + "px"
    state.ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    state.physics?.resize?.(size.width, size.height)
    if (fit && !state.transitioning) fitAll(state)
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
    const developmentEdge = source.isDevelopment || target.isDevelopment
    const ctx = state.ctx
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.lineWidth = highlight ? 1.25 : state.mode === "minimap" ? 0.45 : 0.65
    ctx.strokeStyle = highlight
      ? dark
        ? "rgba(142,185,255,.58)"
        : "rgba(11,99,246,.48)"
      : developmentEdge
        ? dark
          ? "rgba(160,171,188,.20)"
          : "rgba(100,113,132,.22)"
        : dark
          ? "rgba(142,185,255,.13)"
          : "rgba(18,99,255,.16)"
    if (developmentEdge && !highlight) ctx.setLineDash([3, 4])
    ctx.stroke()
    ctx.setLineDash([])
  }

  function drawNode(state, node) {
    const point = worldToScreen(state, node.x, node.y)
    const radius = node.isDevelopment
      ? Math.max(
          state.mode === "minimap" ? 1.2 : 1.8,
          (2.6 + Math.min(4.2, Math.sqrt(node.degree + 1) * 0.7)) * state.camera.scale,
        )
      : Math.max(
          state.mode === "minimap" ? 2.2 : 3.3,
          (4.2 + Math.min(7.8, Math.sqrt(node.degree + 1) * 1.25)) * state.camera.scale,
        )
    const active = node.slug === state.hoveredSlug || node.slug === state.currentSlug
    const dark = isDarkTheme()
    const ctx = state.ctx
    if (active && state.mode !== "minimap") {
      ctx.beginPath()
      ctx.arc(point.x, point.y, radius * 2.25, 0, Math.PI * 2)
      ctx.fillStyle = dark ? "rgba(41,168,255,.14)" : "rgba(18,99,255,.11)"
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
    ctx.fillStyle = colorFor(node)
    ctx.globalAlpha = node.isDevelopment
      ? active
        ? 0.8
        : 0.34
      : state.filterState.query || state.filterState.area !== "all"
        ? active
          ? 1
          : 0.82
        : 0.92
    ctx.fill()
    ctx.globalAlpha = 1
    if (active) {
      ctx.lineWidth = 1.5
      ctx.strokeStyle = dark ? "#F5F7FF" : "#07152A"
      ctx.stroke()
    }

    const labelVisible =
      state.mode === "minimap" ? active : active || (state.camera.scale > 0.52 && node.degree >= 18)
    if (labelVisible) {
      ctx.font = "600 12px Poppins, Arial, sans-serif"
      ctx.fillStyle = node.isDevelopment
        ? dark
          ? "#A1ADBD"
          : "#66768C"
        : dark
          ? "#F5F7FF"
          : "#07152A"
      ctx.textBaseline = "middle"
      ctx.fillText(node.title, point.x + radius + 7, point.y)
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
    if (state.emptyMessage) state.emptyMessage.hidden = state.nodes.length > 0
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

  function releaseDraggedNode(state) {
    if (!state.pointer?.node) return
    state.pointer.node.fx = null
    state.pointer.node.fy = null
    state.physics?.reheat(0.22)
  }

  function pinchFor(state) {
    const points = [...state.pointers.values()]
    if (points.length < 2) return null
    const [first, second] = points
    const midpoint = {
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    }
    return {
      distance: Math.max(1, Math.hypot(first.x - second.x, first.y - second.y)),
      midpoint,
      anchor: screenToWorld(state, midpoint.x, midpoint.y),
    }
  }

  function applyPinch(state) {
    const pinch = state.pinch
    const next = pinchFor(state)
    if (!pinch || !next) return
    const bounds = scaleBounds(state)
    const scale = clamp(
      state.camera.scale * (next.distance / pinch.distance),
      bounds.min,
      bounds.max,
    )
    state.camera.scale = scale
    state.camera.x = next.anchor.x - next.midpoint.x / scale
    state.camera.y = next.anchor.y - next.midpoint.y / scale
    state.userCamera = true
    scheduleDraw(state)
  }

  function beginPointer(state, event) {
    if (event.button !== undefined && event.button !== 0) return
    const point = localPoint(state, event)
    state.pointers.set(event.pointerId, point)
    state.canvas.setPointerCapture?.(event.pointerId)
    if (state.pointers.size >= 2) {
      releaseDraggedNode(state)
      state.pointer = null
      state.pinch = pinchFor(state)
      state.canvas.style.cursor = "grabbing"
      atlas.app?.hidePreview(0)
      event.preventDefault()
      return
    }
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
    if (node) {
      node.fx = node.x
      node.fy = node.y
      state.physics?.reheat(0.18)
    }
    event.preventDefault()
  }

  function movePointer(state, event) {
    const point = localPoint(state, event)
    if (state.pointers.has(event.pointerId)) state.pointers.set(event.pointerId, point)
    if (state.pinch && state.pointers.size >= 2) {
      applyPinch(state)
      event.preventDefault()
      return
    }
    const pointer = state.pointer
    if (!pointer || pointer.id !== event.pointerId) {
      updateHover(state, hitTest(state, point), event)
      return
    }
    const dx = point.x - pointer.lastX
    const dy = point.y - pointer.lastY
    if (Math.hypot(point.x - pointer.startX, point.y - pointer.startY) > 4) pointer.moved = true
    if (pointer.node) {
      const position = screenToWorld(state, point.x, point.y)
      pointer.node.fx = position.x
      pointer.node.fy = position.y
      pointer.node.x = position.x
      pointer.node.y = position.y
      state.physics?.reheat(0.14)
    } else if (pointer.moved) {
      if (state.cameraAnimationFrame) cancelCameraAnimation(state)
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
    state.pointers.delete(event.pointerId)
    if (state.pinch) {
      if (state.pointers.size < 2) state.pinch = null
      state.canvas.releasePointerCapture?.(event.pointerId)
      scheduleDraw(state)
      return
    }
    const pointer = state.pointer
    if (!pointer || pointer.id !== event.pointerId) return
    state.pointer = null
    if (pointer.node) {
      pointer.node.fx = null
      pointer.node.fy = null
      state.physics?.reheat(0.22)
    }
    state.canvas.releasePointerCapture?.(event.pointerId)
    if (!pointer.moved && pointer.node) atlas.app?.openConcept(pointer.node.slug)
    persist()
    scheduleDraw(state)
  }

  function cancelCameraAnimation(state) {
    if (!state.cameraAnimationFrame) return
    window.cancelAnimationFrame(state.cameraAnimationFrame)
    state.cameraAnimationFrame = 0
    state.transitioning = false
  }

  function zoomAt(state, point, factor) {
    cancelCameraAnimation(state)
    const before = screenToWorld(state, point.x, point.y)
    const bounds = scaleBounds(state)
    state.camera.scale = clamp(state.camera.scale * factor, bounds.min, bounds.max)
    const after = screenToWorld(state, point.x, point.y)
    state.camera.x += before.x - after.x
    state.camera.y += before.y - after.y
    state.userCamera = true
    scheduleDraw(state)
  }

  function animateCameraTo(state, target, userCamera, onComplete) {
    cancelCameraAnimation(state)
    const bounds = scaleBounds(state)
    const nextTarget = {
      x: target.x,
      y: target.y,
      scale: clamp(target.scale, bounds.min, bounds.max),
    }
    const start = { ...state.camera }
    const startedAt = performance.now()
    const duration = 300
    state.transitioning = true
    const tick = (now) => {
      if (state.destroyed) return
      const progress = clamp((now - startedAt) / duration, 0, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      state.camera = {
        x: start.x + (nextTarget.x - start.x) * eased,
        y: start.y + (nextTarget.y - start.y) * eased,
        scale: start.scale + (nextTarget.scale - start.scale) * eased,
      }
      scheduleDraw(state)
      if (progress < 1) {
        state.cameraAnimationFrame = window.requestAnimationFrame(tick)
      } else {
        state.cameraAnimationFrame = 0
        state.transitioning = false
        state.userCamera = userCamera
        onComplete?.()
        persist()
      }
    }
    state.cameraAnimationFrame = window.requestAnimationFrame(tick)
  }

  function animateZoom(state, factor) {
    const point = { x: state.width / 2, y: state.height / 2 }
    const world = screenToWorld(state, point.x, point.y)
    const bounds = scaleBounds(state)
    const scale = clamp(state.camera.scale * factor, bounds.min, bounds.max)
    animateCameraTo(
      state,
      {
        x: world.x - point.x / scale,
        y: world.y - point.y / scale,
        scale,
      },
      true,
    )
  }

  function animateFit(state) {
    animateCameraTo(state, calculateFit(state), false)
  }

  function handleWheel(state, event) {
    const point = localPoint(state, event)
    zoomAt(state, point, Math.exp(-event.deltaY * 0.0012))
    event.preventDefault()
  }

  function handleKey(state, event) {
    if (event.key === "+" || event.key === "=") {
      animateZoom(state, 1.18)
      event.preventDefault()
    } else if (event.key === "-" || event.key === "_") {
      animateZoom(state, 0.84)
      event.preventDefault()
    } else if (event.key === "0") {
      animateFit(state)
      event.preventDefault()
    }
  }

  function renderAccessibleList(state) {
    if (!state.listItems) return
    state.listItems.replaceChildren()
    const nodes = state.allNodes
      .filter(
        (node) =>
          searchMatch(node, state.filterState.query) &&
          (state.filterState.area === "all" || node.area === state.filterState.area),
      )
      .sort((left, right) => left.title.localeCompare(right.title, "pt-BR"))
    for (const node of nodes) {
      const item = make("li")
      const nodeLink = link(node, node.title, "atlas-concept-list-link")
      if (node.isDevelopment) nodeLink.dataset.atlasDevelopment = "true"
      item.appendChild(nodeLink)
      state.listItems.appendChild(item)
    }
  }

  function addAccessibleList(state) {
    const details = make("details", "atlas-graph-list")
    const summary = make("summary", "", "Lista de conceitos")
    summary.title = "Alternativa acessível ao grafo"
    const list = make("ol", "atlas-graph-list-items")
    details.append(summary, list)
    details.addEventListener("toggle", () => {
      if (details.open) renderAccessibleList(state)
    })
    state.list = details
    state.listItems = list
    state.mount.appendChild(details)
  }

  function addMapControls(state) {
    const shell = make("div", "atlas-map-controls-shell")
    const returnButton = make("button", "atlas-return-context", "Voltar para o último termo")
    returnButton.id = "atlas-return-note"
    returnButton.type = "button"
    returnButton.dataset.atlasAction = "return-note"
    returnButton.hidden = true
    returnButton.setAttribute("aria-label", "Voltar para o último termo visitado")
    returnButton.title = "Voltar para o último termo visitado"

    const controls = make("div", "atlas-map-controls")
    controls.setAttribute("aria-label", "Controles de zoom do grafo")
    const definitions = [
      ["zoom-out", "−", "Diminuir zoom"],
      ["fit", "○", "Reenquadrar grafo"],
      ["zoom-in", "+", "Aumentar zoom"],
    ]
    for (const [action, label, accessibleLabel] of definitions) {
      const control = make("button", "atlas-map-control", label)
      control.type = "button"
      control.dataset.atlasGraphAction = action
      control.setAttribute("aria-label", accessibleLabel)
      control.title = accessibleLabel
      controls.appendChild(control)
    }
    const onClick = (event) => {
      const control = event.target instanceof Element ? event.target.closest("button") : null
      const action = control?.dataset.atlasGraphAction
      if (action === "zoom-out") animateZoom(state, 0.82)
      else if (action === "zoom-in") animateZoom(state, 1.2)
      else if (action === "fit") animateFit(state)
    }
    controls.addEventListener("click", onClick)
    state.cleanups.push(() => controls.removeEventListener("click", onClick))
    state.controls = controls
    shell.append(returnButton, controls)
    state.mount.appendChild(shell)
  }

  function applyFilter(state, shouldAnimate = true) {
    const previousCount = state.nodes.length
    const visibleNodes = state.allNodes.filter(
      (node) =>
        searchMatch(node, filterState.query) &&
        (filterState.area === "all" || node.area === filterState.area),
    )
    const visibleSlugs = new Set(visibleNodes.map((node) => node.slug))
    state.nodes = visibleNodes
    state.edges = state.allEdges.filter(
      (edge) =>
        visibleSlugs.has(typeof edge.source === "object" ? edge.source.slug : edge.source) &&
        visibleSlugs.has(typeof edge.target === "object" ? edge.target.slug : edge.target),
    )
    state.filterState = { ...filterState }
    state.emptyMessage.hidden = visibleNodes.length > 0
    if (state.hoveredSlug && !visibleSlugs.has(state.hoveredSlug)) {
      state.hoveredSlug = ""
      atlas.app?.hidePreview(0)
    }
    if (state.list?.open) renderAccessibleList(state)
    state.physics?.reheat(previousCount === visibleNodes.length ? 0.16 : 0.3)
    if (shouldAnimate && !state.userCamera) animateFit(state)
    scheduleDraw(state)
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
    const allEdges = (Array.isArray(index?.edges) ? index.edges : [])
      .filter((edge) => allBySlug.has(edge.source) && allBySlug.has(edge.target))
      .map((edge) => ({ source: edge.source, target: edge.target }))

    state.allNodes = allNodes
    state.allEdges = allEdges
    state.nodeBySlug = allBySlug
    state.currentSlug = state.mount.dataset.atlasCurrent || ""
    applyFilter(state, false)

    state.physics = createPhysics(allNodes, allEdges)
    if (state.physics) {
      state.physics.simulation.on("tick", () => {
        if (!state.userCamera && state.initialFitTicks > 0) {
          state.camera = calculateFit(state)
          state.initialFitTicks -= 1
        }
        scheduleDraw(state)
      })
    } else {
      fitAll(state)
    }
    if (state.mode === "minimap") fitAll(state)
    scheduleDraw(state)
  }

  function initialCamera(state) {
    const saved =
      validPoint(storedCamera) && Number.isFinite(storedCamera.scale)
        ? { x: storedCamera.x, y: storedCamera.y, scale: storedCamera.scale }
        : null
    return saved && state.mount.dataset.atlasRestoreCamera === "true" ? saved : calculateFit(state)
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
      cameras: { explore: null, minimap: null },
      userCamera: false,
      transitioning: false,
      nodes: [],
      allNodes: [],
      edges: [],
      allEdges: [],
      nodeBySlug: new Map(),
      currentSlug: "",
      hoveredSlug: "",
      filterState: { ...filterState },
      physics: null,
      pointer: null,
      pointers: new Map(),
      pinch: null,
      frame: 0,
      cameraAnimationFrame: 0,
      initialFitTicks: 60,
      destroyed: false,
      cleanups: [],
      emptyMessage: null,
      list: null,
      listItems: null,
      controls: null,
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
    addMapControls(state)

    const onPointerDown = (event) => beginPointer(state, event)
    const onPointerMove = (event) => movePointer(state, event)
    const onPointerUp = (event) => endPointer(state, event)
    const onPointerLeave = () => {
      if (!state.pointer && !state.pinch) updateHover(state, null)
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
    }
    const onResize = () => resizeCanvas(state)
    window.addEventListener("resize", onResize)
    state.cleanups.push(() => window.removeEventListener("resize", onResize))
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onResize)
      state.cleanups.push(() => window.visualViewport.removeEventListener("resize", onResize))
    }
    resizeCanvas(state, { fit: false })
    buildScene(state)
    state.camera = initialCamera(state)
    if (state.mode === "minimap") fitAll(state)
    scheduleDraw(state)
    return state
  }

  function destroyState(state) {
    state.destroyed = true
    cancelCameraAnimation(state)
    if (state.frame) window.cancelAnimationFrame(state.frame)
    state.physics?.simulation.stop()
    for (const cleanup of state.cleanups) cleanup()
    instances.delete(state)
    instanceByMount.delete(state.mount)
  }

  function persist() {
    const positions = { ...(storedLayout || {}) }
    for (const state of instances) {
      for (const node of state.allNodes) {
        if (validPoint(node)) positions[node.slug] = { x: node.x, y: node.y }
      }
      if (state.mode === "explore" && state.camera) storedCamera = { ...state.camera }
      else if (state.cameras.explore) storedCamera = { ...state.cameras.explore }
    }
    storedLayout = positions
    writeSession(layoutKey, positions)
    if (storedCamera) writeSession(cameraKey, storedCamera)
  }

  function updateModeSurfaces(state) {
    state.mount.dataset.atlasGraphMode = state.mode
    state.mount.setAttribute(
      "aria-label",
      state.mode === "minimap" ? "Minimapa do grafo de conceitos" : "Grafo explorável de conceitos",
    )
    state.canvas.setAttribute(
      "aria-label",
      state.mode === "minimap"
        ? "Minimapa do grafo de conceitos. Arraste, use o zoom ou selecione um conceito."
        : "Grafo de conceitos do Nutriwork Atlas. Arraste, use o zoom ou selecione um conceito.",
    )
    if (state.list) state.list.hidden = state.mode === "minimap"
    if (state.controls) state.controls.dataset.atlasGraphMode = state.mode
  }

  function setMode(mode, currentSlug = "") {
    const state = [...instances][0]
    if (!state || !["explore", "minimap"].includes(mode)) return
    const nextSlug = String(currentSlug || "")
    if (state.mode === mode) {
      state.currentSlug = nextSlug
      updateModeSurfaces(state)
      scheduleDraw(state)
      return
    }
    if (state.mode === "explore") state.cameras.explore = { ...state.camera }
    else state.cameras.minimap = { ...state.camera }
    state.mode = mode
    state.currentSlug = nextSlug
    state.userCamera = false
    updateModeSurfaces(state)
    resizeCanvas(state, { fit: false })
    const target =
      mode === "minimap" ? calculateFit(state) : state.cameras.explore || calculateFit(state)
    animateCameraTo(state, target, false)
  }

  function mountAll() {
    if (!atlas.data.index) return
    const mounts = document.querySelectorAll("[data-atlas-graph-mount]")
    for (const mount of mounts) {
      if (instanceByMount.has(mount)) continue
      const state = createState(mount)
      if (state.ctx) {
        instances.add(state)
        instanceByMount.set(mount, state)
        updateModeSurfaces(state)
      }
    }
  }

  function refresh() {
    for (const state of instances) scheduleDraw(state)
  }

  function redraw() {
    refresh()
  }

  function destroyAll() {
    for (const state of [...instances]) destroyState(state)
    filterState.query = ""
    filterState.area = "all"
  }

  function setFilter(query, area) {
    filterState.query = String(query || "").trim()
    const requestedArea = String(area || "all")
    const availableAreas = new Set((atlas.data.index?.areas || []).map((item) => String(item.id)))
    filterState.area =
      requestedArea === "all" || availableAreas.has(requestedArea) ? requestedArea : "all"
    for (const state of instances) applyFilter(state)
  }

  atlas.graph = {
    destroyAll,
    getState: () => [...instances][0] || null,
    mountAll,
    persist,
    redraw,
    refresh,
    setFilter,
    setMode,
  }
})()
