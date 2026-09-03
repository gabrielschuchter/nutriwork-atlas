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

const clientFiles = [
  "dom.js",
  "data.js",
  "graph-physics.js",
  "gesture-math.cjs",
  "graph.js",
  "app.js",
]

const clientSource = clientFiles
  .map((filename) => readFileSync(new URL(`./client/${filename}`, import.meta.url), "utf8"))
  .join("\n\n")

export const atlasRuntime = String.raw`
(() => {
${d3ForceBundle}
${clientSource}
})();
`

export default atlasRuntime
