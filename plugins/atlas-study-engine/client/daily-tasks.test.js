import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"
import vm from "node:vm"

const moduleFiles = [
  "daily-tasks/tasks.js",
  "daily-tasks/task-storage.js",
  "daily-tasks/task-progress.js",
  "daily-tasks/task-engine.js",
]

async function createEnvironment() {
  const values = new Map()
  const localStorage = {
    getItem(key) {
      return values.has(key) ? values.get(key) : null
    },
    setItem(key, value) {
      values.set(key, String(value))
    },
    removeItem(key) {
      values.delete(key)
    },
  }
  const context = vm.createContext({
    Array,
    Boolean,
    Date,
    JSON,
    Math,
    Number,
    Object,
    String,
    console,
    crypto: { randomUUID: () => "installation-generated" },
    window: { localStorage },
  })
  context.globalThis = context
  const base = new URL("./", import.meta.url)
  for (const file of moduleFiles) {
    const source = await readFile(new URL(file, base), "utf8")
    vm.runInContext(source, context, { filename: file })
  }
  const atlas = context.window.__nutriworkAtlasEngine
  const concepts = [
    { slug: "atlas/a", title: "A", outgoing: ["atlas/b"] },
    { slug: "atlas/b", title: "B", incoming: ["atlas/a"], outgoing: ["atlas/c"] },
    { slug: "atlas/c", title: "C", incoming: ["atlas/b"] },
  ]
  atlas.data = {
    concepts: () => concepts,
    get: (slug) => concepts.find((concept) => concept.slug === slug) || null,
  }
  return { atlas, values }
}

function day(value) {
  return new Date(`${value}T12:00:00`)
}

function forceTask(atlas, date, task) {
  atlas.dailyTaskStorage.write(atlas.dailyTaskStorage.keys.daily, { date, task })
  atlas.dailyTaskStorage.write(atlas.dailyTaskStorage.keys.progress, {
    date,
    count: 0,
    items: [],
    lastSlug: "",
  })
  atlas.dailyTaskStorage.write(atlas.dailyTaskStorage.keys.completedAt, { date: "", value: "" })
}

test("tarefa diária é determinística e permanece igual após refresh", async () => {
  const first = await createEnvironment()
  const second = await createEnvironment()
  first.atlas.dailyTaskStorage.write(first.atlas.dailyTaskStorage.keys.installation, "same-install")
  second.atlas.dailyTaskStorage.write(
    second.atlas.dailyTaskStorage.keys.installation,
    "same-install",
  )
  const date = day("2026-09-04")
  const one = first.atlas.dailyTaskEngine.ensureDay(date, first.atlas.data.concepts())
  const two = first.atlas.dailyTaskEngine.ensureDay(date, first.atlas.data.concepts())
  const other = second.atlas.dailyTaskEngine.ensureDay(date, second.atlas.data.concepts())
  assert.deepEqual(one.daily.task, two.daily.task)
  assert.deepEqual(one.daily.task, other.daily.task)
})

test("biblioteca contém 50 tarefas únicas e a sequência aumenta o desafio gradualmente", async () => {
  const { atlas } = await createEnvironment()
  assert.equal(atlas.dailyTaskTemplates.length, 50)
  assert.equal(new Set(atlas.dailyTaskTemplates.map((task) => task.id)).size, 50)

  const base = {
    date: "2026-09-04",
    installationId: "same-install",
    visited: {},
    history: [],
    concepts: [],
  }
  assert.ok(atlas.dailyTaskEngine.selectTask({ ...base, streak: 0 }).target <= 2)
  assert.ok(atlas.dailyTaskEngine.selectTask({ ...base, streak: 3 }).target >= 2)
  assert.ok(atlas.dailyTaskEngine.selectTask({ ...base, streak: 30 }).target >= 5)
})

test("abertura de conceitos conclui automaticamente e atualiza o streak", async () => {
  const { atlas } = await createEnvironment()
  const firstDay = day("2026-09-04")
  const firstKey = atlas.dailyTaskEngine.dateKey(firstDay)
  forceTask(atlas, firstKey, { id: "test-open", kind: "open", target: 2, title: "Teste" })
  assert.equal(
    atlas.dailyTaskEngine.recordConceptOpened({ slug: "atlas/a", now: firstDay }).completed,
    false,
  )
  const complete = atlas.dailyTaskEngine.recordConceptOpened({ slug: "atlas/b", now: firstDay })
  assert.equal(complete.completed, true)
  assert.equal(complete.snapshot.progress.count, 2)
  assert.equal(complete.snapshot.streak.count, 1)

  const secondDay = day("2026-09-05")
  forceTask(atlas, atlas.dailyTaskEngine.dateKey(secondDay), {
    id: "test-next",
    kind: "open",
    target: 1,
    title: "Teste seguinte",
  })
  const next = atlas.dailyTaskEngine.recordConceptOpened({ slug: "atlas/c", now: secondDay })
  assert.equal(next.completed, true)
  assert.equal(next.snapshot.streak.count, 2)
})

test("fontes e relação semântica diferenciam grafo, busca e conceitos conectados", async () => {
  const { atlas } = await createEnvironment()
  const date = day("2026-09-04")
  const dateKey = atlas.dailyTaskEngine.dateKey(date)
  forceTask(atlas, dateKey, { id: "test-graph", kind: "source", source: "graph", target: 2 })
  atlas.dailyTaskEngine.recordConceptOpened({ slug: "atlas/a", source: "graph", now: date })
  const wrongSource = atlas.dailyTaskEngine.recordConceptOpened({
    slug: "atlas/b",
    source: "search",
    now: date,
  })
  assert.equal(wrongSource.snapshot.progress.count, 1)
  const rightSource = atlas.dailyTaskEngine.recordConceptOpened({
    slug: "atlas/c",
    source: "graph",
    now: date,
  })
  assert.equal(rightSource.completed, true)

  const connectedDate = day("2026-09-06")
  forceTask(atlas, atlas.dailyTaskEngine.dateKey(connectedDate), {
    id: "test-connected",
    kind: "connected",
    target: 2,
  })
  atlas.dailyTaskEngine.recordConceptOpened({ slug: "atlas/a", now: connectedDate })
  const connected = atlas.dailyTaskEngine.recordConceptOpened({
    slug: "atlas/b",
    now: connectedDate,
  })
  assert.equal(connected.snapshot.progress.count, 2)
  assert.equal(connected.completed, true)
})

test("som é uma preferência local independente e pode ser desativado", async () => {
  const { atlas } = await createEnvironment()
  assert.equal(atlas.dailyTaskEngine.snapshot(day("2026-09-04"), []).soundEnabled, true)
  assert.equal(atlas.dailyTaskEngine.setSoundEnabled(false), false)
  assert.equal(atlas.dailyTaskEngine.snapshot(day("2026-09-04"), []).soundEnabled, false)
})
