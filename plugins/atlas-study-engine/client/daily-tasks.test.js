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
    Promise,
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
  return { atlas, values }
}

function day(value, hour = 12) {
  return new Date(`${value}T${String(hour).padStart(2, "0")}:00:00`)
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

function progress(snapshot, id) {
  return snapshot.progress.byTask[id]
}

function plain(value) {
  return JSON.parse(JSON.stringify(value))
}

test("a biblioteca contém exatamente as quatro tarefas simples do Atlas", async () => {
  const { atlas } = await createEnvironment()
  assert.deepEqual(
    plain(
      atlas.dailyTaskTemplates.map(({ id, title, description, target, metric }) => ({
        id,
        title,
        description,
        target,
        metric,
      })),
    ),
    [
      {
        id: "unique-concepts-two",
        title: "Conheça dois conceitos",
        description: "Abra 2 conceitos diferentes.",
        target: 2,
        metric: "uniqueConceptsOpened",
      },
      {
        id: "area-filter-one",
        title: "Filtre o mapa",
        description: "Escolha uma área para explorar.",
        target: 1,
        metric: "areaFilterChanges",
      },
      {
        id: "graph-pan-one",
        title: "Mova o mapa",
        description: "Arraste o grafo para explorar outra região.",
        target: 1,
        metric: "meaningfulGraphPans",
      },
      {
        id: "graph-zoom-one",
        title: "Veja mais de perto",
        description: "Use o zoom no grafo.",
        target: 1,
        metric: "meaningfulGraphZooms",
      },
    ],
  )
})

test("o dia escolhe três tarefas distintas de forma determinística", async () => {
  const first = await createEnvironment()
  const second = await createEnvironment()
  const date = day("2026-09-06")
  const one = first.atlas.dailyTaskEngine.ensureDay(date)
  const two = first.atlas.dailyTaskEngine.ensureDay(date)
  const other = second.atlas.dailyTaskEngine.ensureDay(date)
  const ids = one.days["2026-09-06"].taskIds
  assert.equal(ids.length, 3)
  assert.equal(new Set(ids).size, 3)
  assert.deepEqual(plain(ids), plain(two.days["2026-09-06"].taskIds))
  assert.deepEqual(plain(ids), plain(other.days["2026-09-06"].taskIds))
  assert.ok(ids.every((id) => first.atlas.dailyTaskTemplates.some((task) => task.id === id)))
})

test("conceitos únicos não contam o mesmo slug duas vezes", async () => {
  const { atlas } = await createEnvironment()
  const date = day("2026-09-06")
  forceTasks(atlas, atlas.dailyTaskEngine.dateKey(date), [
    "unique-concepts-two",
    "area-filter-one",
    "graph-pan-one",
  ])
  const first = atlas.dailyTaskEngine.recordActivity("concept_opened", { slug: "atlas/a" }, date)
  assert.equal(progress(first.snapshot, "unique-concepts-two").count, 1)
  const repeated = atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/a", source: "search" },
    date,
  )
  assert.equal(progress(repeated.snapshot, "unique-concepts-two").count, 1)
  const complete = atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/b", source: "internal_link" },
    date,
  )
  assert.equal(progress(complete.snapshot, "unique-concepts-two").count, 2)
  assert.ok(complete.completedTasks.some((item) => item.id === "unique-concepts-two"))
})

test("filtrar o mapa progride quando a área realmente muda", async () => {
  const { atlas } = await createEnvironment()
  const date = day("2026-09-06")
  forceTasks(atlas, atlas.dailyTaskEngine.dateKey(date), [
    "area-filter-one",
    "unique-concepts-two",
    "graph-zoom-one",
  ])
  const changed = atlas.dailyTaskEngine.recordActivity(
    "area_filter_changed",
    { area: "esportiva", previousArea: "all" },
    date,
  )
  assert.equal(changed.snapshot.activity.areaFilterChanges, 1)
  assert.equal(progress(changed.snapshot, "area-filter-one").count, 1)
  assert.ok(changed.completedTasks.some((item) => item.id === "area-filter-one"))

  const repeated = atlas.dailyTaskEngine.recordActivity(
    "area_filter_changed",
    { area: "esportiva", previousArea: "esportiva" },
    date,
  )
  assert.equal(repeated.changed, false)
  assert.equal(repeated.snapshot.activity.areaFilterChanges, 1)
})

