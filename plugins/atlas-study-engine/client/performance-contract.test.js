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

test("Atlas onboarding progress uses the rendered data attribute", async () => {
  const [app, ui] = await Promise.all([
    source("./app.js"),
    readFile(new URL("../../atlas-ui/components/index.js", import.meta.url), "utf8"),
  ])
  assert.match(app, /\[data-atlas-onboarding-progress\]/)
  assert.match(ui, /data-atlas-onboarding-progress/)
})

test("Atlas notes expose a contextual problem report", async () => {
  const [frame, app, ui] = await Promise.all([
    readFile(new URL("../../../quartz/components/frames/AtlasFrame.tsx", import.meta.url), "utf8"),
    source("./app.js"),
    readFile(new URL("../../atlas-ui/components/index.js", import.meta.url), "utf8"),
  ])
  assert.match(frame, /data-atlas-action="open-report"/)
  assert.match(app, /reportHref/)
  assert.match(ui, /id: "atlas-report"/)
})

test("Atlas roadmap is versioned, public and connected to the suggestion endpoint", async () => {
  const [data, frame, ui, client, endpoint, sheets] = await Promise.all([
    readFile(new URL("../../../roadmap.ts", import.meta.url), "utf8"),
    readFile(new URL("../../../quartz/components/frames/AtlasFrame.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../atlas-ui/components/index.js", import.meta.url), "utf8"),
    source("./roadmap.js"),
    readFile(new URL("../../../server/atlas-suggestions.js", import.meta.url), "utf8"),
    readFile(new URL("../../../integrations/google-sheets/Code.gs", import.meta.url), "utf8"),
  ])
  assert.match(data, /roadmapColumns/)
  assert.match(frame, /atlas-roadmap-view/)
  assert.match(frame, /atlas-roadmap-suggestion/)
  assert.match(ui, /roadmap/)
  assert.match(client, /atlas-suggestions/)
  assert.match(endpoint, /submissionId/)
  assert.match(sheets, /appendSuggestion_/)
})

test("Atlas daily tasks stay client-side and reuse concept-opening events", async () => {
  const [runtime, app, graph, daily, storage, engine, frame, ui] = await Promise.all([
    source("../runtime.js"),
    source("./app.js"),
    source("./graph.js"),
    source("./daily-tasks.js"),
    source("./daily-tasks/task-storage.js"),
    source("./daily-tasks/task-engine.js"),
    readFile(new URL("../../../quartz/components/frames/AtlasFrame.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../atlas-ui/components/index.js", import.meta.url), "utf8"),
  ])
  assert.match(runtime, /daily-tasks\/task-engine\.js/)
  assert.match(frame, /data-atlas-daily-action="open"/)
  assert.match(ui, /data-atlas-daily-action.*open/)
  assert.match(app, /atlas:concept-opened/)
  assert.match(graph, /source: "graph"/)
  assert.match(daily, /atlas:concept-opened/)
  assert.match(daily, /AudioContext/)
  assert.match(storage, /atlas_daily_tasks_v1/)
  assert.match(engine, /selectTask/)
  assert.doesNotMatch(daily, /fetch\(/)
})
