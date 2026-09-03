"use strict"

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}

function startPinch({ camera, centroid, distance }) {
  const initialScale = Number.isFinite(camera?.scale) ? camera.scale : 1
  const initialCentroid = {
    x: Number.isFinite(centroid?.x) ? centroid.x : 0,
    y: Number.isFinite(centroid?.y) ? centroid.y : 0,
  }
  const initialDistance = Math.max(1, Number.isFinite(distance) ? distance : 1)

  return {
    initialDistance,
    initialScale,
    initialCentroid,
    anchorWorld: {
      x: initialCentroid.x / initialScale + (Number.isFinite(camera?.x) ? camera.x : 0),
      y: initialCentroid.y / initialScale + (Number.isFinite(camera?.y) ? camera.y : 0),
    },
  }
}

function applyPinch({ pinch, centroid, distance, minimumScale, maximumScale }) {
  const nextCentroid = {
    x: Number.isFinite(centroid?.x) ? centroid.x : pinch.initialCentroid.x,
    y: Number.isFinite(centroid?.y) ? centroid.y : pinch.initialCentroid.y,
  }
  const nextDistance = Math.max(1, Number.isFinite(distance) ? distance : pinch.initialDistance)
  const scale = clamp(
    pinch.initialScale * (nextDistance / pinch.initialDistance),
    minimumScale,
    maximumScale,
  )

  return {
    x: pinch.anchorWorld.x - nextCentroid.x / scale,
    y: pinch.anchorWorld.y - nextCentroid.y / scale,
    scale,
  }
}

const api = { applyPinch, startPinch }

if (typeof module !== "undefined" && module.exports) {
  module.exports = api
} else {
  const atlas = (globalThis.__nutriworkAtlasEngine = globalThis.__nutriworkAtlasEngine || {})
  atlas.graphGestureMath = api
}
