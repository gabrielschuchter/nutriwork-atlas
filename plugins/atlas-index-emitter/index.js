import { h } from "preact"
import { copyFile, mkdir } from "node:fs/promises"
import path from "node:path"

const atlasHomeSlug = "atlas/index"

const AtlasHomeBody = () => {
  const HomeBody = () => h("div", { id: "atlas-home-dashboard" })
  return HomeBody
}

export const AtlasHomePage = () => ({
  name: "AtlasHomePage",
  priority: 30,
  match: ({ slug }) => slug === atlasHomeSlug,
  generate: () => [
    {
      slug: atlasHomeSlug,
      title: "Nutriwork Atlas",
      data: {
        description: "Rede interativa de conhecimento para estudar Nutrição e ciência.",
        frontmatter: {
          title: "Nutriwork Atlas",
          description: "Rede interativa de conhecimento para estudar Nutrição e ciência.",
          tags: [],
        },
      },
    },
  ],
  layout: "atlas-home",
  body: AtlasHomeBody,
})

const copyAtlasIndex = async (outputPath) => {
  const sourcePath = path.join(process.cwd(), "quartz", "static", "atlas-index.json")
  const targetPath = path.join(outputPath, "static", "atlas-index.json")

  await mkdir(path.dirname(targetPath), { recursive: true })
  await copyFile(sourcePath, targetPath)
  return targetPath
}

const copyLearningPaths = async (outputPath) => {
  const sourcePath = path.join(process.cwd(), "data", "learning-paths.json")
  const targetPath = path.join(outputPath, "static", "learning-paths.json")

  await mkdir(path.dirname(targetPath), { recursive: true })
  await copyFile(sourcePath, targetPath)
  return targetPath
}

export const AtlasIndexEmitter = () => ({
  name: "AtlasIndexEmitter",
  async *emit({ argv }) {
    yield await copyAtlasIndex(argv.output)
    yield await copyLearningPaths(argv.output)
  },
  async *partialEmit({ argv }) {
    yield await copyAtlasIndex(argv.output)
    yield await copyLearningPaths(argv.output)
  },
})

export const manifest = {
  name: "atlas-index-emitter",
  displayName: "Nutriwork Atlas derived index",
  description: "Emits the deterministic study index generated from the Atlas corpus.",
  version: "0.1.0",
  quartzVersion: ">=5.0.0",
  category: ["emitter", "pageType"],
}
