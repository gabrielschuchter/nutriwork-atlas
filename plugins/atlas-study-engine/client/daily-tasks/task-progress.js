;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})

  function uniqueItems(value) {
    return Array.isArray(value) ? [...new Set(value.filter(Boolean))] : []
  }

  function metricValue(activity, metric) {
    const value = activity?.[metric]
    if (Array.isArray(value)) return uniqueItems(value).length
    return Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0
  }

  function metricItems(activity, metric) {
    const value = activity?.[metric]
    return Array.isArray(value) ? uniqueItems(value) : []
  }

  function progress(task, activity) {
    const target = Math.max(1, Number(task?.target) || 1)
    const count = Math.min(target, metricValue(activity, task?.metric))
    return {
      count,
      target,
      items: metricItems(activity, task?.metric),
      metric: String(task?.metric || ""),
      complete: count >= target,
    }
  }

  atlas.dailyTaskProgress = { metricValue, metricItems, progress }
})()
