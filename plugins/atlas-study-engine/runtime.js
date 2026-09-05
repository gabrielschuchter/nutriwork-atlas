import { buildSync } from "esbuild"
import { readFileSync } from "node:fs"

const d3ForceBundle = buildSync({
  bundle: true,
  format: "iife",
  minify: true,
  platform: "browser",
  write: false,
  stdin: {
    contents: `
      import {
        forceCenter,
        forceCollide,
        forceLink,
        forceManyBody,
        forceSimulation,
        forceX,
        forceY,
      } from "d3-force"

      globalThis.__nutriworkD3Force = {
        forceCenter,
        forceCollide,
        forceLink,
        forceManyBody,
        forceSimulation,
        forceX,
        forceY,
      }
    `,
    resolveDir: process.cwd(),
    sourcefile: "atlas-d3-force-entry.js",
  },
}).outputFiles[0].text

const graphClientFiles = [
  "dom.js",
  "data.js",
  "performance.js",
  "graph-physics.js",
  "gesture-math.cjs",
  "graph.js",
  "daily-tasks/tasks.js",
  "daily-tasks/task-storage.js",
  "daily-tasks/task-progress.js",
  "daily-tasks/task-engine.js",
  "daily-tasks.js",
  "app.js",
]

const graphClientSource = graphClientFiles
  .map((filename) => readFileSync(new URL(`./client/${filename}`, import.meta.url), "utf8"))
  .join("\n\n")

const roadmapClientSource = readFileSync(new URL("./client/roadmap.js", import.meta.url), "utf8")

export const atlasRuntime = String.raw`
(() => {
${d3ForceBundle}
${graphClientSource}
})();
`

export const atlasRoadmapRuntime = roadmapClientSource

export default atlasRuntime
