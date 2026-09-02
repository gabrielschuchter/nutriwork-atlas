#!/usr/bin/env node

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { parse as parseYaml } from "yaml"
import { simplifySlug, slugifyFilePath } from "@quartz-community/utils/path"

const projectRoot = path.resolve(import.meta.dirname, "..")
const contentRoot = path.join(projectRoot, "content", "atlas")
const outputPath = path.join(projectRoot, "quartz", "static", "atlas-index.json")
const areasPath = path.join(projectRoot, "data", "atlas-areas.json")

const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

const normalizeSlug = (value) =>
  simplifySlug(slugifyFilePath(String(value ?? ""), true)).replace(/^\/+|\/+$/g, "")

const unique = (values) => [...new Set(values)]

async function collectMarkdown(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "pt-BR"))) {
    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await collectMarkdown(filePath)))
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) files.push(filePath)
  }
  return files
}

function parseDocument(source) {
  if (!source.startsWith("---")) return { frontmatter: {}, body: source }
  const end = source.indexOf("\n---", 3)
  if (end < 0) return { frontmatter: {}, body: source }
  const raw = source.slice(3, end).replace(/^\r?\n/, "")
  const parsed = parseYaml(raw)
  return {
    frontmatter: parsed && typeof parsed === "object" ? parsed : {},
    body: source.slice(end + 5).replace(/^\r?\n/, ""),
  }
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\x60\x60\x60[\s\S]*?\x60\x60\x60/g, " ")
    .replace(
      /!?\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g,
      (_, target, label) => label ?? target,
    )
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[\x60*_>#~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function excerptFrom(body) {
  const excerpt = cleanText(body)
  if (excerpt.length <= 280) return excerpt
  return excerpt.slice(0, 279).trimEnd() + "…"
}

function targetToSlug(target) {
  const cleaned = String(target ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/\.md$/i, "")
  if (!cleaned || cleaned.startsWith("#") || /^https?:\/\//i.test(cleaned)) return ""
  return normalizeSlug(cleaned.includes("/") ? cleaned : "atlas/" + cleaned)
}

function extractLinks(body) {
  const links = []
  const pattern = /!?\[\[([^\]]+)\]\]/g
  let match
  while ((match = pattern.exec(body)) !== null) {
    const parts = match[1].split("|")
    const slug = targetToSlug(parts[0].split("#")[0])
    if (slug) links.push(slug)
  }
  return unique(links)
}

function classifyArea(title, areaConfig) {
  const normalized = normalizeText(title)
  for (const area of areaConfig.areas ?? []) {
    if ((area.keywords ?? []).some((keyword) => normalized.includes(normalizeText(keyword)))) {
      return area.id
    }
  }
  return areaConfig.defaultArea
}

function areaLabel(areaId, areaConfig) {
  return areaConfig.areas?.find((area) => area.id === areaId)?.label ?? "Fundamentos da nutrição"
}

const areaConfig = JSON.parse(await readFile(areasPath, "utf8"))
const filePaths = await collectMarkdown(contentRoot)
const documents = await Promise.all(
  filePaths.map(async (filePath) => {
    const source = await readFile(filePath, "utf8")
    const relative = path.relative(contentRoot, filePath).split(path.sep).join("/")
    const baseName = relative.replace(/\.md$/i, "")
    const parsed = parseDocument(source)
    const title =
      typeof parsed.frontmatter.title === "string"
        ? parsed.frontmatter.title
        : path.basename(baseName)
    return {
      slug: normalizeSlug("atlas/" + baseName),
      title,
      area: classifyArea(title, areaConfig),
      excerpt:
        typeof parsed.frontmatter.description === "string"
          ? parsed.frontmatter.description
          : excerptFrom(parsed.body),
      links: extractLinks(parsed.body),
    }
  }),
)

documents.sort((left, right) => left.title.localeCompare(right.title, "pt-BR"))
const nodesBySlug = new Map(documents.map((document) => [document.slug, document]))
const outgoing = new Map(documents.map((document) => [document.slug, new Set()]))
const incoming = new Map(documents.map((document) => [document.slug, new Set()]))
const edgeSet = new Set()

for (const document of documents) {
  for (const target of document.links) {
    if (!nodesBySlug.has(target)) continue
    outgoing.get(document.slug).add(target)
    incoming.get(target).add(document.slug)
    edgeSet.add(document.slug + "|" + target)
  }
}

const nodes = documents.map((document) => {
  const outgoingSlugs = [...outgoing.get(document.slug)].sort()
  const incomingSlugs = [...incoming.get(document.slug)].sort()
  const degree = unique([...outgoingSlugs, ...incomingSlugs]).length
  return {
    slug: document.slug,
    title: document.title,
    area: document.area,
    areaLabel: areaLabel(document.area, areaConfig),
    excerpt: document.excerpt,
    outgoing: outgoingSlugs,
    incoming: incomingSlugs,
    degree,
  }
})

const edges = [...edgeSet]
  .map((value) => {
    const [source, target] = value.split("|")
    return { source, target }
  })
  .sort((left, right) =>
    (left.source + "|" + left.target).localeCompare(right.source + "|" + right.target),
  )

const areaCounts = new Map()
for (const node of nodes) areaCounts.set(node.area, (areaCounts.get(node.area) ?? 0) + 1)
const areas = (areaConfig.areas ?? [])
  .map((area) => ({ id: area.id, label: area.label, count: areaCounts.get(area.id) ?? 0 }))
  .concat(
    areaCounts.has(areaConfig.defaultArea) &&
      !(areaConfig.areas ?? []).some((area) => area.id === areaConfig.defaultArea)
      ? [
          {
            id: areaConfig.defaultArea,
            label: areaLabel(areaConfig.defaultArea, areaConfig),
            count: areaCounts.get(areaConfig.defaultArea),
          },
        ]
      : [],
  )
  .filter((area) => area.count > 0)
  .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, "pt-BR"))

const index = {
  version: 2,
  concepts: nodes,
  edges,
  areas,
  metrics: {
    conceptCount: nodes.length,
    connectionCount: edges.length,
    areaCount: areas.length,
  },
}

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, JSON.stringify(index) + "\n", "utf8")
console.log("Atlas graph index: " + nodes.length + " conceitos, " + edges.length + " conexões.")
