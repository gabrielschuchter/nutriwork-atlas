import test from "node:test"
import assert from "node:assert/strict"
import { buildRoadmapColumns, roadmapColumns, roadmapHasItems, roadmapItems } from "./roadmap"

test("roadmap vazio usa o estado de lançamento e não publica colunas zeradas", () => {
  assert.deepEqual(roadmapItems, [])
  assert.equal(roadmapHasItems, false)
  assert.deepEqual(
    roadmapColumns.map((column) => column.items),
    [[], [], []],
  )
})

test("um item real volta a preencher somente a coluna correspondente", () => {
  const columns = buildRoadmapColumns([
    {
      title: "Melhoria real de teste",
      description: "Item temporário usado apenas para validar a projeção das colunas.",
      column: "planned",
    },
  ])

  assert.equal(columns.find((column) => column.key === "planned")?.items.length, 1)
  assert.equal(columns.find((column) => column.key === "in-progress")?.items.length, 0)
  assert.equal(columns.find((column) => column.key === "completed")?.items.length, 0)
})
