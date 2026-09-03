;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  const enabled = new URLSearchParams(window.location.search).has("atlasPerf")

  if (!enabled) {
    atlas.perf = null
    return
  }

  const counters = Object.create(null)
  const samples = Object.create(null)
  const longTasks = []
  let startedAt = performance.now()
  const maxSamples = 20000

  function count(name, amount = 1) {
    counters[name] = (counters[name] || 0) + amount
  }

  function sample(name, value) {
    if (!Number.isFinite(value)) return
    const values = samples[name] || (samples[name] = [])
    if (values.length < maxSamples) values.push(value)
  }

  function statistics(values) {
    if (!values?.length) return { count: 0, p50: 0, p95: 0, p99: 0, max: 0, mean: 0 }
    const ordered = [...values].sort((left, right) => left - right)
    const percentile = (ratio) =>
      ordered[Math.min(ordered.length - 1, Math.floor(ordered.length * ratio))]
    let total = 0
    for (const value of ordered) total += value
    return {
      count: ordered.length,
      p50: percentile(0.5),
      p95: percentile(0.95),
      p99: percentile(0.99),
      max: ordered[ordered.length - 1],
      mean: total / ordered.length,
    }
  }

  let longTaskObserver = null
  if (window.PerformanceObserver) {
    try {
      longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (longTasks.length < 1000) longTasks.push(entry.duration)
        }
      })
      longTaskObserver.observe({ type: "longtask", buffered: true })
    } catch {
      longTaskObserver = null
    }
  }

  const recorder = {
    enabled: true,
    count,
    sample,
    reset() {
      for (const name of Object.keys(counters)) delete counters[name]
      for (const name of Object.keys(samples)) delete samples[name]
      longTasks.length = 0
      startedAt = performance.now()
    },
    snapshot() {
      const elapsedMs = Math.max(1, performance.now() - startedAt)
      const rates = {}
      for (const [name, value] of Object.entries(counters))
        rates[name + "PerSecond"] = value / (elapsedMs / 1000)
      const durations = {}
      for (const [name, values] of Object.entries(samples)) durations[name] = statistics(values)
      return {
        version: 1,
        elapsedMs,
        counters: { ...counters },
        rates,
        durations,
        longTasks: [...longTasks],
        memory: performance.memory
          ? {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
              jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            }
          : null,
      }
    },
    dispose() {
      longTaskObserver?.disconnect()
    },
  }

  atlas.perf = recorder
  window.__nutriworkAtlasPerf = recorder
})()
