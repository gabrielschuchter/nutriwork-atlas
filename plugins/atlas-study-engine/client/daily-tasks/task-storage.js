;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  if (atlas.dailyTaskStorage?.runtimeVersion === 2) return

  const version = 2
  const prefix = "atlas_daily_tasks_v2"
  const keys = { state: prefix }
  const maxDays = 30
  let memoryState = null

  function emptyState() {
    return {
      version,
      days: {},
      history: [],
      streak: { count: 0, lastCompletedDate: "" },
      settings: { soundEnabled: true },
    }
  }

  function validDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))
  }

  function validTimestamp(value) {
    if (typeof value !== "string") return false
    const timestamp = String(value || "")
    return Boolean(timestamp && Number.isFinite(Date.parse(timestamp)))
  }

  function uniqueIds(value) {
    return Array.isArray(value)
      ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))]
      : []
  }

  function normalizeDay(value, date) {
    const source = value && typeof value === "object" ? value : {}
    const completedAtByTask = {}
    for (const [id, timestamp] of Object.entries(source.completedAtByTask || {})) {
      if (String(id).trim() && validTimestamp(timestamp)) {
        completedAtByTask[String(id)] = timestamp
      }
    }
    return {
      version: Number(source.version) || 1,
      date,
      taskIds: uniqueIds(source.taskIds),
      completedAtByTask,
      completedAt: validTimestamp(source.completedAt) ? String(source.completedAt) : "",
    }
  }

  function normalizeHistory(value) {
    if (!Array.isArray(value)) return []
    const byDate = new Map()
    for (const item of value) {
      const date = String(item?.date || "")
      if (!validDate(date)) continue
      byDate.set(date, {
        date,
        taskIds: uniqueIds(item.taskIds),
        completedTaskIds: uniqueIds(item.completedTaskIds),
        completedAt: validTimestamp(item.completedAt) ? String(item.completedAt) : "",
      })
    }
    return [...byDate.values()]
      .sort((left, right) => left.date.localeCompare(right.date))
      .slice(-maxDays)
  }

  function normalizeState(value) {
    if (!value || typeof value !== "object" || Number(value.version) !== version)
      return emptyState()
    const days = {}
    for (const [date, day] of Object.entries(value.days || {})) {
      if (validDate(date)) days[date] = normalizeDay(day, date)
    }
    const dates = Object.keys(days).sort().slice(-maxDays)
    const normalizedDays = Object.fromEntries(dates.map((date) => [date, days[date]]))
    const history = normalizeHistory(value.history)
    const streak = value.streak && typeof value.streak === "object" ? value.streak : {}
    const lastCompletedDate = validDate(streak.lastCompletedDate) ? streak.lastCompletedDate : ""
    const hasCompletionRecord = Boolean(
      lastCompletedDate &&
      (normalizedDays[lastCompletedDate]?.completedAt ||
        history.some((entry) => entry.date === lastCompletedDate && entry.completedAt)),
    )
    return {
      version,
      days: normalizedDays,
      history,
      streak: {
        count: hasCompletionRecord ? Math.max(0, Math.floor(Number(streak.count) || 0)) : 0,
        lastCompletedDate: hasCompletionRecord ? lastCompletedDate : "",
      },
      settings: {
        soundEnabled: value.settings?.soundEnabled !== false,
      },
    }
  }

  function read(key, fallback = null) {
    if (key !== keys.state) return fallback
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) return emptyState()
      const parsed = normalizeState(JSON.parse(raw))
      memoryState = parsed
      return parsed
    } catch {
      return memoryState ? normalizeState(memoryState) : emptyState()
    }
  }

  function write(key, value) {
    if (key !== keys.state) return
    const normalized = normalizeState(value)
    memoryState = normalized
    try {
      window.localStorage.setItem(key, JSON.stringify(normalized))
    } catch {
      // Daily tasks are optional and must never block navigation.
    }
  }

  function remove(key) {
    if (key !== keys.state) return
    memoryState = null
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Ignore unavailable storage.
    }
  }

  function snapshot() {
    return read(keys.state, emptyState())
  }

  atlas.dailyTaskStorage = {
    runtimeVersion: 2,
    version,
    prefix,
    keys,
    read,
    write,
    remove,
    save: (value) => write(keys.state, value),
    snapshot,
    emptyState,
    normalizeState,
  }
})()
