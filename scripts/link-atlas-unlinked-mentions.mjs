import { readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"

const projectRoot = path.resolve(import.meta.dirname, "..")
const contentRoot = path.resolve(
  projectRoot,
  process.env.ATLAS_LINK_ROOT ?? path.join("content", "atlas"),
)
const applyChanges = process.argv.includes("--apply")

const manualAliases = new Map([
  ["Beta-oxidação.md", ["beta oxidação", "β-oxidação"]],
  ["Glicose-6-fosfato.md", ["G6P"]],
  ["VO₂máx.md", ["VO2máx", "VO2max", "VO₂max"]],
])

function fold(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/₂/g, "2")
    .replace(/₁/g, "1")
    .replace(/₃/g, "3")
    .toLowerCase()
}

function slugFor(fileName) {
  return "atlas/" + fileName.replace(/\.md$/i, "").replace(/\s+/g, "-").toLowerCase()
}

function aliasEntries(fileName) {
  const baseName = fileName.replace(/\.md$/i, "")
  const aliases = new Set([baseName, ...[...(manualAliases.get(fileName) ?? [])]])
  const parenthetical = baseName.match(/^(.+?)\s*\(([^()]+)\)$/)
  if (parenthetical) {
    aliases.add(parenthetical[1].trim())
    aliases.add(parenthetical[2].trim())
  }
  return [...aliases]
    .map((value) => ({ value, folded: fold(value) }))
    .filter(({ folded }) => folded.length >= 2)
}

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "pt-BR"))) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await filesIn(target)))
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) files.push(target)
  }
  return files
}

function foldWithMap(value) {
  let folded = ""
  const map = []
  let offset = 0
  for (const character of String(value)) {
    const normalized = character
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/₂/g, "2")
      .replace(/₁/g, "1")
      .replace(/₃/g, "3")
      .toLowerCase()
    for (const part of normalized) {
      folded += part
      map.push({ start: offset, end: offset + character.length })
    }
    offset += character.length
  }
  return { folded, map }
}

function protectedRanges(line) {
  const ranges = []
  const patterns = [/!?\[\[[^\]]+\]\]/g, /\[[^\]]+\]\([^)]*\)/g, /`[^`]*`/g, /https?:\/\/\S+/gi]
  for (const pattern of patterns) {
    for (const match of line.matchAll(pattern))
      ranges.push([match.index, match.index + match[0].length])
  }
  return ranges
}

function stripReferenceLinks(source) {
  let inReferences = false
  const chunks = source.split(/(\r?\n)/)
  return chunks
    .map((chunk) => {
      if (/^\r?\n$/.test(chunk)) return chunk
      if (/^\s*#{1,6}\s+.*refer[eê]ncias/i.test(chunk)) {
        inReferences = true
        return chunk
      }
      if (!inReferences) return chunk
      return chunk.replace(
        /!?\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g,
        (_, target, label) => label ?? target,
      )
    })
    .join("")
}

function overlaps(range, ranges) {
  return ranges.some(([start, end]) => range[0] < end && range[1] > start)
}

function linkLine(line, sourceSlug, candidates, seenTargets) {
  if (!line.trim() || /^\s*#{1,6}\s/.test(line) || /^\s*```/.test(line))
    return { line, inserted: 0 }
  const { folded, map } = foldWithMap(line)
  const ranges = protectedRanges(line)
  const matches = []
  for (const candidate of candidates) {
    let from = 0
    while (from < folded.length) {
      const start = folded.indexOf(candidate.folded, from)
      if (start < 0) break
      const end = start + candidate.folded.length
      const originalStart = map[start]?.start
      const originalEnd = map[end - 1]?.end
      if (originalStart === undefined || originalEnd === undefined) break
      const range = [originalStart, originalEnd]
      const before = folded[start - 1]
      const after = folded[end]
      const boundaryBefore = !before || !/[\p{L}\p{N}]/u.test(before)
      const boundaryAfter = !after || !/[\p{L}\p{N}]/u.test(after)
      if (
        boundaryBefore &&
        boundaryAfter &&
        !overlaps(range, ranges) &&
        candidate.slug !== sourceSlug &&
        !matches.some((match) => overlaps(range, [match.range]))
      ) {
        matches.push({ candidate, range })
      }
      from = Math.max(end, start + 1)
    }
  }

  // Keep the first mention of a destination in a paragraph; this preserves readability.
  const selected = []
  for (const match of matches.sort(
    (left, right) =>
      left.range[0] - right.range[0] ||
      right.candidate.folded.length - left.candidate.folded.length,
  )) {
    if (seenTargets.has(match.candidate.slug)) continue
    seenTargets.add(match.candidate.slug)
    selected.push(match)
  }
  selected.sort((left, right) => right.range[0] - left.range[0])
  let next = line
  for (const { candidate, range } of selected) {
    const label = line.slice(range[0], range[1])
    next = next.slice(0, range[0]) + `[[${candidate.target}|${label}]]` + next.slice(range[1])
  }
  return { line: next, inserted: selected.length }
}

