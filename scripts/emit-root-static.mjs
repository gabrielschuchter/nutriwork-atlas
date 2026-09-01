#!/usr/bin/env node

import { copyFile, stat } from "node:fs/promises"
import path from "node:path"

const projectRoot = path.resolve(import.meta.dirname, "..")
const sourcePath = path.join(projectRoot, "quartz", "static", "robots.txt")
const targetPath = path.join(projectRoot, "public", "robots.txt")

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