test("pan e zoom usam as métricas significativas já emitidas pelo grafo", async () => {
  const { atlas } = await createEnvironment()
  const date = day("2026-09-06")
  forceTasks(atlas, atlas.dailyTaskEngine.dateKey(date), [
    "graph-pan-one",
    "graph-zoom-one",
    "unique-concepts-two",
  ])
  const panned = atlas.dailyTaskEngine.recordActivity("graph_panned", {}, date)
  assert.equal(progress(panned.snapshot, "graph-pan-one").count, 1)
  assert.ok(panned.completedTasks.some((item) => item.id === "graph-pan-one"))
  const zoomed = atlas.dailyTaskEngine.recordActivity("graph_zoomed", {}, date)
  assert.equal(progress(zoomed.snapshot, "graph-zoom-one").count, 1)
  assert.ok(zoomed.completedTasks.some((item) => item.id === "graph-zoom-one"))
})

test("atividades e tarefas sobrevivem a reload sem depender da origem da abertura", async () => {
  const values = new Map()
  const first = await createEnvironment(values)
  const date = day("2026-09-06")
  forceTasks(first.atlas, first.atlas.dailyTaskEngine.dateKey(date), [
    "unique-concepts-two",
    "area-filter-one",
    "graph-pan-one",
  ])
  first.atlas.dailyTaskEngine.recordActivity(
    "concept_opened",
    { slug: "atlas/a", source: "graph" },
    date,
  )
  const second = await createEnvironment(values)
  const snapshot = second.atlas.dailyTaskEngine.snapshot(date)
  assert.deepEqual(plain(snapshot.activity.uniqueConceptsOpened), ["atlas/a"])
  assert.deepEqual(
    plain(snapshot.daily.taskIds),
    plain(first.atlas.dailyTaskEngine.snapshot(date).daily.taskIds),
  )
  assert.equal(progress(snapshot, "unique-concepts-two").count, 1)
})

test("conclusão individual e streak são idempotentes", async () => {
  const { atlas } = await createEnvironment()
  const firstDay = day("2026-09-06")
  forceTasks(atlas, atlas.dailyTaskEngine.dateKey(firstDay), [
    "unique-concepts-two",
    "area-filter-one",
    "graph-pan-one",
  ])
  atlas.dailyTaskEngine.recordActivity("concept_opened", { slug: "atlas/a" }, firstDay)
  atlas.dailyTaskEngine.recordActivity("concept_opened", { slug: "atlas/b" }, firstDay)
  atlas.dailyTaskEngine.recordActivity(
    "area_filter_changed",
    { area: "esportiva", previousArea: "all" },
    firstDay,
  )
  const complete = atlas.dailyTaskEngine.recordActivity("graph_panned", {}, firstDay)
  const completedAt = complete.snapshot.completedAt
  assert.equal(complete.snapshot.completed, true)
  assert.equal(complete.snapshot.streak.count, 1)
  const repeated = atlas.dailyTaskEngine.recordActivity("graph_panned", {}, firstDay)
  assert.equal(repeated.completedTasks.length, 0)
  assert.equal(repeated.snapshot.completedAt, completedAt)
  assert.equal(repeated.snapshot.streak.count, 1)
})

test("novo dia cria atividade nova e preserva histórico recente", async () => {
  const { atlas } = await createEnvironment()
  const first = day("2026-09-06")
  const second = day("2026-09-07")
  const firstSnapshot = atlas.dailyTaskEngine.snapshot(first)
  const secondSnapshot = atlas.dailyTaskEngine.snapshot(second)
  assert.equal(secondSnapshot.activity.date, "2026-09-07")
  assert.equal(secondSnapshot.activity.conceptsOpened, 0)
  assert.deepEqual(plain(secondSnapshot.activity.uniqueConceptsOpened), [])
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
            version: 2,
            date,
            taskIds: ["unique-concepts-two", "area-filter-one", "graph-pan-one"],
            completedAtByTask: { "unique-concepts-two": "not-a-date" },
            completedAt: "also-not-a-date",
          },
        },
        streak: { count: 9, lastCompletedDate: date },
      }),
    ],
  ])
  const { atlas } = await createEnvironment(values)
  const snapshot = atlas.dailyTaskEngine.snapshot(day(date))
  assert.deepEqual(plain(snapshot.progress.completedIds), [])
  assert.equal(snapshot.completedAt, "")
  assert.equal(snapshot.streak.visibleCount, 0)
  assert.deepEqual(
    plain(Object.entries(atlas.dailyTaskStorage.snapshot().days[date].completedAtByTask)),
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
    atlas.dailyTaskEngine.recordActivity("concept_opened", { slug: "atlas/a" }, invalid),
  )
  const snapshot = atlas.dailyTaskEngine.snapshot()
  assert.equal(snapshot.activity.conceptsOpened, 1)
  assert.ok(snapshot.daily.date)
  assert.equal(snapshot.completedAt, "")
})
