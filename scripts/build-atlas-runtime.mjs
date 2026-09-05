import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { atlasRoadmapRuntime, atlasRuntime } from "../plugins/atlas-study-engine/runtime.js"

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const destination = path.join(projectRoot, "public", "static", "atlas-runtime.js")
const roadmapDestination = path.join(projectRoot, "public", "static", "atlas-roadmap-runtime.js")

await mkdir(path.dirname(destination), { recursive: true })
await writeFile(destination, atlasRuntime, "utf8")
await writeFile(roadmapDestination, atlasRoadmapRuntime, "utf8")
console.log(
  `Generated ${path.relative(projectRoot, destination)} and ${path.relative(projectRoot, roadmapDestination)}`,
)
