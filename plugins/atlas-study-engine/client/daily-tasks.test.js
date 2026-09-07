import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"
import vm from "node:vm"

const moduleFiles = [
  "daily-tasks/activity-tracker.js",
  "daily-tasks/tasks.js",
  "daily-tasks/task-storage.js",
  "daily-tasks/task-progress.js",
  "daily-tasks/task-engine.js",
]

async function createEnvironment(values = new Map()) {
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
    Map,
    Math,
    Number,
    Object,
    Set,
    String,
    console,
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

function day(value, hour = 12) {
  return new Date(`${value}T${String(hour).padStart(2, "0")}:00:00`)
}

function task(atlas, id) {
  return atlas.dailyTaskTemplates.find((item) => item.id === id)
}

function forceTasks(atlas, date, ids) {
  const state = atlas.dailyTaskStorage.snapshot()
  state.days[date] = {
    version: atlas.dailyTaskEngine.definitionVersion,
    date,
    taskIds: ids,
    completedAtByTask: {},
    completedAt: "",
  }
  atlas.dailyTaskStorage.save(state)
}

function progress(atlas, snapshot, id) {
  return snapshot.progress.byTask[id]
}

test("a nova biblioteca tem dez tarefas declarativas e três grupos distintos", async () => {
  const { atlas } = await createEnvironment()
  assert.equal(atlas.dailyTaskTemplates.length, 10)
  assert.equal(new Set(atlas.dailyTaskTemplates.map((task) => task.id)).size, 10)
  assert.ok(atlas.dailyTaskTemplates.every((task) => task.family && task.metric && task.target))
  assert.ok(atlas.dailyTaskTemplates.every((task) => task.description.length > 0))
  assert.deepEqual(
    new Set(atlas.dailyTaskTemplates.map((task) => task.selectionGroup)),
    new Set(["exploration", "discovery", "map"]),
  )
})

test("as três tarefas do dia são determinísticas e não repetem grupo", async () => {
  const first = await createEnvironment()
  const second = await createEnvironment()
  const date = day("2026-09-06")
  const one = first.atlas.dailyTaskEngine.ensureDay(date)
  const two = first.atlas.dailyTaskEngine.ensureDay(date)
  const other = second.atlas.dailyTaskEngine.ensureDay(date)
  assert.equal(one.days["2026-09-06"].taskIds.length, 3)
  assert.deepEqual(one.days["2026-09-06"].taskIds, two.days["2026-09-06"].taskIds)
  assert.deepEqual(
    Array.from(one.days["2026-09-06"].taskIds),
    Array.from(other.days["2026-09-06"].taskIds),
  )
  const selected = one.days["2026-09-06"].taskIds.map((id) => task(first.atlas, id))
  assert.equal(new Set(selected.map((item) => item.selectionGroup)).size, 3)
  assert.equal(new Set(selected.map((item) => item.family)).size, 3)
})

test("conceitos únicos não contam o mesmo slug duas vezes", async () => {
  const { atlas } = await createEnvironment()
  const date = day("2026-09-06")
  forceTasks(atlas, atlas.dailyTaskEngine.dateKey(date), [
    "unique-concepts-two",
    "graph-pan-one",
    "graph-zoom-one",
  ])
  const first = atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/a", source: "direct" },
    date,
  )
  assert.equal(progress(atlas, first.snapshot, "unique-concepts-two").count, 1)
  const repeated = atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/a", source: "direct" },
    date,
  )
  assert.equal(progress(atlas, repeated.snapshot, "unique-concepts-two").count, 1)
  const complete = atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/b", source: "direct" },
    date,
  )
  assert.equal(progress(atlas, complete.snapshot, "unique-concepts-two").count, 2)
  assert.ok(complete.completedTasks.some((item) => item.id === "unique-concepts-two"))
})

