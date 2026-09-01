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
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!?\[\[([^\]]+)\]\]/g, " ")
    .replace(/\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label ?? target)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_>#~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function cleanHeading(value) {
  return cleanText(String(value ?? ""))
    .replace(/\s+/g, " ")
    .trim()
}

function extractSections(body) {
  const sections = []
  const headingPattern = /^#{2,6}\s+(.+)$/gm
  const headings = [...body.matchAll(headingPattern)]
  headings.forEach((heading, index) => {
    const start = heading.index + heading[0].length
    const end = headings[index + 1]?.index ?? body.length
    const title = cleanHeading(heading[1])
    const content = cleanText(body.slice(start, end))
    if (title) sections.push({ title, text: content })
  })
  return sections
}

function excerptAround(source, index, length = 240) {
  const lineStart = source.lastIndexOf("\n", index) + 1
  const lineEnd = source.indexOf("\n", index)
  const start = Math.max(0, lineStart - 180)
  const end = Math.min(source.length, lineEnd < 0 ? source.length : lineEnd + 180)
  const line = cleanText(source.slice(start, end))
  if (line.length <= length) return line
  return `${line.slice(0, length - 1).trimEnd()}…`
}

function targetToSlug(target) {
  const cleaned = String(target ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/\.md$/i, "")
  if (!cleaned || cleaned.startsWith("#") || cleaned.startsWith("http")) return ""
  const candidate = cleaned.includes("/") ? cleaned : `atlas/${cleaned}`
  return normalizeSlug(candidate)
}

function extractLinks(body) {
  const links = []
  const pattern = /!?\[\[([^\]]+)\]\]/g
  let match
  while ((match = pattern.exec(body)) !== null) {
    const raw = match[1].trim()
    const [targetWithHeading, label] = raw.split("|")
    const target = targetWithHeading.split("#")[0].trim()
    const slug = targetToSlug(target)
    if (!slug) continue
    links.push({
      slug,
      target: target || slug,
      label: (label ?? target).trim(),
      context: excerptAround(body, match.index),
    })
  }
  return links
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

function buildComponents(nodes, adjacency) {
  const components = []
  const seen = new Set()
  for (const node of nodes) {
    if (seen.has(node.slug)) continue
    const queue = [node.slug]
    const members = []
    seen.add(node.slug)
    while (queue.length) {
      const slug = queue.shift()
      members.push(slug)
      for (const neighbor of adjacency.get(slug) ?? []) {
        if (seen.has(neighbor)) continue
        seen.add(neighbor)
        queue.push(neighbor)
      }
    }
    components.push(members.sort((left, right) => left.localeCompare(right, "pt-BR")))
  }
  return components.sort(
    (left, right) => right.length - left.length || left[0].localeCompare(right[0]),
  )
}

function findArticulationPoints(nodes, adjacency) {
  const discovery = new Map()
  const low = new Map()
  const parents = new Map()
  const articulation = new Set()
  let time = 0

  function visit(slug) {
    discovery.set(slug, ++time)
    low.set(slug, discovery.get(slug))
    let children = 0
    for (const neighbor of adjacency.get(slug) ?? []) {
      if (!discovery.has(neighbor)) {
        parents.set(neighbor, slug)
        children += 1
        visit(neighbor)
        low.set(slug, Math.min(low.get(slug), low.get(neighbor)))
        const parent = parents.get(slug)
        if (parent === undefined && children > 1) articulation.add(slug)
        if (parent !== undefined && low.get(neighbor) >= discovery.get(slug)) articulation.add(slug)
      } else if (neighbor !== parents.get(slug)) {
        low.set(slug, Math.min(low.get(slug), discovery.get(neighbor)))
      }
    }
  }

  for (const node of nodes) if (!discovery.has(node.slug)) visit(node.slug)
  return articulation
}

function relationData(node, nodesBySlug, adjacency, outgoing, incoming) {
  const direct = new Map()
  for (const neighbor of [...(outgoing.get(node.slug) ?? []), ...(incoming.get(node.slug) ?? [])]) {
    direct.set(neighbor, (direct.get(neighbor) ?? 0) + 2)
  }
  const neighbors = new Set(direct.keys())
  for (const neighbor of neighbors) {
    for (const second of adjacency.get(neighbor) ?? []) {
      if (second === node.slug || neighbors.has(second)) continue
      direct.set(second, (direct.get(second) ?? 0) + 1)
    }
  }
  return [...direct.entries()]
    .map(([slug, score]) => ({
      slug,
      title: nodesBySlug.get(slug)?.title ?? slug,
      score,
      direct: neighbors.has(slug),
      basis: neighbors.has(slug) ? "link direto" : "vizinhança em comum",
    }))
    .sort(
      (left, right) => right.score - left.score || left.title.localeCompare(right.title, "pt-BR"),
    )
    .slice(0, 12)
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
    const slug = normalizeSlug(`atlas/${baseName}`)
    const bodyText = cleanText(parsed.body)
    const frontmatterDate = parsed.frontmatter.modified ?? parsed.frontmatter.date
    return {
      slug,
      title,
      area: classifyArea(title, areaConfig),
      description:
        typeof parsed.frontmatter.description === "string"
          ? parsed.frontmatter.description
          : bodyText.slice(0, 220),
      excerpt: bodyText.slice(0, 280),
      text: bodyText,
      sections: extractSections(parsed.body),
      links: extractLinks(parsed.body),
      // Git metadata is unavailable in some deployment builds. Keep this
      // derived index byte-stable across local and remote environments.
      updatedAt: frontmatterDate ? String(frontmatterDate) : null,
    }
  }),
)

