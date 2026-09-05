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
    Set,
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

function forceTasks(atlas, date, tasks) {
  const progress = Object.fromEntries(
    tasks.map((task) => [task.id, { date, count: 0, items: [], lastSlug: "" }]),
  )
  atlas.dailyTaskStorage.write(atlas.dailyTaskStorage.keys.daily, {
    version: 2,
    date,
    tasks,
  })
  atlas.dailyTaskStorage.write(atlas.dailyTaskStorage.keys.progress, {
    date,
    byTask: progress,
    completedIds: [],
  })
  atlas.dailyTaskStorage.write(atlas.dailyTaskStorage.keys.completedAt, { date: "", value: "" })
}

test("três tarefas diárias são determinísticas e permanecem iguais após refresh", async () => {
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
  assert.equal(one.daily.tasks.length, 3)
  assert.deepEqual(one.daily.tasks, two.daily.tasks)
  assert.deepEqual(one.daily.tasks, other.daily.tasks)
  assert.equal(new Set(one.daily.tasks.map((task) => task.id)).size, 3)
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
  const selected = atlas.dailyTaskEngine.selectTasks(base)
  assert.equal(selected.length, 3)
  assert.equal(new Set(selected.map((task) => task.id)).size, 3)
})

test("abertura de conceitos conclui o conjunto diário e atualiza o streak", async () => {
  const { atlas } = await createEnvironment()
  const firstDay = day("2026-09-04")
  const firstKey = atlas.dailyTaskEngine.dateKey(firstDay)
  forceTasks(atlas, firstKey, [
    { id: "test-open", kind: "open", target: 2, title: "Teste" },
    { id: "test-open-2", kind: "open", target: 2, title: "Teste 2" },
    { id: "test-open-3", kind: "open", target: 2, title: "Teste 3" },
  ])
  assert.equal(
    atlas.dailyTaskEngine.recordConceptOpened({ slug: "atlas/a", now: firstDay }).dayCompleted,
    false,
  )
  const complete = atlas.dailyTaskEngine.recordConceptOpened({ slug: "atlas/b", now: firstDay })
  assert.equal(complete.completed, true)
  assert.equal(complete.dayCompleted, true)
  assert.equal(complete.snapshot.progress.byTask["test-open"].count, 2)
  assert.equal(complete.snapshot.streak.count, 1)

  const secondDay = day("2026-09-05")
  forceTasks(atlas, atlas.dailyTaskEngine.dateKey(secondDay), [
    { id: "test-next", kind: "open", target: 1, title: "Teste seguinte" },
    { id: "test-next-2", kind: "open", target: 1 },
    { id: "test-next-3", kind: "open", target: 1 },
  ])
  const next = atlas.dailyTaskEngine.recordConceptOpened({ slug: "atlas/c", now: secondDay })
  assert.equal(next.dayCompleted, true)
  assert.equal(next.snapshot.streak.count, 2)
})

test("tarefas diferentes acompanham a mesma abertura sem bloquear umas às outras", async () => {
  const { atlas } = await createEnvironment()
  const date = day("2026-09-04")
  forceTasks(atlas, atlas.dailyTaskEngine.dateKey(date), [
    { id: "test-open", kind: "open", target: 1 },
    { id: "test-specific", kind: "specific", target: 1, targetSlug: "atlas/c" },
    { id: "test-graph", kind: "source", source: "graph", target: 1 },
  ])
  const first = atlas.dailyTaskEngine.recordConceptOpened({
    slug: "atlas/a",
    source: "graph",
    now: date,
  })
  assert.equal(first.completedTasks.length, 2)
  assert.equal(first.snapshot.completedCount, 2)
  assert.equal(first.snapshot.completed, false)
  const last = atlas.dailyTaskEngine.recordConceptOpened({ slug: "atlas/c", now: date })
  assert.equal(last.dayCompleted, true)
  assert.equal(last.snapshot.completedCount, 3)
})

test("migração conserva a tarefa antiga e acrescenta duas tarefas sem perder o progresso", async () => {
  const { atlas } = await createEnvironment()
  const date = day("2026-09-04")
  const dateKey = atlas.dailyTaskEngine.dateKey(date)
  const oldTask = { id: "legacy-task", kind: "open", target: 1, title: "Tarefa antiga" }
  atlas.dailyTaskStorage.write(atlas.dailyTaskStorage.keys.daily, { date: dateKey, task: oldTask })
  atlas.dailyTaskStorage.write(atlas.dailyTaskStorage.keys.progress, {
    date: dateKey,
    count: 1,
    items: ["atlas/a"],
    lastSlug: "atlas/a",
  })
  atlas.dailyTaskStorage.write(atlas.dailyTaskStorage.keys.completedAt, {
    date: dateKey,
    value: date.toISOString(),
  })
  const migrated = atlas.dailyTaskEngine.snapshot(date, atlas.data.concepts())
  assert.equal(migrated.daily.tasks.length, 3)
  assert.equal(migrated.daily.tasks[0].id, oldTask.id)
  assert.equal(migrated.completedCount, 1)
  assert.equal(migrated.completed, false)
})

test("fontes e relação semântica diferenciam grafo, busca e conceitos conectados", async () => {
  const { atlas } = await createEnvironment()
  const date = day("2026-09-04")
  const dateKey = atlas.dailyTaskEngine.dateKey(date)
  forceTasks(atlas, dateKey, [
    { id: "test-graph", kind: "source", source: "graph", target: 2 },
    { id: "test-search", kind: "source", source: "search", target: 5 },
    { id: "test-other", kind: "open", target: 5 },
  ])
  atlas.dailyTaskEngine.recordConceptOpened({ slug: "atlas/a", source: "graph", now: date })
  const wrongSource = atlas.dailyTaskEngine.recordConceptOpened({
    slug: "atlas/b",
    source: "search",
    now: date,
  })
  assert.equal(wrongSource.snapshot.progress.byTask["test-graph"].count, 1)
  const rightSource = atlas.dailyTaskEngine.recordConceptOpened({
    slug: "atlas/c",
    source: "graph",
    now: date,
  })
  assert.equal(rightSource.snapshot.progress.byTask["test-graph"].count, 2)

  const connectedDate = day("2026-09-06")
  forceTasks(atlas, atlas.dailyTaskEngine.dateKey(connectedDate), [
    { id: "test-connected", kind: "connected", target: 2 },
    { id: "test-connected-2", kind: "open", target: 5 },
    { id: "test-connected-3", kind: "open", target: 5 },
  ])
  atlas.dailyTaskEngine.recordConceptOpened({ slug: "atlas/a", now: connectedDate })
  const connected = atlas.dailyTaskEngine.recordConceptOpened({
    slug: "atlas/b",
    now: connectedDate,
  })
  assert.equal(connected.snapshot.progress.byTask["test-connected"].count, 2)
  assert.equal(
    connected.completedTasks.some((task) => task.id === "test-connected"),
    true,
  )
})

test("som é uma preferência local independente e pode ser desativado", async () => {
  const { atlas } = await createEnvironment()
  assert.equal(atlas.dailyTaskEngine.snapshot(day("2026-09-04"), []).soundEnabled, true)
  assert.equal(atlas.dailyTaskEngine.setSoundEnabled(false), false)
  assert.equal(atlas.dailyTaskEngine.snapshot(day("2026-09-04"), []).soundEnabled, false)
})
