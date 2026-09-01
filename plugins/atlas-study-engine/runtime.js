import { readFileSync } from "node:fs"

const clientFiles = [
  "dom.js",
  "data.js",
  "state.js",
  "graph.js",
  "views.js",
  "onboarding.js",
  "app.js",
]

const clientSource = clientFiles
  .map((filename) => readFileSync(new URL(`./client/${filename}`, import.meta.url), "utf8"))
  .join("\n\n")

export const atlasRuntime = String.raw`
(() => {
${clientSource}
})();
`

export default atlasRuntime
