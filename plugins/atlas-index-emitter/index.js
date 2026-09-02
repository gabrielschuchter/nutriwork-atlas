import { copyFile, mkdir } from "node:fs/promises"
import path from "node:path"

const copyAtlasIndex = async (outputPath) => {
  const sourcePath = path.join(process.cwd(), "quartz", "static", "atlas-index.json")
  const targetPath = path.join(outputPath, "static", "atlas-index.json")

  await mkdir(path.dirname(targetPath), { recursive: true })
  await copyFile(sourcePath, targetPath)
  return targetPath
}

export const AtlasIndexEmitter = () => ({
  name: "AtlasIndexEmitter",
  async *emit({ argv }) {
    yield await copyAtlasIndex(argv.output)
  },
  async *partialEmit({ argv }) {
    yield await copyAtlasIndex(argv.output)
  },
})

export const manifest = {
  name: "atlas-index-emitter",
  displayName: "Nutriwork Atlas graph index",
  description: "Emits the compact deterministic graph index generated from the Atlas corpus.",
  version: "0.2.0",
  quartzVersion: ">=5.0.0",
  category: "emitter",
}
