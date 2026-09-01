#!/usr/bin/env node

import { createHash } from "node:crypto"
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const DEFAULT_DESTINATION = "content/atlas"
const DEFAULT_MANIFEST = "docs/vault-sync-manifest.json"
const DEFAULT_VAULT_PATH = path.join(
  process.env.USERPROFILE ?? "",
  "Documents",
  "Obsidian Vault",
  "Nutriwork",
)
const EXCLUDED_DIRECTORY_NAMES = new Set([
  ".git",
  ".obsidian",
  ".smart-env",
  "backups",
  "drafts",
  "private",
  "templates",
])
const EXCLUDED_FILE_PATTERN = /(?:^|[-_.])(backup|c[oó]pia|draft|rascunho)(?:[-_.]|$)/iu

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === "--check") args.check = true
    else if (value === "--dry-run") args.dryRun = true
    else if (value === "--source") args.source = argv[++index]
    else if (value === "--destination") args.destination = argv[++index]
    else if (value === "--manifest") args.manifest = argv[++index]
    else if (value === "--help" || value === "-h") args.help = true
    else throw new Error(`Argumento desconhecido: ${value}`)
  }
  return args
}

function printHelp() {
  console.log(`Uso: node scripts/sync-vault.mjs [opções]

Opções:
  --source <path>       Vault de origem (ou ATLAS_VAULT_PATH)
  --destination <path>  Pasta de conteúdo (padrão: content/atlas)
  --manifest <path>     Manifesto de hashes (padrão: docs/vault-sync-manifest.json)
  --check               Apenas verifica hashes e não copia arquivos
  --dry-run             Mostra o que seria sincronizado
`)
}

async function sha256(filePath) {
  const content = await readFile(filePath)
  return createHash("sha256").update(content).digest("hex")
}

async function collectMarkdown(rootPath) {
  const entries = []

  async function visit(directory, relativeDirectory = "") {
    const children = await readdir(directory, { withFileTypes: true })
    children.sort((left, right) => left.name.localeCompare(right.name, "pt-BR"))

    for (const child of children) {
      const relativePath = path.join(relativeDirectory, child.name)
      if (child.isDirectory()) {
        if (!EXCLUDED_DIRECTORY_NAMES.has(child.name) && !child.name.startsWith(".")) {
          await visit(path.join(directory, child.name), relativePath)
        }
        continue
      }

      if (!child.isFile() || !child.name.toLowerCase().endsWith(".md")) continue
      if (EXCLUDED_FILE_PATTERN.test(child.name)) continue
      entries.push({
        source: relativePath.split(path.sep).join("/"),
        absoluteSource: path.join(directory, child.name),
      })
    }
  }

  await visit(rootPath)
  return entries
}

function resolveInside(rootPath, relativePath) {
  const root = path.resolve(rootPath)
  const target = path.resolve(root, relativePath)
  const relative = path.relative(root, target)
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Caminho fora da pasta gerenciada: ${relativePath}`)
  }
  return target
}

async function readManifest(manifestPath) {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"))
  } catch (error) {
    if (error?.code === "ENOENT") return null
    throw error
  }
}

async function removeManagedStaleFiles(destinationRoot, previousManifest, nextSources) {
  const next = new Set(nextSources)
  for (const previous of previousManifest?.files ?? []) {
    if (next.has(previous.destination)) continue
    if (typeof previous.destination !== "string" || !previous.destination.endsWith(".md")) continue
    const stalePath = resolveInside(destinationRoot, previous.destination)
    await rm(stalePath, { force: true })
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const projectRoot = path.resolve(import.meta.dirname, "..")
  const sourceRoot = path.resolve(args.source ?? process.env.ATLAS_VAULT_PATH ?? DEFAULT_VAULT_PATH)
  const destinationRoot = path.resolve(projectRoot, args.destination ?? DEFAULT_DESTINATION)
  const manifestPath = path.resolve(projectRoot, args.manifest ?? DEFAULT_MANIFEST)

  const sourceStats = await stat(sourceRoot).catch(() => null)
  if (!sourceStats?.isDirectory()) {
    throw new Error(
      `Vault não encontrado em ${sourceRoot}. Informe --source ou ATLAS_VAULT_PATH; nenhum arquivo foi alterado.`,
    )
  }

  const sourceFiles = await collectMarkdown(sourceRoot)
  const files = []
  for (const sourceFile of sourceFiles) {
    const destination = sourceFile.source
    const sourceHash = await sha256(sourceFile.absoluteSource)
    files.push({
      source: sourceFile.source,
      destination,
      absoluteSource: sourceFile.absoluteSource,
      bytes: (await stat(sourceFile.absoluteSource)).size,
      sha256: sourceHash,
    })
  }

  const previousManifest = await readManifest(manifestPath)
  const destinationFiles = new Set()
  for (const file of files) {
    const targetPath = resolveInside(destinationRoot, file.destination)
    destinationFiles.add(file.destination)
    if (args.check) {
      const targetStats = await stat(targetPath).catch(() => null)
      const targetHash = targetStats?.isFile() ? await sha256(targetPath) : null
      if (targetHash !== file.sha256 || targetStats?.size !== file.bytes) {
        throw new Error(`Divergência no conteúdo sincronizado: ${file.destination}`)
      }
      continue
    }
    if (!args.dryRun) {
      await mkdir(path.dirname(targetPath), { recursive: true })
      await copyFile(file.absoluteSource, targetPath)
    }
  }

  if (args.check) {
    const previousFiles = previousManifest?.files ?? []
    if (previousFiles.length !== files.length) {
      throw new Error(
        `Quantidade divergente: manifesto=${previousFiles.length}, origem=${files.length}`,
      )
    }
    console.log(`OK: ${files.length} arquivos Markdown conferidos por SHA-256.`)
    return
  }

  if (!args.dryRun) {
    await removeManagedStaleFiles(destinationRoot, previousManifest, destinationFiles)
    await mkdir(path.dirname(manifestPath), { recursive: true })
    const manifestFiles = files.map(({ absoluteSource: _absoluteSource, ...file }) => file)
    await writeFile(
      manifestPath,
      `${JSON.stringify(
        {
          version: 1,
          sourceRoot: "<ATLAS_VAULT_PATH>",
          destinationRoot: args.destination ?? DEFAULT_DESTINATION,
          files: manifestFiles,
        },
        null,
        2,
      )}\n`,
      "utf8",
    )
  }

  console.log(
    `${args.dryRun ? "DRY RUN" : "Sincronizados"}: ${files.length} arquivos Markdown de ${sourceRoot} para ${destinationRoot}.`,
  )
}

main().catch((error) => {
  console.error(`Erro: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