function processSource(source, sourceSlug, candidates) {
  const chunks = source.split(/(\r?\n)/)
  let paragraph = 0
  let inserted = 0
  let inFence = false
  let inReferences = false
  const seenByParagraph = new Map()
  const output = chunks.map((chunk) => {
    if (/^\r?\n$/.test(chunk)) {
      return chunk
    }
    if (/^\s*```/.test(chunk)) {
      inFence = !inFence
      return chunk
    }
    if (inFence) return chunk
    if (/^\s*#{1,6}\s+.*refer[eê]ncias/i.test(chunk)) {
      inReferences = true
      return chunk
    }
    if (inReferences) return chunk
    if (!chunk.trim()) {
      paragraph += 1
      return chunk
    }
    const seenTargets = seenByParagraph.get(paragraph) ?? new Set()
    for (const match of chunk.matchAll(/!?\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]/g)) {
      seenTargets.add(slugFor(match[1].trim()))
    }
    seenByParagraph.set(paragraph, seenTargets)
    const result = linkLine(chunk, sourceSlug, candidates, seenTargets)
    inserted += result.inserted
    return result.line
  })
  return { source: output.join(""), inserted }
}

const filePaths = await filesIn(contentRoot)
const files = filePaths.map((filePath) => {
  const name = path.basename(filePath)
  return { filePath, name, slug: slugFor(name), target: name.replace(/\.md$/i, "") }
})
const candidates = files.flatMap((file) =>
  aliasEntries(file.name).map((alias) => ({ ...alias, slug: file.slug, target: file.target })),
)

const aliasesByFolded = new Map()
for (const candidate of candidates) {
  const bucket = aliasesByFolded.get(candidate.folded) ?? new Map()
  bucket.set(candidate.slug, candidate)
  aliasesByFolded.set(candidate.folded, bucket)
}
const unambiguous = [...aliasesByFolded.values()]
  .filter((bucket) => bucket.size === 1)
  .flatMap((bucket) => [...bucket.values()])
  .sort((left, right) => right.folded.length - left.folded.length)

let totalInserted = 0
let changedFiles = 0
let currentSources = new Map()
for (const file of files) {
  const source = await readFile(file.filePath, "utf8")
  const cleaned = stripReferenceLinks(source)
  currentSources.set(file.filePath, cleaned)
  if (applyChanges && cleaned !== source) await writeFile(file.filePath, cleaned, "utf8")
}

for (const pass of [1, 2]) {
  let passInserted = 0
  for (const file of files) {
    const current = currentSources.get(file.filePath)
    const result = processSource(current, file.slug, unambiguous)
    if (result.inserted > 0) {
      passInserted += result.inserted
      totalInserted += result.inserted
      if (result.source !== current) {
        changedFiles += pass === 1 ? 1 : 0
        currentSources.set(file.filePath, result.source)
        if (applyChanges) await writeFile(file.filePath, result.source, "utf8")
      }
    }
  }
  console.log(`Passagem ${pass}: ${passInserted} menções vinculadas.`)
}

console.log(`Notas auditadas: ${files.length}`)
console.log(`Arquivos alterados: ${changedFiles}`)
console.log(`Links internos inseridos: ${totalInserted}`)
if (!applyChanges) console.log("Simulação concluída. Use --apply para gravar as inserções.")
