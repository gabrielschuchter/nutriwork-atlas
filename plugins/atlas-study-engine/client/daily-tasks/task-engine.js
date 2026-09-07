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

  function selectTasks({ date = dateKey() } = {}) {
    const templates = definitions()
    if (templates.length <= dailyTaskCount) return templates.slice(0, dailyTaskCount)
    const omittedIndex = hash(date) % templates.length
    return templates.filter((_, index) => index !== omittedIndex).slice(0, dailyTaskCount)
  }

  function selectTask(options = {}) {
    return selectTasks(options)[0] || null
  }

  function assignment(date) {
    return {
      version: definitionVersion,
      date,
      taskIds: selectTasks({ date }).map((task) => task.id),
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
      state.days[today] = assignment(today)
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

  function recordConceptOpened({ slug, now = new Date() }) {
    return recordActivity("concept_opened", { slug }, now)
  }

  function setSoundEnabled(enabled) {
    const state = storage().snapshot()
    state.settings = { ...(state.settings || {}), soundEnabled: Boolean(enabled) }
    storage().save(state)
    return state.settings.soundEnabled
  }

  atlas.dailyTaskEngine = {
    runtimeVersion: 4,
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
