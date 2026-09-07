;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  const storage = () => atlas.dailyTaskStorage
  const activityTracker = () => atlas.activityTracker
  const progressTools = () => atlas.dailyTaskProgress
  const dailyTaskCount = 3
  const definitionVersion = Number(atlas.dailyTaskDefinitionVersion) || 1

  function dateKey(date = new Date()) {
    return activityTracker()?.dateKey?.(date) || localDateKey(date)
  }

  function safeDate(value = new Date()) {
    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)
    return Number.isNaN(date.getTime()) ? new Date() : date
  }

  function localDateKey(value) {
    const date = value instanceof Date ? value : new Date(value)
    const safe = Number.isNaN(date.getTime()) ? new Date() : date
    return `${safe.getFullYear()}-${String(safe.getMonth() + 1).padStart(2, "0")}-${String(safe.getDate()).padStart(2, "0")}`
  }

  function addDays(date, amount) {
    const next = new Date(date)
    next.setDate(next.getDate() + amount)
    return dateKey(next)
  }

  function hash(value) {
    let result = 2166136261
    for (let index = 0; index < String(value).length; index += 1) {
      result ^= String(value).charCodeAt(index)
      result = Math.imul(result, 16777619)
    }
    return result >>> 0
  }

  function definitions() {
    return Array.isArray(atlas.dailyTaskTemplates) ? atlas.dailyTaskTemplates : []
  }

  function definitionMap() {
    return new Map(definitions().map((task) => [task.id, task]))
  }

  function isValidAssignment(day) {
    const map = definitionMap()
    return Boolean(
      day &&
      Number(day.version) === definitionVersion &&
      Array.isArray(day.taskIds) &&
      day.taskIds.length === dailyTaskCount &&
      new Set(day.taskIds).size === dailyTaskCount &&
      day.taskIds.every((id) => map.has(id)),
    )
  }

  function recentTaskIds(history) {
    return new Set(
      (Array.isArray(history) ? history : [])
        .slice(-7)
        .flatMap((entry) => (Array.isArray(entry?.taskIds) ? entry.taskIds : [])),
    )
  }

  function selectTasks({ date = dateKey(), history = [] } = {}) {
    const templates = definitions()
    const groups = [...new Set(templates.map((task) => task.selectionGroup).filter(Boolean))].sort(
      (left, right) => {
        const leftFamilyCount = new Set(
          templates.filter((task) => task.selectionGroup === left).map((task) => task.family),
        ).size
        const rightFamilyCount = new Set(
          templates.filter((task) => task.selectionGroup === right).map((task) => task.family),
        ).size
        return leftFamilyCount - rightFamilyCount || left.localeCompare(right)
      },
    )
    const recent = recentTaskIds(history)
    const selected = []
    const selectedFamilies = new Set()
    for (const group of groups) {
      if (selected.length >= dailyTaskCount) break
      const candidates = templates.filter((task) => task.selectionGroup === group)
      const fresh = candidates.filter((task) => !recent.has(task.id))
      const freshDistinct = fresh.filter((task) => !selectedFamilies.has(task.family))
      const distinct = candidates.filter((task) => !selectedFamilies.has(task.family))
      const pool = freshDistinct.length
        ? freshDistinct
        : distinct.length
          ? distinct
          : fresh.length
            ? fresh
            : candidates
      if (!pool.length) continue
      const offset = hash(`${date}:${group}`) % pool.length
      const chosen = pool[offset]
      if (chosen && !selected.some((task) => task.id === chosen.id)) {
        selected.push(chosen)
        selectedFamilies.add(chosen.family)
      }
    }
    if (selected.length < dailyTaskCount) {
      for (const task of templates) {
        if (selected.length >= dailyTaskCount) break
        if (!selected.some((item) => item.id === task.id)) {
          selected.push(task)
          selectedFamilies.add(task.family)
        }
      }
    }
    return selected.slice(0, dailyTaskCount)
  }

  function selectTask(options = {}) {
    return selectTasks(options)[0] || null
  }

  function assignment(date, history) {
    return {
      version: definitionVersion,
      date,
      taskIds: selectTasks({ date, history }).map((task) => task.id),
      completedAtByTask: {},
      completedAt: "",
    }
  }

  function historyFromDays(state) {
    return Object.values(state.days || {})
      .filter(Boolean)
      .map((day) => ({
        date: day.date,
        taskIds: [...(day.taskIds || [])],
        completedTaskIds: Object.keys(day.completedAtByTask || {}),
        completedAt: day.completedAt || "",
      }))
      .sort((left, right) => String(left.date).localeCompare(String(right.date)))
      .slice(-30)
  }

  function ensureDay(now = new Date()) {
    const effectiveNow = safeDate(now)
    const today = dateKey(effectiveNow)
    const state = storage().snapshot()
    let changed = false
    if (!isValidAssignment(state.days?.[today])) {
      state.days[today] = assignment(today, state.history)
      changed = true
    }
    const history = historyFromDays(state)
    if (JSON.stringify(history) !== JSON.stringify(state.history || [])) {
      state.history = history
      changed = true
    }
    if (changed) storage().save(state)
    return storage().snapshot()
  }

  function tasksFor(day) {
    const map = definitionMap()
    return (day?.taskIds || []).map((id) => map.get(id)).filter(Boolean)
  }

  function progressFor(tasks, activity) {
    return Object.fromEntries(
      tasks.map((task) => [task.id, progressTools().progress(task, activity)]),
    )
  }

  function completedIdsFor(tasks, day, progress) {
    return tasks
      .filter((task) => progress[task.id]?.complete || day?.completedAtByTask?.[task.id])
      .map((task) => task.id)
  }

  function updateStreak(state, now, today) {
    const previous = state.streak || { count: 0, lastCompletedDate: "" }
    if (previous.lastCompletedDate === today) return false
    const count = previous.lastCompletedDate === addDays(now, -1) ? previous.count + 1 : 1
    state.streak = { count, lastCompletedDate: today }
    return true
  }

  function syncCompletions(now = new Date()) {
    const effectiveNow = safeDate(now)
    const state = ensureDay(effectiveNow)
    const today = dateKey(effectiveNow)
    const day = state.days[today]
    const tasks = tasksFor(day)
    const activity = activityTracker()?.currentDay?.(effectiveNow) || {}
    const progress = progressFor(tasks, activity)
    const newlyCompleted = []
    let changed = false
    for (const task of tasks) {
      if (!progress[task.id]?.complete || day.completedAtByTask[task.id]) continue
      day.completedAtByTask[task.id] = effectiveNow.toISOString()
      newlyCompleted.push(task)
      changed = true
    }
    const allComplete =
      tasks.length === dailyTaskCount && tasks.every((task) => progress[task.id]?.complete)
    if (allComplete && !day.completedAt) {
      day.completedAt = effectiveNow.toISOString()
      updateStreak(state, effectiveNow, today)
      changed = true
    }
    if (changed) {
      state.days[today] = day
      state.history = historyFromDays(state)
      storage().save(state)
    }
    return { state: storage().snapshot(), today, day, tasks, activity, progress, newlyCompleted }
  }

  function snapshot(now = new Date()) {
    const effectiveNow = safeDate(now)
    const synced = syncCompletions(effectiveNow)
    const { state, today, day, tasks, activity, progress } = synced
    const completedIds = completedIdsFor(tasks, day, progress)
    const completedCount = completedIds.length
    const streak = state.streak || { count: 0, lastCompletedDate: "" }
    const visibleStreak =
      streak.lastCompletedDate === today || streak.lastCompletedDate === addDays(effectiveNow, -1)
        ? streak.count
        : 0
    return {
      version: state.version,
      daily: {
        version: definitionVersion,
        date: today,
        taskIds: [...day.taskIds],
        tasks,
      },
      progress: {
        date: today,
        byTask: progress,
        completedIds,
      },
      activity,
      history: state.history,
      completed: completedCount === tasks.length && tasks.length === dailyTaskCount,
      completedCount,
      totalCount: tasks.length,
      completedAt: day.completedAt || "",
      streak: { ...streak, visibleCount: visibleStreak },
      soundEnabled: state.settings?.soundEnabled !== false,
    }
  }

  function processActivity(detail, now = new Date()) {
    const fallbackNow = safeDate(now)
    const activityAt = detail?.at ? new Date(detail.at) : null
    const effectiveNow =
      activityAt && !Number.isNaN(activityAt.getTime()) ? activityAt : fallbackNow
    const synced = syncCompletions(effectiveNow)
    return {
      changed: Boolean(detail?.type),
      completed: synced.newlyCompleted.length > 0,
      completedTasks: synced.newlyCompleted,
      dayCompleted: Boolean(synced.day.completedAt),
      snapshot: snapshot(effectiveNow),
    }
  }

  function recordActivity(type, data = {}, now = new Date()) {
    const effectiveNow = safeDate(now)
    const result = activityTracker()?.recordActivity?.(type, data, effectiveNow)
    if (!result?.changed)
      return { changed: false, completedTasks: [], snapshot: snapshot(effectiveNow) }
    return processActivity(result, effectiveNow)
  }

  function recordConceptOpened({ slug, source = "direct", area = "all", now = new Date() }) {
    return recordActivity("concept_opened", { slug, source, area }, now)
  }

  function setSoundEnabled(enabled) {
    const state = storage().snapshot()
    state.settings = { ...(state.settings || {}), soundEnabled: Boolean(enabled) }
    storage().save(state)
    return state.settings.soundEnabled
  }

  atlas.dailyTaskEngine = {
    runtimeVersion: 3,
    definitionVersion,
    dailyTaskCount,
    dateKey,
    ensureDay,
    selectTask,
    selectTasks,
    snapshot,
    processActivity,
    recordActivity,
    recordConceptOpened,
    setSoundEnabled,
  }
})()
