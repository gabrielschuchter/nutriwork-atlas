;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})

  function blank(date) {
    return { date, count: 0, items: [], lastSlug: "" }
  }

  function normalize(progress, date) {
    const items = Array.isArray(progress?.items) ? progress.items.filter(Boolean) : []
    return {
      date,
      count: Math.min(items.length, Math.max(0, Number(progress?.count || 0))),
      items,
      lastSlug: String(progress?.lastSlug || ""),
    }
  }

  function add(progress, item, target) {
    if (!item || progress.items.includes(item)) return { ...progress, count: progress.items.length }
    const items = [...progress.items, item]
    const limit = Math.max(1, Number(target) || 1)
    return { ...progress, items, count: Math.min(limit, items.length) }
  }

  function isComplete(progress, task) {
    return progress.count >= Math.max(1, Number(task?.target) || 1)
  }

  atlas.dailyTaskProgress = { blank, normalize, add, isComplete }
})()
