import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = async (path) => readFile(new URL(path, import.meta.url), "utf8")

test("Atlas keeps product animations enabled regardless of device preference", async () => {
  const files = await Promise.all([
    source("./graph.js"),
    readFile(new URL("../../../quartz/components/frames/AtlasFrame.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../atlas-ui/components/index.js", import.meta.url), "utf8"),
  ])
  const atlasSource = files.join("\n")
  const forbiddenPatterns = [
    ["prefers", "reduced", "motion"].join("-"),
    ["reduced", "motion"].join("-"),
  ]
  for (const pattern of forbiddenPatterns) assert.equal(atlasSource.includes(pattern), false)
})

test("Atlas synchronizes canvas colors with the initial document theme", async () => {
  const [app, graph] = await Promise.all([source("./app.js"), source("./graph.js")])
  assert.match(app, /atlas\.graph\?\.setTheme\?\.\(nextTheme\)/)
  assert.match(graph, /\n\s*setTheme,\n/)
})

test("Atlas physics has a zero-target steady state and explicit wake lifecycle", async () => {
  const physics = await source("./graph-physics.js")
  assert.match(physics, /\.alphaTarget\(0\)/)
  assert.doesNotMatch(physics, /alphaTarget\(0\.008\)/)
  assert.match(physics, /wakeSimulation/)
  assert.match(physics, /suspendSimulation/)
  assert.match(physics, /resumeSimulationIfNeeded/)
})

test("Atlas graph keeps performance instrumentation opt-in", async () => {
  const [performanceSource, runtimeSource] = await Promise.all([
    source("./performance.js"),
    source("../runtime.js"),
  ])
  assert.match(performanceSource, /atlasPerf/)
  assert.match(runtimeSource, /performance\.js/)
})