test("abrir busca ou digitar não conclui busca; abrir resultado conclui", async () => {
  const { atlas } = await createEnvironment()
  const date = day("2026-09-06")
  forceTasks(atlas, atlas.dailyTaskEngine.dateKey(date), [
    "search-open-one",
    "graph-pan-one",
    "graph-zoom-one",
  ])
  const opened = atlas.dailyTaskEngine.snapshot(date)
  const ignored = atlas.dailyTaskEngine.recordActivity(
    "search_performed",
    { query: "vitamina" },
    date,
  )
  assert.equal(ignored.changed, false)
  assert.equal(progress(atlas, opened, "search-open-one").count, 0)
  assert.doesNotMatch(JSON.stringify(atlas.activityTracker.snapshot()), /vitamina/)
  const result = atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/a", source: "search" },
    date,
  )
  assert.equal(progress(atlas, result.snapshot, "search-open-one").count, 1)
})

test("filtro só progride ao abrir conceito com área selecionada", async () => {
  const { atlas } = await createEnvironment()
  const date = day("2026-09-06")
  forceTasks(atlas, atlas.dailyTaskEngine.dateKey(date), [
    "filtered-concept-one",
    "graph-open-one",
    "graph-zoom-one",
  ])
  let result = atlas.dailyTaskEngine.recordActivity(
    "area_filter_changed",
    { area: "esportiva", previousArea: "all" },
    date,
  )
  assert.equal(result.snapshot.activity.areaFilterChanges, 1)
  assert.equal(progress(atlas, result.snapshot, "filtered-concept-one").count, 0)
  result = atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/a", source: "direct", area: "esportiva" },
    date,
  )
  assert.equal(progress(atlas, result.snapshot, "filtered-concept-one").count, 1)
})

test("fontes de abertura distinguem link interno, lista e abertura direta", async () => {
  const { atlas } = await createEnvironment()
  const date = day("2026-09-06")
  forceTasks(atlas, atlas.dailyTaskEngine.dateKey(date), [
    "internal-link-one",
    "concept-list-one",
    "graph-open-one",
  ])
  let result = atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/a", source: "direct" },
    date,
  )
  assert.equal(result.snapshot.progress.completedIds.length, 0)
  result = atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/b", source: "internal_link" },
    date,
  )
  assert.ok(result.completedTasks.some((item) => item.id === "internal-link-one"))
  result = atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/c", source: "concept_list" },
    date,
  )
  assert.ok(result.completedTasks.some((item) => item.id === "concept-list-one"))
  assert.equal(progress(atlas, result.snapshot, "graph-open-one").count, 0)
})

test("atividades e tarefas sobrevivem a reload", async () => {
  const values = new Map()
  const first = await createEnvironment(values)
  const date = day("2026-09-06")
  forceTasks(first.atlas, first.atlas.dailyTaskEngine.dateKey(date), [
    "graph-open-one",
    "search-open-one",
    "concept-list-one",
  ])
  first.atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/a", source: "graph" },
    date,
  )
  const second = await createEnvironment(values)
  const snapshot = second.atlas.dailyTaskEngine.snapshot(date)
  assert.equal(snapshot.activity.graphConcepts.length, 1)
  assert.deepEqual(
    Array.from(snapshot.daily.taskIds),
    Array.from(first.atlas.dailyTaskEngine.snapshot(date).daily.taskIds),
  )
  assert.equal(snapshot.progress.byTask["graph-open-one"]?.count || 0, 1)
})

test("conclusão individual e streak são idempotentes", async () => {
  const { atlas } = await createEnvironment()
  const firstDay = day("2026-09-06")
  forceTasks(atlas, atlas.dailyTaskEngine.dateKey(firstDay), [
    "graph-open-one",
    "search-open-one",
    "concept-list-one",
  ])
  atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/a", source: "graph" },
    firstDay,
  )
  atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/b", source: "search" },
    firstDay,
  )
  const complete = atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/c", source: "concept_list" },
    firstDay,
  )
  const completedAt = complete.snapshot.completedAt
  assert.equal(complete.snapshot.completed, true)
  assert.equal(complete.snapshot.streak.count, 1)
  const repeated = atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/c", source: "concept_list" },
    firstDay,
  )
  assert.equal(repeated.completedTasks.length, 0)
  assert.equal(repeated.snapshot.completedAt, completedAt)
  assert.equal(repeated.snapshot.streak.count, 1)

  const secondDay = day("2026-09-07")
  forceTasks(atlas, atlas.dailyTaskEngine.dateKey(secondDay), [
    "graph-open-one",
    "search-open-one",
    "concept-list-one",
  ])
  atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/a", source: "graph" },
    secondDay,
  )
  atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/b", source: "search" },
    secondDay,
  )
  const next = atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/c", source: "concept_list" },
    secondDay,
  )
  assert.equal(next.snapshot.streak.count, 2)
  assert.deepEqual(
    Array.from(
      next.snapshot.history.find((entry) => entry.date === "2026-09-07")?.completedTaskIds || [],
    ),
    ["graph-open-one", "search-open-one", "concept-list-one"],
  )
})

