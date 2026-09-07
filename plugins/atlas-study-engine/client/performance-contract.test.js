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

test("Atlas graph reveals local labels progressively and keeps hover emphasis local", async () => {
  const [labels, graph, physics] = await Promise.all([
    source("./graph-labels.js"),
    source("./graph.js"),
    source("./graph-physics.js"),
  ])
  assert.match(labels, /minRatio/)
  assert.match(labels, /viewportBudget/)
  assert.match(graph, /calculateLabelPlacements/)
  assert.match(graph, /labelTouchesNode/)
  assert.match(graph, /labelLayoutDirty/)
  assert.match(
    graph,
    /source\.slug === state\.hoveredSlug \|\| target\.slug === state\.hoveredSlug/,
  )
  assert.doesNotMatch(graph, /camera\.scale > 0\.52/)
  assert.doesNotMatch(graph, /relatedBySlug/)
  assert.match(physics, /width: 6400/)
  assert.match(physics, /distance\(\(edge\).*280.*360/)
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

test("Atlas daily tasks stay client-side and use one semantic activity tracker", async () => {
  const [runtime, app, graph, tracker, daily, audio, storage, engine, frame, ui] =
    await Promise.all([
      source("../runtime.js"),
      source("./app.js"),
      source("./graph.js"),
      source("./daily-tasks/activity-tracker.js"),
      source("./daily-tasks.js"),
      source("./daily-tasks/audio.js"),
      source("./daily-tasks/task-storage.js"),
      source("./daily-tasks/task-engine.js"),
      readFile(
        new URL("../../../quartz/components/frames/AtlasFrame.tsx", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../../atlas-ui/components/index.js", import.meta.url), "utf8"),
    ])
  assert.match(runtime, /daily-tasks\/task-engine\.js/)
  assert.match(runtime, /daily-tasks\/activity-tracker\.js/)
  assert.match(runtime, /daily-tasks\/audio\.js/)
  assert.match(runtime, /atlasRoadmapRuntime/)
  assert.match(frame, /data-atlas-daily-action="open"/)
  assert.match(frame, /atlas-daily-task-list/)
  assert.match(ui, /data-atlas-daily-action.*open/)
  assert.match(ui, /Tarefas de hoje/)
  assert.match(app, /atlas:concept-opened/)
  assert.match(app, /activityTracker\?\.recordActivity\("concept_opened"/)
  assert.match(graph, /source: "graph"/)
  assert.match(graph, /graph_panned/)
  assert.match(graph, /graph_zoomed/)
  assert.match(graph, /graph_fit/)
  assert.match(graph, /WHEEL_ZOOM_DELTA_THRESHOLD/)
  assert.match(tracker, /atlas_activity_v1/)
  assert.match(tracker, /area_filter_changed/)
  assert.match(daily, /completedTasks/)
  assert.match(daily, /atlas:activity/)
  assert.match(daily, /atlas\.atlasSound/)
  assert.match(audio, /webkitAudioContext/)
  assert.match(audio, /contextCreations/)
  assert.match(audio, /resume-rejected/)
  assert.match(audio, /confirmation/)
  assert.match(storage, /atlas_daily_tasks_v2/)
  assert.match(engine, /dailyTaskCount = 3/)
  assert.match(engine, /selectTasks/)
  assert.match(engine, /definitionVersion/)
  assert.doesNotMatch(daily, /fetch\(/)
})

test("Atlas isolates legal pages from the graph runtime", async () => {
  const [frame, ui, data, app] = await Promise.all([
    readFile(new URL("../../../quartz/components/frames/AtlasFrame.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../atlas-ui/components/index.js", import.meta.url), "utf8"),
    source("./data.js"),
    source("./app.js"),
  ])
  assert.match(frame, /if \(isLegal \|\| isRoadmap\)/)
  assert.match(frame, /atlas-legal-document/)
  assert.match(frame, /atlas-roadmap-document/)
  assert.match(frame, /Voltar ao Atlas/)
  assert.match(ui, /\/static\/atlas-runtime\.js/)
  assert.match(ui, /\/static\/atlas-roadmap-runtime\.js/)
  assert.match(data, /AbortController/)
  assert.match(app, /noteTimeoutMs/)
  assert.match(app, /serial !== refreshSerial/)
})

test("Atlas headings never opt into breaking words in the middle", async () => {
  const frame = await readFile(
    new URL("../../../quartz/components/frames/AtlasFrame.tsx", import.meta.url),
    "utf8",
  )
  assert.match(frame, /data-atlas-fit-title/)
  assert.match(frame, /overflow-wrap: normal/)
  assert.match(frame, /word-break: normal/)
  assert.doesNotMatch(frame, /overflow-wrap: anywhere/)
})

test("Atlas responsive surfaces follow the visual viewport and preserve graph controls", async () => {
  const [frame, app, graph, roadmap, ui] = await Promise.all([
    readFile(new URL("../../../quartz/components/frames/AtlasFrame.tsx", import.meta.url), "utf8"),
    source("./app.js"),
    source("./graph.js"),
    source("./roadmap.js"),
    readFile(new URL("../../atlas-ui/components/index.js", import.meta.url), "utf8"),
  ])
  assert.match(frame, /--atlas-viewport-offset-left/)
  assert.match(frame, /var\(--atlas-visual-width, 100vw\)/)
  assert.match(frame, /\.atlas-main[\s\S]*?width: 100%/)
  assert.match(frame, /\.atlas-frame\[data-atlas-route="graph"\] \.atlas-site-footer/)
  assert.match(frame, /\.atlas-frame\[data-atlas-route="note"\] \.atlas-site-footer/)
  assert.match(app, /viewport\?\.offsetLeft/)
  assert.match(app, /atlas-viewport-offset-left/)
  assert.match(app, /atlas-compact-viewport/)
  assert.match(graph, /resizeTimer/)
  assert.match(graph, /resizeCanvas\(state\)/)
  assert.doesNotMatch(graph, /resizeCanvas\(state, \{ fit: !state\.suspended \}\)/)
  assert.match(graph, /atlas-map-controls-shell/)
  assert.match(graph, /atlas-site-footer/)
  assert.match(roadmap, /event\.key === "Tab"/)
  assert.match(ui, /atlas-viewport-offset-left/)
  assert.match(ui, /flex: 1 1 auto/)
})

test("Atlas keeps responsive edge cases covered by source contracts", async () => {
  const [frame, app, access, daily, graph, roadmap, ui] = await Promise.all([
    readFile(new URL("../../../quartz/components/frames/AtlasFrame.tsx", import.meta.url), "utf8"),
    source("./app.js"),
    source("../../atlas-ui/access-runtime.js"),
    source("./daily-tasks.js"),
    source("./graph.js"),
    source("./roadmap.js"),
    readFile(new URL("../../atlas-ui/components/index.js", import.meta.url), "utf8"),
  ])
  assert.match(frame, /AUXILIARY_VIEWPORT_SYNC/)
  assert.match(frame, /atlas-modal-open \.atlas-roadmap-toast/)
  assert.match(app, /activeInside/)
  assert.match(app, /activeIsTabbable/)
  assert.match(app, /focusable\(overlay\)\.filter\(\(item\) => item\.tabIndex >= 0\)/)
  assert.match(app, /closeMobileMenu/)
  assert.match(
    app,
    /function resetMobileSearchQuery\(\)[\s\S]*?mobileSearchQuery = ""[\s\S]*?input\.value = ""/,
  )
  assert.match(app, /if \(source === "search"\) resetMobileSearchQuery\(\)/)
  assert.match(app, /function resetDesktopSearchQuery\(\)[\s\S]*?search\.value = ""/)
  assert.match(app, /function showGraph\([\s\S]*?resetDesktopSearchQuery\(\)/)
  assert.match(
    app,
    /const queryParts = searchQuery\(input\?\.value \?\? mobileSearchQuery\)[\s\S]*?if \(!node \|\| !queryParts\.length \|\| !searchMatch\(node, queryParts\)\) return/,
  )
  assert.match(app, /}\s*catch \(error\) \{\s*if \(serial !== navigationSerial\) return/)
  assert.match(
    app,
    /if \(overlayIsOpen\("atlas-search-sheet"\)\) \{[\s\S]*?renderMobileSearchResults\(input\?\.value \?\? mobileSearchQuery\)/,
  )
  assert.match(access, /document\.addEventListener\("focusin"/)
  assert.match(access, /scrollIntoView\?\.\(\{ block: "nearest"/)
  assert.match(daily, /restoreTarget/)
  assert.match(roadmap, /restoreTarget/)
  assert.match(graph, /resizeCanvas\(state\)/)
  assert.match(ui, /\.atlas-password-eye::after[\s\S]*left: 50%/)
  assert.match(ui, /\.atlas-area-sheet \{[\s\S]*?opacity 200ms cubic-bezier\(\.22, \.8, \.2, 1\)/)
  assert.match(
    ui,
    /\.atlas-area-sheet \.atlas-mobile-sheet-card \{[\s\S]*?transform: translate3d\(0, 8px, 0\) scale\(\.98\)/,
  )
  assert.match(
    ui,
    /\.atlas-area-sheet\.is-open \.atlas-mobile-sheet-card \{[\s\S]*?transform: translate3d\(0, 0, 0\) scale\(1\)/,
  )
})

test("Atlas clean URLs keep deep-page resources addressable", async () => {
  const [head, vercel] = await Promise.all([
    readFile(new URL("../../../quartz/components/Head.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../../vercel.json", import.meta.url), "utf8"),
  ])
  assert.match(head, /joinSegments\(url\.toString\(\), canonicalSlug\)/)
  assert.doesNotMatch(head, /`\$\{canonicalSlug\}\/`/)
  assert.match(vercel, /"cleanUrls": true/)
  assert.match(vercel, /"trailingSlash": false/)
})
