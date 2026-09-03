;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  const { WORLD, create: createPhysics } = atlas.graphPhysics
  const { applyPinch: applyPinchCamera, startPinch } = atlas.graphGestureMath
  const { clamp, hash, link, make, searchMatch, searchQuery } = atlas.dom
  const perf = atlas.perf?.enabled ? atlas.perf : null

  const instances = new Set()
  const instanceByMount = new WeakMap()
  const layoutKey = "nutriwork-atlas-graph-layout-v3"
  const cameraKey = "nutriwork-atlas-graph-camera-v2"
  const filterState = { query: "", area: "all" }
  const areaColors = ["#1263FF", "#29A8FF", "#6D9DFF", "#8EB9FF", "#2D72D9", "#77C8FF", "#4D82E8"]
  const GESTURES = {
    IDLE: "idle",
    TAP_CANDIDATE: "tapCandidate",
    PAN: "pan",
    PINCH: "pinch",
    NODE_DRAG: "nodeDrag",
  }
  const TOUCH_TAP_THRESHOLD = 10
  const MOUSE_DRAG_THRESHOLD = 4
  const PINCH_ACTIVATION_THRESHOLD = 8
  const EMPTY_SET = new Set()
  const EMPTY_DASH = []
  const DEVELOPMENT_DASH = [3, 4]
  const GRAPH_FONT = "600 12px Poppins, Arial, sans-serif"
  let darkTheme = document.documentElement.dataset.theme !== "light"

  let storedLayout = readSession(layoutKey)
  let storedCamera = readSession(cameraKey)
  let availableAreas = null
  let persistHandle = 0
  let persistHandleType = ""

  function readSession(key) {
    try {
      const value = window.sessionStorage.getItem(key)
      return value ? JSON.parse(value) : null
    } catch {
      return null
    }
  }

  function writeSession(key, value) {
    perf?.count("sessionWrites")
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      // The graph remains usable when session storage is unavailable.
    }
  }

  function schedulePersist() {
    if (persistHandle) return
    const flush = () => {
      persistHandle = 0
      persistHandleType = ""
      persist()
    }
    if (typeof window.requestIdleCallback === "function") {
      persistHandleType = "idle"
      persistHandle = window.requestIdleCallback(flush, { timeout: 1000 })
    } else {
      persistHandleType = "timeout"
      persistHandle = window.setTimeout(flush, 0)
    }
  }

  function cancelScheduledPersist() {
    if (!persistHandle) return
    if (persistHandleType === "idle" && typeof window.cancelIdleCallback === "function")
      window.cancelIdleCallback(persistHandle)
    else if (persistHandleType === "timeout") window.clearTimeout(persistHandle)
    persistHandle = 0
    persistHandleType = ""
  }

  function setTheme(theme) {
    const nextDarkTheme = theme !== "light"
    if (darkTheme === nextDarkTheme) return
    darkTheme = nextDarkTheme
    for (const state of instances) scheduleDraw(state)
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

  function measureDimensions(state) {
    const rect = state.mount.getBoundingClientRect()
    const fullscreen = state.mount.parentElement?.id === "atlas-graph-view"
    const viewportWidth = window.visualViewport?.width || window.innerWidth
    const viewportHeight = window.visualViewport?.height || window.innerHeight
    return {
      width: Math.max(1, rect.width || (fullscreen ? viewportWidth : 0)),
      height: Math.max(1, rect.height || (state.mode === "minimap" ? 224 : viewportHeight)),
    }
  }

  function refreshCanvasRect(state) {
    if (!state.canvasRectDirty && state.canvasRect) return state.canvasRect
    const rect = state.canvas.getBoundingClientRect()
    state.canvasRect = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    }
    state.canvasRectDirty = false
    return state.canvasRect
  }

  function invalidateCanvasRect(state) {
    state.canvasRectDirty = true
  }

  function readLocalPoint(state, event) {
    const rect = refreshCanvasRect(state)
    state.localX = event.clientX - rect.left
    state.localY = event.clientY - rect.top
  }

  function nodesForFit(state) {
    return state.nodes.length ? state.nodes : state.allNodes
  }

  function calculateFit(state) {
    const viewportWidth = state.width
    const viewportHeight = state.height
    const nodes = nodesForFit(state)
    const bounds = scaleBounds(state)
    if (!nodes.length) {
      return {
        x: WORLD.width / 2 - viewportWidth / (2 * bounds.min),
        y: WORLD.height / 2 - viewportHeight / (2 * bounds.min),
        scale: bounds.min,
      }
    }
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const node of nodes) {
      if (node.x < minX) minX = node.x
      if (node.x > maxX) maxX = node.x
      if (node.y < minY) minY = node.y
      if (node.y > maxY) maxY = node.y
    }
    const width = Math.max(260, maxX - minX)
    const height = Math.max(220, maxY - minY)
    const padding =
      state.mode === "minimap" ? 22 : Math.min(92, Math.max(46, viewportWidth * 0.055))
    const scale = clamp(
      Math.min(
        Math.max(1, viewportWidth - padding * 2) / width,
        Math.max(1, viewportHeight - padding * 2) / height,
      ),
      bounds.min,
      bounds.max,
    )
    const contentWidth = width * scale
    const contentHeight = height * scale
    return {
      x: minX - Math.max(padding, (viewportWidth - contentWidth) / 2) / scale,
      y: minY - Math.max(padding, (viewportHeight - contentHeight) / 2) / scale,
      scale,
    }
  }

  function fitAll(state) {
    state.camera = calculateFit(state)
    state.userCamera = false
    state.cameraDirty = true
    state.screenPositionsDirty = true
    scheduleDraw(state)
  }

  function resizeCanvas(state, { fit = state.mode === "minimap" || !state.userCamera } = {}) {
    perf?.count("resizeCalls")
    state.resizePending = false
    const previousWidth = state.width
    const previousHeight = state.height
    const measured = measureDimensions(state)
    const ratio = Math.min(2, Math.max(1, window.devicePixelRatio || 1))
    const sizeChanged =
      Math.abs(measured.width - previousWidth) > 0.01 ||
      Math.abs(measured.height - previousHeight) > 0.01
    const backingWidth = Math.round(measured.width * ratio)
    const backingHeight = Math.round(measured.height * ratio)
    const backingChanged =
      backingWidth !== state.canvas.width || backingHeight !== state.canvas.height
    const ratioChanged = ratio !== state.pixelRatio
    state.width = measured.width
    state.height = measured.height
    state.pixelRatio = ratio
    state.canvasRectDirty = true
    if (backingChanged) {
      state.canvas.width = backingWidth
      state.canvas.height = backingHeight
    }
    if (sizeChanged || ratioChanged) {
      if (sizeChanged) {
        state.canvas.style.width = measured.width + "px"
        state.canvas.style.height = measured.height + "px"
      }
      state.ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      if (sizeChanged) state.physics?.resize?.(measured.width, measured.height)
      state.screenPositionsDirty = true
      if (fit && sizeChanged && !state.transitioning) fitAll(state)
      perf?.count("resizeApplied")
      scheduleDraw(state)
    } else if (backingChanged) {
      state.ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      state.screenPositionsDirty = true
      scheduleDraw(state)
    }
    refreshCanvasRect(state)
  }

  function scheduleResize(state) {
    state.resizePending = true
    if (state.destroyed || state.suspended || state.resizeFrame) return
    state.resizeFrame = window.requestAnimationFrame(() => {
      state.resizeFrame = 0
      if (state.destroyed || state.suspended || !state.resizePending) return
      resizeCanvas(state)
    })
  }

  function pauseCameraAnimation(state) {
    if (state.cameraAnimationFrame) window.cancelAnimationFrame(state.cameraAnimationFrame)
    if (state.transitioning && state.cameraAnimationTarget) {
      state.cameraAnimationPaused = {
        target: { ...state.cameraAnimationTarget },
        userCamera: state.cameraAnimationUserCamera,
        onComplete: state.cameraAnimationOnComplete,
      }
    }
    state.cameraAnimationFrame = 0
    state.cameraAnimationTarget = null
    state.cameraAnimationOnComplete = null
    state.transitioning = false
  }

  function suspendVisualWork(state) {
    if (state.suspended) return
    state.suspended = true
    if (state.frame) window.cancelAnimationFrame(state.frame)
    state.frame = 0
    pauseCameraAnimation(state)
    state.physics?.suspendSimulation?.()
  }

  function resumeVisualWork(state) {
    if (!state.suspended) return
    state.suspended = false
    invalidateCanvasRect(state)
    if (state.resizePending) resizeCanvas(state)
    state.physics?.resumeSimulationIfNeeded?.()
    const pausedAnimation = state.cameraAnimationPaused
    state.cameraAnimationPaused = null
    if (pausedAnimation) {
      animateCameraTo(
        state,
        pausedAnimation.target,
        pausedAnimation.userCamera,
        pausedAnimation.onComplete,
      )
    }
    scheduleDraw(state)
  }

  function surfaceIsActive(state) {
    const graphView = document.getElementById("atlas-graph-view")
    const noteView = document.getElementById("atlas-note-view")
    return state.mode === "minimap"
      ? (noteView?.classList.contains("is-active") ?? true)
      : (graphView?.classList.contains("is-active") ?? true)
  }

  function updateVisualActivity(state) {
    const active = !state.documentHidden && state.intersectionVisible && surfaceIsActive(state)
    state.surfaceActive = active
    if (active) resumeVisualWork(state)
    else suspendVisualWork(state)
  }

  function relatedTo(state, slug) {
    return slug ? state.relatedBySlug.get(slug) || EMPTY_SET : EMPTY_SET
  }

  function prepareNodeStyles(state) {
    const ctx = state.ctx
    ctx.font = GRAPH_FONT
    state.nodeStyles = new Array(state.allNodes.length)
    for (const node of state.allNodes) {
      const degreeScale = Math.sqrt(node.degree + 1)
      const development = Boolean(node.isDevelopment)
      const measuredLabelWidth = ctx.measureText(node.title).width
      const conservativeLabelWidth = Math.max(measuredLabelWidth, node.title.length * 9)
      const color = development
        ? null
        : areaColors[
            Math.floor(hash(node.area || node.slug) * areaColors.length) % areaColors.length
          ]
      state.nodeStyles[node.atlasIndex] = {
        development,
        colorDark: color || "#8591A3",
        colorLight: color || "#78869A",
        labelColorDark: development ? "#A1ADBD" : "#F5F7FF",
        labelColorLight: development ? "#66768C" : "#07152A",
        radiusBase: development
          ? 2.6 + Math.min(4.2, degreeScale * 0.7)
          : 4.2 + Math.min(7.8, degreeScale * 1.25),
        exploreMinRadius: development ? 1.8 : 3.3,
        minimapMinRadius: development ? 1.2 : 2.2,
        hitRadiusBase: 7 + degreeScale,
        labelExtent: conservativeLabelWidth + 48,
      }
    }
  }

  function screenPositions(state) {
    if (!state.screenPositionsDirty) return
    const scale = state.camera.scale
    const cameraX = state.camera.x
    const cameraY = state.camera.y
    for (const node of state.nodes) {
      const index = node.atlasIndex
      state.screenX[index] = (node.x - cameraX) * scale
      state.screenY[index] = (node.y - cameraY) * scale
    }
    state.screenPositionsDirty = false
  }

  function segmentVisible(state, startX, startY, endX, endY) {
    const margin = state.mode === "minimap" ? 2 : 4
    const minX = Math.min(startX, endX)
    const maxX = Math.max(startX, endX)
    const minY = Math.min(startY, endY)
    const maxY = Math.max(startY, endY)
    return (
      maxX >= -margin &&
      minX <= state.width + margin &&
      maxY >= -margin &&
      minY <= state.height + margin
    )
  }

  function applyEdgeStyle(state, styleIndex) {
    const ctx = state.ctx
    if (styleIndex === 2) {
      ctx.lineWidth = 1.25
      ctx.strokeStyle = darkTheme ? "rgba(142,185,255,.58)" : "rgba(11,99,246,.48)"
      ctx.setLineDash(EMPTY_DASH)
      return
    }
    ctx.lineWidth = state.mode === "minimap" ? 0.45 : 0.65
    if (styleIndex === 1) {
      ctx.strokeStyle = darkTheme ? "rgba(160,171,188,.20)" : "rgba(100,113,132,.22)"
      ctx.setLineDash(DEVELOPMENT_DASH)
    } else {
      ctx.strokeStyle = darkTheme ? "rgba(142,185,255,.13)" : "rgba(18,99,255,.16)"
      ctx.setLineDash(EMPTY_DASH)
    }
  }

  function drawEdges(state, highlighted) {
    const ctx = state.ctx
    let activeStyle = -1
    let pathOpen = false

    for (const edge of state.edges) {
      const source = edge.source
      const target = edge.target
      if (!source || !target) continue
      const sourceIndex = source.atlasIndex
      const targetIndex = target.atlasIndex
      const startX = state.screenX[sourceIndex]
      const startY = state.screenY[sourceIndex]
      const endX = state.screenX[targetIndex]
      const endY = state.screenY[targetIndex]
      if (!segmentVisible(state, startX, startY, endX, endY)) {
        perf?.count("edgeCulls")
        continue
      }
      const highlight =
        Boolean(state.hoveredSlug) &&
        (source.slug === state.hoveredSlug ||
          target.slug === state.hoveredSlug ||
          highlighted.has(source.slug) ||
          highlighted.has(target.slug))
      const nextStyle = highlight ? 2 : source.isDevelopment || target.isDevelopment ? 1 : 0
      if (nextStyle !== activeStyle) {
        if (pathOpen) ctx.stroke()
        activeStyle = nextStyle
        ctx.beginPath()
        applyEdgeStyle(state, activeStyle)
        pathOpen = true
      }
      ctx.moveTo(startX, startY)
      ctx.lineTo(endX, endY)
    }
    if (pathOpen) ctx.stroke()
    ctx.setLineDash(EMPTY_DASH)
  }

  function drawNode(state, node) {
    const index = node.atlasIndex
    const pointX = state.screenX[index]
    const pointY = state.screenY[index]
    const style = state.nodeStyles[index]
    const radius = Math.max(
      state.mode === "minimap" ? style.minimapMinRadius : style.exploreMinRadius,
      style.radiusBase * state.camera.scale,
    )
    const active = node.slug === state.hoveredSlug || node.slug === state.currentSlug
    const labelVisible =
      state.mode === "minimap" ? active : active || (state.camera.scale > 0.52 && node.degree >= 18)
    const haloRadius = active && state.mode !== "minimap" ? radius * 2.25 : radius
    const horizontalMargin = Math.max(haloRadius, labelVisible ? style.labelExtent + radius : 0)
    const verticalMargin = Math.max(haloRadius, labelVisible ? 8 : 0)
    if (
      pointX < -horizontalMargin ||
      pointX > state.width + horizontalMargin ||
      pointY < -verticalMargin ||
      pointY > state.height + verticalMargin
    ) {
      perf?.count("nodeCulls")
      return
    }

    const ctx = state.ctx
    if (active && state.mode !== "minimap") {
      ctx.beginPath()
      ctx.arc(pointX, pointY, haloRadius, 0, Math.PI * 2)
      ctx.fillStyle = darkTheme ? "rgba(41,168,255,.14)" : "rgba(18,99,255,.11)"
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(pointX, pointY, radius, 0, Math.PI * 2)
    ctx.fillStyle = darkTheme ? style.colorDark : style.colorLight
    ctx.globalAlpha = style.development
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
      ctx.strokeStyle = darkTheme ? "#F5F7FF" : "#07152A"
      ctx.stroke()
    }

    if (labelVisible) {
      ctx.fillStyle = darkTheme ? style.labelColorDark : style.labelColorLight
      ctx.fillText(node.title, pointX + radius + 7, pointY)
    }
  }

  function draw(state) {
    if (state.destroyed || state.suspended) return
    const startedAt = perf ? performance.now() : 0
    perf?.count("draws")
    state.frame = 0
    const ctx = state.ctx
    ctx.clearRect(0, 0, state.width, state.height)
    screenPositions(state)
    const highlighted = relatedTo(state, state.hoveredSlug || state.currentSlug)
    drawEdges(state, highlighted)
    ctx.font = GRAPH_FONT
    ctx.textBaseline = "middle"
    for (const node of state.nodes) drawNode(state, node)
    if (perf) perf.sample("draw", performance.now() - startedAt)
  }

  function scheduleDraw(state) {
    if (state.destroyed) return
    state.needsDraw = true
    if (state.frame || state.suspended) return
    perf?.count("graphRafScheduled")
    state.frame = window.requestAnimationFrame(() => {
      state.frame = 0
      if (state.suspended) return
      perf?.count("graphRafCallbacks")
      flushPointerMoves(state)
      flushWheel(state)
      state.needsDraw = false
      draw(state)
    })
  }

  function anchorFor(state, node) {
    screenPositions(state)
    const rect = refreshCanvasRect(state)
    const index = node.atlasIndex
    const pointX = state.screenX[index]
    const pointY = state.screenY[index]
    return {
      left: rect.left + pointX,
      top: rect.top + pointY,
      right: rect.left + pointX + 1,
      bottom: rect.top + pointY + 1,
      width: 1,
      height: 1,
    }
  }

  function isTouchPointer(eventOrType) {
    const pointerType =
      typeof eventOrType === "string" ? eventOrType : eventOrType?.pointerType || "mouse"
    return pointerType === "touch" || pointerType === "pen"
  }

  function hitTest(state, pointX, pointY, pointerType = "mouse") {
    const startedAt = perf ? performance.now() : 0
    perf?.count("hitTests")
    screenPositions(state)
    const touch = isTouchPointer(pointerType)
    let candidate = null
    let distance = Infinity
    for (const node of state.nodes) {
      const style = state.nodeStyles[node.atlasIndex]
      const visualRadius = Math.max(
        state.mode === "minimap" ? style.minimapMinRadius : style.exploreMinRadius,
        style.radiusBase * state.camera.scale,
      )
      const radius = touch
        ? Math.max(22, visualRadius + 12)
        : Math.max(10, style.hitRadiusBase * state.camera.scale)
      const screenX = state.screenX[node.atlasIndex]
      const screenY = state.screenY[node.atlasIndex]
      const deltaX = screenX - pointX
      const deltaY = screenY - pointY
      const nextDistance = deltaX * deltaX + deltaY * deltaY
      if (nextDistance <= radius * radius && nextDistance < distance) {
        candidate = node
        distance = nextDistance
      }
    }
    if (perf) perf.sample("hitTest", performance.now() - startedAt)
    return candidate
  }

  function updateHover(state, node, event) {
    const nextSlug = node?.slug || ""
    if (nextSlug === state.hoveredSlug) return false
    state.hoveredSlug = nextSlug
    state.canvas.style.cursor = node ? "pointer" : "grab"
    if (node && !isTouchPointer(event)) {
      atlas.app?.showGraphPreview(node, anchorFor(state, node))
    } else if (!node) {
      atlas.app?.hidePreview()
    }
    return true
  }

  function releaseDraggedNode(state) {
    if (!state.pointer?.node || state.pointer.gesture !== GESTURES.NODE_DRAG) return
    state.pointer.node.fx = null
    state.pointer.node.fy = null
    state.physics?.reheat(0.22)
  }

  function pinchPoints(state) {
    let firstId = state.pinch?.pointerIds?.[0]
    let secondId = state.pinch?.pointerIds?.[1]
    if (!state.pointers.has(firstId) || !state.pointers.has(secondId)) {
      const iterator = state.pointers.keys()
      firstId = iterator.next().value
      secondId = iterator.next().value
    }
    if (firstId === undefined || secondId === undefined) return null
    const first = state.pointers.get(firstId)
    const second = state.pointers.get(secondId)
    if (!first || !second) return null
    return {
      pointerIds: state.pinch?.pointerIds || [firstId, secondId],
      distance: Math.max(1, Math.hypot(first.x - second.x, first.y - second.y)),
      midpointX: (first.x + second.x) / 2,
      midpointY: (first.y + second.y) / 2,
    }
  }

  function createPinch(state) {
    const sample = pinchPoints(state)
    if (!sample) return null
    return {
      ...startPinch({
        camera: state.camera,
        centroid: { x: sample.midpointX, y: sample.midpointY },
        distance: sample.distance,
      }),
      pointerIds: sample.pointerIds,
      active: false,
    }
  }

  function pinchPassedThreshold(pinch, next) {
    return (
      Math.abs(next.distance - pinch.initialDistance) >= PINCH_ACTIVATION_THRESHOLD ||
      Math.hypot(
        next.midpointX - pinch.initialCentroid.x,
        next.midpointY - pinch.initialCentroid.y,
      ) >= PINCH_ACTIVATION_THRESHOLD
    )
  }

  function applyPinch(state) {
    const pinch = state.pinch
    const next = pinchPoints(state)
    if (!pinch || !next) return
    if (!pinch.active) {
      if (!pinchPassedThreshold(pinch, next)) return
      pinch.active = true
      state.gesture = GESTURES.PINCH
      state.suppressTap = true
      atlas.app?.dismissTouchHint()
      atlas.app?.hidePreview(0)
      cancelCameraAnimation(state)
    }
    perf?.count("pinchFrames")
    const bounds = scaleBounds(state)
    state.camera = applyPinchCamera({
      camera: state.camera,
      pinch,
      centroid: { x: next.midpointX, y: next.midpointY },
      distance: next.distance,
      minimumScale: bounds.min,
      maximumScale: bounds.max,
    })
    state.userCamera = true
    state.cameraDirty = true
    state.screenPositionsDirty = true
    return true
  }

  function releasePointer(state, pointerId) {
    if (state.canvas.hasPointerCapture?.(pointerId)) state.canvas.releasePointerCapture?.(pointerId)
  }

  function capturePointer(state, pointerId) {
    try {
      state.canvas.setPointerCapture?.(pointerId)
    } catch (error) {
      if (error?.name !== "NotFoundError") throw error
    }
  }

  function setPanContinuation(state) {
    const first = state.pointers.entries().next().value
    if (!first) {
      state.pointer = null
      state.gesture = GESTURES.IDLE
      return
    }
    const [id, point] = first
    state.pointer = {
      id,
      node: null,
      pointerType: "touch",
      startX: point.x,
      startY: point.y,
      lastX: point.x,
      lastY: point.y,
      moved: true,
      gesture: GESTURES.PAN,
    }
    state.gesture = GESTURES.PAN
    state.canvas.style.cursor = "grabbing"
  }

  function beginPointer(state, event) {
    if (event.button !== undefined && event.button !== 0) return
    readLocalPoint(state, event)
    const pointX = state.localX
    const pointY = state.localY
    const touch = isTouchPointer(event)
    state.pointers.set(event.pointerId, { x: pointX, y: pointY })
    if (state.pointers.size >= 2) {
      cancelCameraAnimation(state)
      releaseDraggedNode(state)
      state.pointer = null
      state.gesture = GESTURES.PINCH
      state.pinch = createPinch(state)
      state.suppressTap = true
      state.canvas.style.cursor = "grabbing"
      atlas.app?.hidePreview(0)
      capturePointer(state, event.pointerId)
      event.preventDefault()
      return
    }
    if (!touch || state.mode !== "minimap") capturePointer(state, event.pointerId)
    const node = hitTest(state, pointX, pointY, event.pointerType)
    state.pointer = {
      id: event.pointerId,
      node,
      pointerType: event.pointerType || "mouse",
      startX: pointX,
      startY: pointY,
      lastX: pointX,
      lastY: pointY,
      moved: false,
      gesture: GESTURES.TAP_CANDIDATE,
    }
    state.gesture = GESTURES.TAP_CANDIDATE
    state.suppressTap = false
    if (node && !touch) {
      node.fx = node.x
      node.fy = node.y
      state.physics?.reheat(0.18)
      state.layoutDirty = true
    }
    if (!touch || state.mode !== "minimap") event.preventDefault()
    scheduleDraw(state)
  }

  function processPointerMove(state, pointerId, pointX, pointY, pointerType) {
    perf?.count("pointerMovesProcessed")
    if (state.pinch && state.pointers.size >= 2) {
      return applyPinch(state)
    }
    const pointer = state.pointer
    if (!pointer || pointer.id !== pointerId) {
      return updateHover(state, hitTest(state, pointX, pointY, pointerType), pointerType)
    }
    const dx = pointX - pointer.lastX
    const dy = pointY - pointer.lastY
    const touch = isTouchPointer(pointer.pointerType)
    const threshold = touch ? TOUCH_TAP_THRESHOLD : MOUSE_DRAG_THRESHOLD
    if (
      !pointer.moved &&
      Math.hypot(pointX - pointer.startX, pointY - pointer.startY) > threshold
    ) {
      pointer.moved = true
      pointer.gesture = pointer.node && !touch ? GESTURES.NODE_DRAG : GESTURES.PAN
      state.gesture = pointer.gesture
      if (pointer.gesture === GESTURES.PAN) cancelCameraAnimation(state)
      if (touch) atlas.app?.dismissTouchHint()
    }
    if (pointer.gesture === GESTURES.NODE_DRAG && pointer.node) {
      const worldX = pointX / state.camera.scale + state.camera.x
      const worldY = pointY / state.camera.scale + state.camera.y
      pointer.node.fx = worldX
      pointer.node.fy = worldY
      pointer.node.x = worldX
      pointer.node.y = worldY
      state.layoutDirty = true
      state.screenPositionsDirty = true
      state.physics?.reheat(0.14)
    } else if (pointer.gesture === GESTURES.PAN && !(touch && state.mode === "minimap")) {
      if (state.cameraAnimationFrame) cancelCameraAnimation(state)
      state.camera.x -= dx / state.camera.scale
      state.camera.y -= dy / state.camera.scale
      state.userCamera = true
      state.cameraDirty = true
      state.screenPositionsDirty = true
    }
    pointer.lastX = pointX
    pointer.lastY = pointY
    return pointer.gesture !== GESTURES.TAP_CANDIDATE || pointer.moved
  }

  function flushPointerMoves(state) {
    let changed = false
    if (state.pinch && state.pointers.size >= 2) {
      for (const move of state.pendingPointerMoves.values()) move.pending = false
      changed = applyPinch(state)
    } else {
      for (const [pointerId, move] of state.pendingPointerMoves) {
        if (!move.pending) continue
        move.pending = false
        changed = processPointerMove(state, pointerId, move.x, move.y, move.pointerType) || changed
      }
    }
    if (!state.pointer && !state.pinch && !state.pointers.size) state.pendingPointerMoves.clear()
    return changed
  }

  function queuePointerMove(state, event) {
    perf?.count("pointerMovesQueued")
    readLocalPoint(state, event)
    const point = state.pointers.get(event.pointerId)
    if (point) {
      point.x = state.localX
      point.y = state.localY
    }
    let move = state.pendingPointerMoves.get(event.pointerId)
    if (!move) {
      move = { x: 0, y: 0, pointerType: "mouse", pending: false }
      state.pendingPointerMoves.set(event.pointerId, move)
    }
    move.x = state.localX
    move.y = state.localY
    move.pointerType = event.pointerType || "mouse"
    move.pending = true
    const touch = isTouchPointer(event)
    if (!touch || state.mode !== "minimap") event.preventDefault()
    if (!(touch && state.mode === "minimap")) scheduleDraw(state)
  }

  function endPointer(state, event) {
    const canceled = event.type === "pointercancel" || event.type === "lostpointercapture"
    if (!canceled) {
      const move = state.pendingPointerMoves.get(event.pointerId)
      if (move?.pending) {
        move.pending = false
        processPointerMove(state, event.pointerId, move.x, move.y, move.pointerType)
      }
    }
    state.pendingPointerMoves.delete(event.pointerId)
    state.pointers.delete(event.pointerId)
    releasePointer(state, event.pointerId)
    if (state.pinch) {
      if (state.pointers.size >= 2) {
        state.pinch = createPinch(state)
        if (state.pinch) state.pinch.active = true
        state.gesture = GESTURES.PINCH
      } else if (state.pointers.size === 1 && !canceled) {
        state.pinch = null
        setPanContinuation(state)
      } else {
        state.pinch = null
        state.pointer = null
        state.gesture = GESTURES.IDLE
        state.suppressTap = false
      }
      if (!state.pinch) state.canvas.style.cursor = "grab"
      if (!state.pointers.size) schedulePersist()
      scheduleDraw(state)
      return
    }
    const pointer = state.pointer
    if (!pointer || pointer.id !== event.pointerId) return
    state.pointer = null
    if (pointer.node && pointer.gesture === GESTURES.NODE_DRAG) {
      pointer.node.fx = null
      pointer.node.fy = null
      state.physics?.reheat(0.22)
    }
    const isTap = !canceled && pointer.gesture === GESTURES.TAP_CANDIDATE && !pointer.moved
    state.gesture = GESTURES.IDLE
    if (isTouchPointer(pointer.pointerType)) atlas.app?.dismissTouchHint()
    if (isTap && pointer.node && !state.suppressTap) atlas.app?.openConcept(pointer.node.slug)
    state.suppressTap = false
    schedulePersist()
    scheduleDraw(state)
  }

  function cancelCameraAnimation(state) {
    if (state.cameraAnimationFrame) window.cancelAnimationFrame(state.cameraAnimationFrame)
    state.cameraAnimationFrame = 0
    state.cameraAnimationTarget = null
    state.cameraAnimationOnComplete = null
    state.cameraAnimationUserCamera = false
    state.cameraAnimationPaused = null
    state.transitioning = false
  }

  function zoomAt(state, pointX, pointY, factor) {
    cancelCameraAnimation(state)
    const beforeX = pointX / state.camera.scale + state.camera.x
    const beforeY = pointY / state.camera.scale + state.camera.y
    const bounds = scaleBounds(state)
    state.camera.scale = clamp(state.camera.scale * factor, bounds.min, bounds.max)
    const afterX = pointX / state.camera.scale + state.camera.x
    const afterY = pointY / state.camera.scale + state.camera.y
    state.camera.x += beforeX - afterX
    state.camera.y += beforeY - afterY
    state.userCamera = true
    state.cameraDirty = true
    state.screenPositionsDirty = true
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
    if (state.suspended) {
      state.cameraAnimationPaused = { target: nextTarget, userCamera, onComplete }
      state.cameraAnimationUserCamera = userCamera
      state.cameraDirty = true
      return
    }
    state.cameraAnimationTarget = nextTarget
    state.cameraAnimationUserCamera = userCamera
    state.cameraAnimationOnComplete = onComplete
    state.cameraDirty = true
    state.transitioning = true
    const tick = (now) => {
      if (state.destroyed) return
      const progress = clamp((now - startedAt) / duration, 0, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      state.camera.x = start.x + (nextTarget.x - start.x) * eased
      state.camera.y = start.y + (nextTarget.y - start.y) * eased
      state.camera.scale = start.scale + (nextTarget.scale - start.scale) * eased
      state.cameraDirty = true
      state.screenPositionsDirty = true
      scheduleDraw(state)
      if (progress < 1) {
        state.cameraAnimationFrame = window.requestAnimationFrame(tick)
      } else {
        state.cameraAnimationFrame = 0
        state.cameraAnimationTarget = null
        state.transitioning = false
        state.userCamera = userCamera
        state.cameraAnimationUserCamera = false
        state.cameraAnimationOnComplete = null
        onComplete?.()
        schedulePersist()
      }
    }
    state.cameraAnimationFrame = window.requestAnimationFrame(tick)
  }

  function animateZoom(state, factor) {
    const pointX = state.width / 2
    const pointY = state.height / 2
    const baseCamera = state.cameraAnimationTarget || state.camera
    const worldX = pointX / baseCamera.scale + baseCamera.x
    const worldY = pointY / baseCamera.scale + baseCamera.y
    const bounds = scaleBounds(state)
    const scale = clamp(baseCamera.scale * factor, bounds.min, bounds.max)
    animateCameraTo(
      state,
      {
        x: worldX - pointX / scale,
        y: worldY - pointY / scale,
        scale,
      },
      true,
    )
  }

  function animateFit(state) {
    animateCameraTo(state, calculateFit(state), false)
  }

  function flushWheel(state) {
    if (!state.wheelQueued || !state.wheelDeltaY) return false
    const deltaY = state.wheelDeltaY
    const pointX = state.wheelX
    const pointY = state.wheelY
    state.wheelDeltaY = 0
    state.wheelQueued = false
    zoomAt(state, pointX, pointY, Math.exp(-deltaY * 0.0012))
    return true
  }

  function handleWheel(state, event) {
    perf?.count("wheelEvents")
    readLocalPoint(state, event)
    if (!state.wheelQueued) {
      state.wheelX = state.localX
      state.wheelY = state.localY
      state.wheelDeltaY = event.deltaY
      state.wheelQueued = true
    } else if (
      Math.abs(state.wheelX - state.localX) <= 0.5 &&
      Math.abs(state.wheelY - state.localY) <= 0.5
    ) {
      state.wheelDeltaY += event.deltaY
    } else {
      flushWheel(state)
      state.wheelX = state.localX
      state.wheelY = state.localY
      state.wheelDeltaY = event.deltaY
      state.wheelQueued = true
    }
    event.preventDefault()
    scheduleDraw(state)
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
    const nodes = (state.sortedNodes || state.allNodes).filter(
      (node) =>
        searchMatch(node, state.filterState.queryParts) &&
        (state.filterState.area === "all" || node.area === state.filterState.area),
    )
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
    const onPointerDown = (event) => event.stopPropagation()
    controls.addEventListener("click", onClick)
    controls.addEventListener("pointerdown", onPointerDown)
    state.cleanups.push(
      () => controls.removeEventListener("click", onClick),
      () => controls.removeEventListener("pointerdown", onPointerDown),
    )
    state.controls = controls
    shell.append(returnButton, controls)
    state.mount.appendChild(shell)
  }

  function applyFilter(state, shouldAnimate = true) {
    perf?.count("filterRecalculations")
    const previousCount = state.nodes.length
    const queryParts = searchQuery(filterState.query)
    const visibleNodes = state.allNodes.filter(
      (node) =>
        searchMatch(node, queryParts) &&
        (filterState.area === "all" || node.area === filterState.area),
    )
    const visibleSlugs = new Set(visibleNodes.map((node) => node.slug))
    state.nodes = visibleNodes
    state.edges = state.allEdges.filter(
      (edge) => visibleSlugs.has(edge.source.slug) && visibleSlugs.has(edge.target.slug),
    )
    state.filterState = { ...filterState, queryParts }
    state.screenPositionsDirty = true
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
      return {
        ...node,
        id: node.slug,
        atlasIndex: index,
        x: point.x,
        y: point.y,
        vx: 0,
        vy: 0,
      }
    })
    const allBySlug = new Map(allNodes.map((node) => [node.slug, node]))
    const allEdges = (Array.isArray(index?.edges) ? index.edges : [])
      .filter((edge) => allBySlug.has(edge.source) && allBySlug.has(edge.target))
      .map((edge) => ({ source: allBySlug.get(edge.source), target: allBySlug.get(edge.target) }))

    const relatedBySlug = new Map()
    for (const node of allNodes) {
      const related = new Set()
      for (const slug of node.outgoing) related.add(slug)
      for (const slug of node.incoming) related.add(slug)
      relatedBySlug.set(node.slug, related)
    }

    state.allNodes = allNodes
    state.sortedNodes = [...allNodes].sort((left, right) =>
      left.title.localeCompare(right.title, "pt-BR"),
    )
    state.allEdges = allEdges
    state.nodeBySlug = allBySlug
    state.relatedBySlug = relatedBySlug
    state.screenX = new Float64Array(allNodes.length)
    state.screenY = new Float64Array(allNodes.length)
    prepareNodeStyles(state)
    state.currentSlug = state.mount.dataset.atlasCurrent || ""
    applyFilter(state, false)

    state.physics = createPhysics(allNodes, allEdges)
    if (state.physics) {
      state.physics.simulation.on("tick", () => {
        perf?.count("physicsTicks")
        state.layoutDirty = true
        state.screenPositionsDirty = true
        if (!state.userCamera && state.initialFitTicks > 0) {
          state.camera = calculateFit(state)
          state.cameraDirty = true
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
    const startedAt = perf ? performance.now() : 0
    const state = {
      mount,
      mode: mount.dataset.atlasGraphMode || "explore",
      canvas: null,
      ctx: null,
      width: 1,
      height: 1,
      pixelRatio: 1,
      canvasRect: null,
      canvasRectDirty: true,
      localX: 0,
      localY: 0,
      camera: { x: 0, y: 0, scale: 0.4 },
      cameras: { explore: null, minimap: null },
      userCamera: false,
      transitioning: false,
      cameraDirty: true,
      cameraAnimationUserCamera: false,
      cameraAnimationPaused: null,
      nodes: [],
      allNodes: [],
      edges: [],
      allEdges: [],
      nodeBySlug: new Map(),
      sortedNodes: [],
      relatedBySlug: new Map(),
      screenX: null,
      screenY: null,
      screenPositionsDirty: true,
      nodeStyles: [],
      currentSlug: "",
      hoveredSlug: "",
      filterState: { ...filterState, queryParts: [] },
      layoutDirty: true,
      physics: null,
      pointer: null,
      pointers: new Map(),
      pendingPointerMoves: new Map(),
      pinch: null,
      gesture: GESTURES.IDLE,
      suppressTap: false,
      frame: 0,
      needsDraw: false,
      cameraAnimationFrame: 0,
      cameraAnimationTarget: null,
      cameraAnimationOnComplete: null,
      wheelQueued: false,
      wheelDeltaY: 0,
      wheelX: 0,
      wheelY: 0,
      resizePending: false,
      resizeFrame: 0,
      suspended: false,
      surfaceActive: true,
      documentHidden: document.hidden,
      intersectionVisible: true,
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

    const transitionViews = [
      document.getElementById("atlas-graph-view"),
      document.getElementById("atlas-note-view"),
    ]
    for (const view of transitionViews) {
      if (!view) continue
      const onTransitionEnd = (event) => {
        if (event.target !== view || event.propertyName !== "transform") return
        invalidateCanvasRect(state)
        refreshCanvasRect(state)
        scheduleDraw(state)
      }
      view.addEventListener("transitionend", onTransitionEnd)
      state.cleanups.push(() => view.removeEventListener("transitionend", onTransitionEnd))
    }

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
    const onPointerMove = (event) => queuePointerMove(state, event)
    const onPointerUp = (event) => endPointer(state, event)
    const onLostPointerCapture = (event) => {
      if (state.pointers.has(event.pointerId)) endPointer(state, event)
    }
    const onPointerLeave = () => {
      if (!state.pointer && !state.pinch) {
        state.pendingPointerMoves.clear()
        if (updateHover(state, null)) scheduleDraw(state)
      }
    }
    const onWheel = (event) => handleWheel(state, event)
    const onKey = (event) => handleKey(state, event)
    canvas.addEventListener("pointerdown", onPointerDown)
    canvas.addEventListener("pointermove", onPointerMove)
    canvas.addEventListener("pointerup", onPointerUp)
    canvas.addEventListener("pointercancel", onPointerUp)
    canvas.addEventListener("lostpointercapture", onLostPointerCapture)
    canvas.addEventListener("pointerleave", onPointerLeave)
    canvas.addEventListener("wheel", onWheel, { passive: false })
    canvas.addEventListener("keydown", onKey)
    state.cleanups.push(
      () => canvas.removeEventListener("pointerdown", onPointerDown),
      () => canvas.removeEventListener("pointermove", onPointerMove),
      () => canvas.removeEventListener("pointerup", onPointerUp),
      () => canvas.removeEventListener("pointercancel", onPointerUp),
      () => canvas.removeEventListener("lostpointercapture", onLostPointerCapture),
      () => canvas.removeEventListener("pointerleave", onPointerLeave),
      () => canvas.removeEventListener("wheel", onWheel),
      () => canvas.removeEventListener("keydown", onKey),
    )

    if (window.ResizeObserver) {
      const observer = new ResizeObserver(() => scheduleResize(state))
      observer.observe(mount)
      state.cleanups.push(() => observer.disconnect())
    }
    const onResize = () => scheduleResize(state)
    window.addEventListener("resize", onResize)
    state.cleanups.push(() => window.removeEventListener("resize", onResize))
    const onScroll = () => invalidateCanvasRect(state)
    window.addEventListener("scroll", onScroll, { passive: true, capture: true })
    state.cleanups.push(() => window.removeEventListener("scroll", onScroll, true))
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onResize)
      state.cleanups.push(() => window.visualViewport.removeEventListener("resize", onResize))
      window.visualViewport.addEventListener("scroll", onScroll)
      state.cleanups.push(() => window.visualViewport.removeEventListener("scroll", onScroll))
    }
    const onVisibilityChange = () => {
      state.documentHidden = document.hidden
      updateVisualActivity(state)
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    state.cleanups.push(() => document.removeEventListener("visibilitychange", onVisibilityChange))
    if (window.IntersectionObserver) {
      const observer = new IntersectionObserver((entries) => {
        state.intersectionVisible = entries[0]?.isIntersecting !== false
        updateVisualActivity(state)
      })
      observer.observe(mount)
      state.cleanups.push(() => observer.disconnect())
    }
    resizeCanvas(state, { fit: false })
    buildScene(state)
    state.camera = initialCamera(state)
    state.cameraDirty = true
    state.screenPositionsDirty = true
    if (state.mode === "minimap") fitAll(state)
    updateVisualActivity(state)
    scheduleDraw(state)
    if (perf) perf.sample("graphInit", performance.now() - startedAt)
    return state
  }

  function destroyState(state) {
    state.destroyed = true
    cancelCameraAnimation(state)
    if (state.frame) window.cancelAnimationFrame(state.frame)
    if (state.resizeFrame) window.cancelAnimationFrame(state.resizeFrame)
    state.frame = 0
    state.resizeFrame = 0
    state.pendingPointerMoves.clear()
    state.pointers.clear()
    state.physics?.suspendSimulation?.()
    for (const cleanup of state.cleanups) cleanup()
    instances.delete(state)
    instanceByMount.delete(state.mount)
  }

  function persist() {
    perf?.count("persistCalls")
    cancelScheduledPersist()
    let layoutChanged = false
    let cameraChanged = false
    for (const state of instances) {
      if (state.layoutDirty) {
        if (!storedLayout) storedLayout = {}
        for (const node of state.allNodes) {
          if (validPoint(node)) storedLayout[node.slug] = { x: node.x, y: node.y }
        }
        state.layoutDirty = false
        layoutChanged = true
      }
      if (state.cameraDirty) {
        const camera = state.mode === "explore" ? state.camera : state.cameras.explore
        if (camera) {
          storedCamera = { ...camera }
          cameraChanged = true
        }
        state.cameraDirty = false
      }
    }
    if (layoutChanged) writeSession(layoutKey, storedLayout)
    if (cameraChanged && storedCamera) writeSession(cameraKey, storedCamera)
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
    invalidateCanvasRect(state)
    if (state.mode === mode) {
      state.currentSlug = nextSlug
      updateModeSurfaces(state)
      updateVisualActivity(state)
      scheduleDraw(state)
      return
    }
    if (state.mode === "explore") {
      state.cameras.explore = { ...state.camera }
      state.cameraDirty = true
    } else {
      state.cameras.minimap = { ...state.camera }
    }
    state.mode = mode
    state.currentSlug = nextSlug
    state.userCamera = false
    updateModeSurfaces(state)
    updateVisualActivity(state)
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
        updateVisualActivity(state)
      }
    }
  }

  function refresh() {
    for (const state of instances) scheduleDraw(state)
  }

  function runSyntheticBenchmark(multiplier = 1, frameCount = 60) {
    if (!perf) return null
    const state = [...instances][0]
    if (!state || !state.nodes.length) return null

    const factor = [1, 2, 4].includes(Number(multiplier)) ? Number(multiplier) : 1
    const frames = Math.max(1, Math.min(240, Math.floor(Number(frameCount) || 60)))
    const saved = {
      nodes: state.nodes,
      edges: state.edges,
      nodeStyles: state.nodeStyles,
      screenX: state.screenX,
      screenY: state.screenY,
      screenPositionsDirty: state.screenPositionsDirty,
      frame: state.frame,
    }
    const baseNodes = state.nodes
    const baseEdges = state.edges
    const syntheticNodes = []
    const syntheticStyles = []
    const copies = []

    try {
      if (state.frame) window.cancelAnimationFrame(state.frame)
      state.frame = 0
      for (let copyIndex = 0; copyIndex < factor; copyIndex += 1) {
        const copy = new Map()
        for (const node of baseNodes) {
          const synthetic = {
            ...node,
            slug: `${node.slug}::atlas-perf-${copyIndex}`,
            atlasIndex: syntheticNodes.length,
          }
          syntheticNodes.push(synthetic)
          syntheticStyles.push(state.nodeStyles[node.atlasIndex])
          copy.set(node, synthetic)
        }
        copies.push(copy)
      }
      const syntheticEdges = []
      for (const copy of copies) {
        for (const edge of baseEdges) {
          const source = copy.get(edge.source)
          const target = copy.get(edge.target)
          if (source && target) syntheticEdges.push({ source, target })
        }
      }

      state.nodes = syntheticNodes
      state.edges = syntheticEdges
      state.nodeStyles = syntheticStyles
      state.screenX = new Float64Array(syntheticNodes.length)
      state.screenY = new Float64Array(syntheticNodes.length)
      state.screenPositionsDirty = true
      perf.reset()
      for (let frameIndex = 0; frameIndex < frames; frameIndex += 1) {
        state.screenPositionsDirty = true
        draw(state)
      }
      return {
        ...perf.snapshot(),
        synthetic: {
          factor,
          frames,
          nodes: syntheticNodes.length,
          edges: syntheticEdges.length,
        },
      }
    } finally {
      state.nodes = saved.nodes
      state.edges = saved.edges
      state.nodeStyles = saved.nodeStyles
      state.screenX = saved.screenX
      state.screenY = saved.screenY
      state.screenPositionsDirty = true
      if (saved.frame && !state.suspended) scheduleDraw(state)
    }
  }

  function redraw() {
    refresh()
  }

  function destroyAll() {
    persist()
    for (const state of [...instances]) destroyState(state)
    filterState.query = ""
    filterState.area = "all"
  }

  function setFilter(query, area) {
    filterState.query = String(query || "").trim()
    const requestedArea = String(area || "all")
    if (!availableAreas)
      availableAreas = new Set((atlas.data.index?.areas || []).map((item) => String(item.id)))
    filterState.area =
      requestedArea === "all" || availableAreas.has(requestedArea) ? requestedArea : "all"
    for (const state of instances) applyFilter(state)
  }

  atlas.graph = {
    destroyAll,
    getState: () => [...instances][0] || null,
    getPerformance: () => perf?.snapshot?.() || null,
    mountAll,
    persist,
    redraw,
    refresh,
    ...(perf ? { runSyntheticBenchmark } : {}),
    setFilter,
    setTheme,
    setMode,
  }
})()
