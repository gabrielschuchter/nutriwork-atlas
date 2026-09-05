import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import vm from "node:vm"

const source = await readFile(new URL("./graph-labels.js", import.meta.url), "utf8")

function labels() {
  const window = {}
  vm.runInNewContext(source, { window })
  return window.__nutriworkAtlasEngine.graphLabels
}

test("labels progress from a clean overview to a bounded exploration budget", () => {
  const graphLabels = labels()
  assert.equal(graphLabels.regimeFor(1, 1).maxLabels, 0)
  assert.equal(graphLabels.regimeFor(1.89, 1).maxLabels, 0)
  assert.ok(graphLabels.regimeFor(2, 1).maxLabels > 0)
  assert.ok(graphLabels.regimeFor(6, 1).maxLabels > graphLabels.regimeFor(2, 1).maxLabels)
  assert.equal(graphLabels.viewportBudget(1000, 800, 0), 0)
  assert.ok(graphLabels.viewportBudget(1000, 800, 30) <= 30)
  assert.ok(graphLabels.viewportBudget(390, 700, 30) < graphLabels.viewportBudget(1440, 900, 30))
})