test("novo dia cria atividade nova e preserva histórico recente", async () => {
  const { atlas } = await createEnvironment()
  const first = day("2026-09-06")
  const second = day("2026-09-07")
  const firstSnapshot = atlas.dailyTaskEngine.snapshot(first)
  const secondSnapshot = atlas.dailyTaskEngine.snapshot(second)
  assert.equal(secondSnapshot.activity.date, "2026-09-07")
  assert.equal(secondSnapshot.activity.conceptsOpened, 0)
  assert.ok(secondSnapshot.history.some((entry) => entry.date === "2026-09-06"))
  assert.equal(firstSnapshot.daily.date, "2026-09-06")
  assert.equal(secondSnapshot.daily.taskIds.length, 3)
})

test("storage corrompido reinicia apenas as camadas de atividade e tarefas", async () => {
  const values = new Map([
    ["atlas_activity_v1", "{not-json"],
    ["atlas_daily_tasks_v2", JSON.stringify({ version: 999, days: { broken: true } })],
  ])
  const { atlas } = await createEnvironment(values)
  assert.doesNotThrow(() => atlas.dailyTaskEngine.snapshot(day("2026-09-06")))
  assert.equal(atlas.activityTracker.snapshot().version, 1)
  assert.equal(atlas.dailyTaskStorage.snapshot().version, 2)
})

test("timestamps corrompidos não fabricam conclusão nem streak", async () => {
  const date = "2026-09-06"
  const values = new Map([
    [
      "atlas_daily_tasks_v2",
      JSON.stringify({
        version: 2,
        days: {
          [date]: {
            version: 1,
            date,
            taskIds: ["graph-open-one", "search-open-one", "concept-list-one"],
            completedAtByTask: { "graph-open-one": "not-a-date" },
            completedAt: "also-not-a-date",
          },
        },
        streak: { count: 9, lastCompletedDate: date },
      }),
    ],
  ])
  const { atlas } = await createEnvironment(values)
  const snapshot = atlas.dailyTaskEngine.snapshot(day(date))
  assert.deepEqual(Array.from(snapshot.progress.completedIds), [])
  assert.equal(snapshot.completedAt, "")
  assert.equal(snapshot.streak.visibleCount, 0)
  assert.deepEqual(
    Object.entries(atlas.dailyTaskStorage.snapshot().days[date].completedAtByTask),
    [],
  )
})

test("preferência de som fica no estado local e não depende do progresso", async () => {
  const { atlas } = await createEnvironment()
  const date = day("2026-09-06")
  assert.equal(atlas.dailyTaskEngine.snapshot(date).soundEnabled, true)
  assert.equal(atlas.dailyTaskEngine.setSoundEnabled(false), false)
  assert.equal(atlas.dailyTaskEngine.snapshot(date).soundEnabled, false)
})

test("a data das tarefas usa o calendário local", async () => {
  const { atlas } = await createEnvironment()
  const late = new Date(2026, 8, 6, 23, 30)
  const next = new Date(2026, 8, 7, 0, 30)
  assert.equal(atlas.dailyTaskEngine.dateKey(late), "2026-09-06")
  assert.equal(atlas.dailyTaskEngine.dateKey(next), "2026-09-07")
})

test("datas inválidas não quebram a atividade nem fabricam timestamp inválido", async () => {
  const { atlas } = await createEnvironment()
  const invalid = new Date("not-a-date")
  assert.doesNotThrow(() =>
    atlas.dailyTaskEngine.recordActivity(
      "concept_opened",
      { slug: "atlas/a", source: "direct" },
      invalid,
    ),
  )
  const snapshot = atlas.dailyTaskEngine.snapshot()
  assert.equal(snapshot.activity.conceptsOpened, 1)
  assert.ok(snapshot.daily.date)
  assert.ok(snapshot.completedAt === "")
})