documents.sort((left, right) => left.title.localeCompare(right.title, "pt-BR"))
const nodesBySlug = new Map(documents.map((document) => [document.slug, document]))
const outgoing = new Map(documents.map((document) => [document.slug, new Set()]))
const incoming = new Map(documents.map((document) => [document.slug, new Set()]))
const edgeOccurrences = new Map()
const gapOccurrences = new Map()

for (const document of documents) {
  for (const link of document.links) {
    if (nodesBySlug.has(link.slug)) {
      outgoing.get(document.slug).add(link.slug)
      incoming.get(link.slug).add(document.slug)
      const key = `${document.slug}|${link.slug}`
      const occurrences = edgeOccurrences.get(key) ?? []
      occurrences.push({ label: link.label, context: link.context })
      edgeOccurrences.set(key, occurrences)
    } else {
      const gap = gapOccurrences.get(link.slug) ?? {
        slug: link.slug,
        title: link.label || link.target,
        occurrences: 0,
        sources: new Map(),
      }
      gap.occurrences += 1
      const sourceOccurrences = gap.sources.get(document.slug) ?? []
      sourceOccurrences.push(link.context)
      gap.sources.set(document.slug, sourceOccurrences)
      gapOccurrences.set(link.slug, gap)
    }
  }
}

const adjacency = new Map(documents.map((document) => [document.slug, new Set()]))
for (const [key] of edgeOccurrences) {
  const [source, target] = key.split("|")
  adjacency.get(source).add(target)
  adjacency.get(target).add(source)
}

const components = buildComponents(documents, adjacency)
const articulationPoints = findArticulationPoints(documents, adjacency)
const nodes = documents.map((document) => {
  const outgoingSlugs = [...outgoing.get(document.slug)].sort()
  const incomingSlugs = [...incoming.get(document.slug)].sort()
  const degree = unique([...outgoingSlugs, ...incomingSlugs]).length
  return {
    slug: document.slug,
    title: document.title,
    area: document.area,
    areaLabel: areaLabel(document.area, areaConfig),
    description: document.description,
    excerpt: document.excerpt,
    text: document.text,
    sections: document.sections,
    updatedAt: document.updatedAt,
    outgoing: outgoingSlugs,
    incoming: incomingSlugs,
    outgoingCount: outgoingSlugs.length,
    incomingCount: incomingSlugs.length,
    degree,
    component: components.findIndex((component) => component.includes(document.slug)) + 1,
    bridge: articulationPoints.has(document.slug),
    related: relationData(document, nodesBySlug, adjacency, outgoing, incoming),
  }
})

const edges = [...edgeOccurrences.entries()]
  .map(([key, occurrences]) => {
    const [source, target] = key.split("|")
    return { source, target, occurrences: occurrences.length, contexts: occurrences.slice(0, 5) }
  })
  .sort((left, right) =>
    `${left.source}|${left.target}`.localeCompare(`${right.source}|${right.target}`),
  )

const gaps = [...gapOccurrences.values()]
  .map((gap) => ({
    slug: gap.slug,
    title: gap.title,
    occurrences: gap.occurrences,
    sources: [...gap.sources.entries()]
      .map(([slug, contexts]) => ({
        slug,
        title: nodesBySlug.get(slug)?.title ?? slug,
        area: nodesBySlug.get(slug)?.area ?? areaConfig.defaultArea,
        areaLabel: nodesBySlug.get(slug)?.area
          ? areaLabel(nodesBySlug.get(slug).area, areaConfig)
          : "Fundamentos da nutrição",
        occurrences: contexts.length,
        contexts: contexts.slice(0, 3),
      }))
      .sort(
        (left, right) =>
          right.occurrences - left.occurrences || left.title.localeCompare(right.title, "pt-BR"),
      ),
    sourceCount: gap.sources.size,
  }))
  .sort(
    (left, right) =>
      right.occurrences - left.occurrences || left.title.localeCompare(right.title, "pt-BR"),
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

const byDegree = [...nodes].sort(
  (left, right) => right.degree - left.degree || left.title.localeCompare(right.title, "pt-BR"),
)
const hubs = byDegree.slice(0, 12)
const isolated = nodes.filter((node) => node.degree === 0)
const peripheral = nodes.filter((node) => node.degree <= 1)
const oneConnection = nodes.filter((node) => node.degree === 1)
const index = {
  version: 1,
  concepts: nodes,
  edges,
  gaps,
  areas,
  hubs,
  components,
  bridgeNodes: nodes
    .filter((node) => node.bridge)
    .sort((left, right) => right.degree - left.degree),
  metrics: {
    conceptCount: nodes.length,
    connectionCount: edges.length,
    linkOccurrenceCount: edges.reduce((sum, edge) => sum + edge.occurrences, 0),
    unresolvedTargetCount: gaps.length,
    unresolvedOccurrenceCount: gaps.reduce((sum, gap) => sum + gap.occurrences, 0),
    areaCount: areas.length,
    componentCount: components.length,
    isolatedCount: isolated.length,
    peripheralCount: peripheral.length,
    oneConnectionCount: oneConnection.length,
    bridgeCount: articulationPoints.size,
  },
}

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(index)}\n`, "utf8")
console.log(
  `Atlas index: ${nodes.length} conceitos, ${edges.length} conexões, ${gaps.length} lacunas, ${components.length} componentes.`,
)
