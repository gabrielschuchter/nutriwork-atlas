#!/usr/bin/env node

import { copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises"
import path from "node:path"

const projectRoot = path.resolve(import.meta.dirname, "..")
const sourcePath = path.join(projectRoot, "quartz", "static", "robots.txt")
const targetPath = path.join(projectRoot, "public", "robots.txt")
const securitySourcePath = path.join(projectRoot, "quartz", "static", ".well-known", "security.txt")
const securityTargetPath = path.join(projectRoot, "public", ".well-known", "security.txt")

const sourceStats = await stat(sourcePath).catch(() => null)
if (!sourceStats?.isFile()) {
  throw new Error(`Static root asset source not found: ${sourcePath}`)
}

const publicStats = await stat(path.dirname(targetPath)).catch(() => null)
if (!publicStats?.isDirectory()) {
  throw new Error(`Quartz output directory not found: ${path.dirname(targetPath)}`)
}

await copyFile(sourcePath, targetPath)
console.log(
  `Copied ${path.relative(projectRoot, sourcePath)} to ${path.relative(projectRoot, targetPath)}`,
)

await mkdir(path.dirname(securityTargetPath), { recursive: true })
await copyFile(securitySourcePath, securityTargetPath).catch(async (error) => {
  if (error.code !== "ENOENT") throw error
  throw new Error(`Static security.txt source not found: ${securitySourcePath}`)
})
console.log(
  `Copied ${path.relative(projectRoot, securitySourcePath)} to ${path.relative(projectRoot, securityTargetPath)}`,
)

async function sanitizePublicLabels(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  let changedFiles = 0

  for (const entry of entries) {
    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      changedFiles += await sanitizePublicLabels(filePath)
      continue
    }
    if (!entry.isFile() || path.extname(entry.name) !== ".html") continue

    const source = await readFile(filePath, "utf8")
    const sanitized = source
      .replaceAll("<title>Search</title>", "<title>Pesquisar</title>")
      .replaceAll('aria-label="Global Graph"', 'aria-label="Abrir grafo global"')
    if (sanitized === source) continue

    await writeFile(filePath, sanitized, "utf8")
    changedFiles += 1
  }

  return changedFiles
}

const changedFiles = await sanitizePublicLabels(path.dirname(targetPath))
console.log(`Sanitized public labels in ${changedFiles} HTML file(s)`)
