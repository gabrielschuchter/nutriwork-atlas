import assert from "node:assert/strict"
import { createRequire } from "node:module"
import test from "node:test"

const require = createRequire(import.meta.url)
const { applyPinch, startPinch } = require("./gesture-math.cjs")

test("pinch scale is always based on the gesture's initial scale", () => {
  const pinch = startPinch({
    camera: { x: 0, y: 0, scale: 1 },
    centroid: { x: 100, y: 100 },
    distance: 100,
  })

  const first = applyPinch({
    pinch,
    centroid: { x: 100, y: 100 },
    distance: 110,
    minimumScale: 0.1,
    maximumScale: 10,
  })
  const second = applyPinch({
    pinch,
    centroid: { x: 100, y: 100 },
    distance: 120,
    minimumScale: 0.1,
    maximumScale: 10,
  })

  assert.equal(first.scale, 1.1)
  assert.equal(second.scale, 1.2)

  for (const distance of [101, 105, 115, 125, 140]) {
    const sample = applyPinch({
      pinch,
      centroid: { x: 100, y: 100 },
      distance,
      minimumScale: 0.1,
      maximumScale: 10,
    })
    assert.equal(sample.scale, distance / 100)
  }
})

test("pinch keeps the initial world anchor under the moving centroid", () => {
  const pinch = startPinch({
    camera: { x: 40, y: 80, scale: 2 },
    centroid: { x: 120, y: 160 },
    distance: 100,
  })
  const next = applyPinch({
    pinch,
    centroid: { x: 180, y: 220 },
    distance: 150,
    minimumScale: 0.2,
    maximumScale: 8,
  })

  const screenX = (pinch.anchorWorld.x - next.x) * next.scale
  const screenY = (pinch.anchorWorld.y - next.y) * next.scale
  assert.equal(next.scale, 3)
  assert.ok(Math.abs(screenX - 180) < 1e-9)
  assert.ok(Math.abs(screenY - 220) < 1e-9)
})

test("pinch respects camera scale limits without losing the anchor", () => {
  const pinch = startPinch({
    camera: { x: 0, y: 0, scale: 1 },
    centroid: { x: 50, y: 50 },
    distance: 100,
  })
  const next = applyPinch({
    pinch,
    centroid: { x: 80, y: 70 },
    distance: 1000,
    minimumScale: 0.25,
    maximumScale: 2,
  })

  assert.equal(next.scale, 2)
  assert.equal((pinch.anchorWorld.x - next.x) * next.scale, 80)
  assert.equal((pinch.anchorWorld.y - next.y) * next.scale, 70)

  const zoomedOut = applyPinch({
    pinch,
    centroid: { x: 30, y: 40 },
    distance: 1,
    minimumScale: 0.25,
    maximumScale: 2,
  })
  assert.equal(zoomedOut.scale, 0.25)
  assert.equal((pinch.anchorWorld.x - zoomedOut.x) * zoomedOut.scale, 30)
  assert.equal((pinch.anchorWorld.y - zoomedOut.y) * zoomedOut.scale, 40)
})
