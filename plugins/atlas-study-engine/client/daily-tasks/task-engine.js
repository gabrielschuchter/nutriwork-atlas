;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  const storage = () => atlas.dailyTaskStorage
  const progressTools = () => atlas.dailyTaskProgress
  const dailyTaskCount = 3

  function dateKey(date = new Date()) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  function addDays(date, amount) {
    const next = new Date(date)
    next.setDate(next.getDate() + amount)
    return dateKey(next)
  }

  function hash(value) {
    let result = 2166136261
    for (let index = 0; index < value.length; index += 1) {
      result ^= value.charCodeAt(index)
      result = Math.imul(result, 16777619)
    }
    return result >>> 0
  }

  function conceptsList(concepts) {
    return (Array.isArray(concepts) ? concepts : [])
      .filter((concept) => concept?.slug)
      .map((concept) => ({
        slug: String(concept.slug),
        title: String(concept.title || concept.slug),
      }))
  }

  function normalizeTasks(tasks) {
    return (Array.isArray(tasks) ? tasks : []).filter(Boolean).map((task, index) => ({
      ...task,
      id: String(task.id || `daily-${index + 1}`),
      target: Math.max(1, Number(task.target) || 1),
    }))
  }

  function dailyTasks(daily) {
    if (Array.isArray(daily?.tasks)) return normalizeTasks(daily.tasks)
    if (daily?.task) return normalizeTasks([daily.task])
    return []
  }

  function materializeTask(chosen, { date, installationId, concepts }) {
    if (!chosen) return null
    const task = { ...chosen }
    if (task.kind === "specific") {
      const available = conceptsList(concepts)
      const target =
        available[hash(`${date}:${installationId}:${task.id}`) % Math.max(1, available.length)]
      if (target) {
        task.targetSlug = target.slug
        task.description = `Visite o conceito: ${target.title}.`
      }
    }
    return task
  }

  function selectTask({
    date,
    installationId,
    visited,
    history,
    concepts,
    streak = 0,
    selectionIndex = 0,
    excludeIds = [],
  }) {
    const templates = atlas.dailyTaskTemplates || []
    if (!templates.length) return null

    const visitedCount = Object.keys(visited || {}).length
    const recentIds = (Array.isArray(history) ? history : []).slice(-2).flatMap((item) => {
      if (Array.isArray(item.ids)) return item.ids
      return item.id ? [item.id] : []
    })
    const excluded = new Set(excludeIds)
    const targetFloor = streak >= 30 ? 5 : streak >= 14 ? 4 : streak >= 7 ? 3 : streak >= 3 ? 2 : 1
    const targetCeiling = Math.min(5, targetFloor + 1)
    const isProgressionEligible = (template) => {
      if (template.kind === "specific") return targetFloor === 1
      return template.target >= targetFloor && template.target <= targetCeiling
    }
    const contextualKinds = !visitedCount
      ? ["open", "source"]
      : visitedCount < 8
        ? ["discover", "open", "source", "specific"]
        : ["connected", "revisit", "source", "open"]
    const eligible = templates.filter(isProgressionEligible)
    const contextual = eligible.filter((template) => contextualKinds.includes(template.kind))
    const candidates = contextual.length ? contextual : eligible.length ? eligible : templates
    const available = candidates.filter((template) => !excluded.has(template.id))
    const distinctCandidates = available.length ? available : candidates
    const withoutRecent = distinctCandidates.filter((template) => !recentIds.includes(template.id))
    const pool = withoutRecent.length ? withoutRecent : distinctCandidates
    const offset = Number(selectionIndex) || 0
    const chosen = pool[hash(`${date}:${installationId}:task:${offset}`) % pool.length]
    return materializeTask(chosen || pool[0], { date, installationId, concepts })
  }

  function selectTasks(options, count = dailyTaskCount) {
    const selected = []
    for (let index = 0; index < count; index += 1) {
      const task = selectTask({
        ...options,
        selectionIndex: index,
        excludeIds: [...(options.excludeIds || []), ...selected.map((item) => item.id)],
      })
      if (!task || selected.some((item) => item.id === task.id)) break
      selected.push(task)
    }
    return selected
  }

  function blankBoard(date, tasks) {
    return {
      date,
      byTask: Object.fromEntries(tasks.map((task) => [task.id, progressTools().blank(date)])),
      completedIds: [],
    }
  }

  function normalizeBoard(value, date, tasks, legacyTaskId = "") {
    const byTask = {}
    const hasTaskBoard = value?.byTask && typeof value.byTask === "object"
    for (const task of tasks) {
      const saved = hasTaskBoard ? value.byTask[task.id] : task.id === legacyTaskId ? value : null
      byTask[task.id] = progressTools().normalize(saved || progressTools().blank(date), date)
    }
    const taskIds = new Set(tasks.map((task) => task.id))
    const completedIds = Array.isArray(value?.completedIds)
      ? value.completedIds.filter((id) => taskIds.has(id))
      : []
    return { date, byTask, completedIds: [...new Set(completedIds)] }
  }

  function hasNormalizedBoard(value, date, tasks) {
    return Boolean(
      value?.date === date &&
      value.byTask &&
      typeof value.byTask === "object" &&
      Array.isArray(value.completedIds) &&
      tasks.every((task) => value.byTask[task.id]),
    )
  }

  function completeProgress(progress, task) {
    const target = Math.max(1, Number(task.target) || 1)
    const items = [...(progress.items || [])]
    while (items.length < target) items.push(`completed:${task.id}:${items.length}`)
    return { ...progress, items, count: target }
  }

  function completedCount(progress, tasks) {
    const completedIds = new Set(progress?.completedIds || [])
    return tasks.filter((task) => completedIds.has(task.id)).length
  }

  function historyEntry(current) {
    const tasks = dailyTasks(current.daily)
    const progress = current.progress || {}
    return {
      date: current.daily.date,
      ids: tasks.map((task) => task.id),
      id: tasks[0]?.id || "",
      completed: Boolean(current.completedAt?.date === current.daily.date),
      completedCount: completedCount(progress, tasks),
    }
  }

  function taskOptions({ date, installationId, visited, history, concepts, streak }) {
    return { date, installationId, visited, history, concepts, streak }
  }

  function migrateCurrentDay(current, today, concepts) {
    const legacyTask = dailyTasks(current.daily)[0]
    const options = taskOptions({
      date: today,
      installationId: storage().installationId(),
      visited: current.visited || {},
      history: current.history || [],
      concepts,
      streak: current.streak?.count || 0,
    })
    const tasks = normalizeTasks([
      legacyTask,
      ...selectTasks({ ...options, excludeIds: [legacyTask.id] }, dailyTaskCount - 1),
    ]).slice(0, dailyTaskCount)
    const progress = normalizeBoard(current.progress, today, tasks, legacyTask.id)
    if (current.completedAt?.date === today) {
      progress.byTask[legacyTask.id] = completeProgress(progress.byTask[legacyTask.id], legacyTask)
      progress.completedIds = [...new Set([...progress.completedIds, legacyTask.id])]
    }
    storage().write(storage().keys.daily, { version: 2, date: today, tasks })
    storage().write(storage().keys.progress, progress)
    storage().write(storage().keys.completedAt, { date: "", value: "" })
    return storage().snapshot()
  }

  function ensureDay(now = new Date(), concepts = []) {
    const today = dateKey(now)
    const current = storage().snapshot()
    const currentTasks = dailyTasks(current.daily)

    if (current.daily?.date === today && currentTasks.length >= dailyTaskCount) {
      if (!hasNormalizedBoard(current.progress, today, currentTasks))
        storage().write(
          storage().keys.progress,
          normalizeBoard(current.progress, today, currentTasks),
        )
      if (current.daily.version !== 2)
        storage().write(storage().keys.daily, { version: 2, date: today, tasks: currentTasks })
      return storage().snapshot()
    }

    if (current.daily?.date === today && currentTasks.length) {
      return migrateCurrentDay(current, today, concepts)
    }

    const history = Array.isArray(current.history) ? [...current.history] : []
    if (current.daily?.date && currentTasks.length) history.push(historyEntry(current))
    const tasks = selectTasks(
      taskOptions({
        date: today,
        installationId: storage().installationId(),
        visited: current.visited || {},
        history: history.slice(-7),
        concepts,
        streak: current.streak?.count || 0,
      }),
      dailyTaskCount,
    )
    const daily = { version: 2, date: today, tasks }
    storage().write(storage().keys.daily, daily)
    storage().write(storage().keys.progress, blankBoard(today, tasks))
    storage().write(storage().keys.completedAt, { date: "", value: "" })
    storage().write(storage().keys.history, history.slice(-7))
    return storage().snapshot()
  }

  function taskRelation(leftSlug, rightSlug) {
    const left = atlas.data?.get?.(leftSlug)
    return Boolean(
      (left && (left.outgoing || []).includes(rightSlug)) ||
      (left && (left.incoming || []).includes(rightSlug)),
    )
  }

  function rememberVisited(visited, slug, now) {
    const current = visited[slug] || { firstSeenAt: now.toISOString(), visits: 0 }
    return {
      ...visited,
      [slug]: { ...current, lastSeenAt: now.toISOString(), visits: current.visits + 1 },
    }
  }

  function qualifies(task, progress, wasVisited, slug, source) {
    const isConnected = Boolean(progress.lastSlug && taskRelation(progress.lastSlug, slug))
    return (
      task.kind === "open" ||
      (task.kind === "discover" && !wasVisited) ||
      (task.kind === "revisit" && wasVisited) ||
      (task.kind === "source" && source === task.source) ||
      (task.kind === "specific" && slug === task.targetSlug) ||
      (task.kind === "connected" && (progress.items.length === 0 || isConnected))
    )
  }

  function recordConceptOpened({ slug, source = "navigation", now = new Date() }) {
    if (!slug)
      return {
        changed: false,
        completed: false,
        completedTasks: [],
        snapshot: storage().snapshot(),
      }
    const current = ensureDay(now, atlas.data?.concepts?.() || [])
    const today = dateKey(now)
    const tasks = dailyTasks(current.daily)
    if (current.progress?.date !== today || !tasks.length)
      return { changed: false, completed: false, completedTasks: [], snapshot: current }

    const visited = current.visited || {}
    const wasVisited = Boolean(visited[slug])
    storage().write(storage().keys.visited, rememberVisited(visited, slug, now))

    const progress = normalizeBoard(current.progress, today, tasks)
    const completedIds = new Set(progress.completedIds)
    const completedTasks = []
    for (const task of tasks) {
      if (completedIds.has(task.id)) continue
      let taskProgress = progress.byTask[task.id]
      if (qualifies(task, taskProgress, wasVisited, slug, source))
        taskProgress = progressTools().add(taskProgress, slug, task.target)
      taskProgress = { ...taskProgress, lastSlug: slug }
      progress.byTask[task.id] = taskProgress
      if (progressTools().isComplete(taskProgress, task)) {
        completedIds.add(task.id)
        completedTasks.push(task)
      }
    }
    progress.completedIds = [...completedIds]
    storage().write(storage().keys.progress, progress)

    const dayCompleted = completedCount(progress, tasks) === tasks.length
    if (dayCompleted && current.completedAt?.date !== today) complete(now, today)
    return {
      changed: true,
      completed: completedTasks.length > 0,
      dayCompleted,
      completedTasks,
      snapshot: snapshot(now, atlas.data?.concepts?.() || []),
    }
  }

  function complete(now, today = dateKey(now)) {
    const current = storage().snapshot()
    if (current.completedAt?.date === today) return
    const previous = current.streak || { count: 0, lastCompletedDate: "" }
    const count = previous.lastCompletedDate === addDays(now, -1) ? previous.count + 1 : 1
    storage().write(storage().keys.completedAt, { date: today, value: now.toISOString() })
    storage().write(storage().keys.streak, { count, lastCompletedDate: today })
  }

  function snapshot(now = new Date(), concepts = []) {
    const current = ensureDay(now, concepts)
    const today = dateKey(now)
    const tasks = dailyTasks(current.daily)
    const finished = completedCount(current.progress, tasks)
    const completed = tasks.length > 0 && finished === tasks.length
    const streak = current.streak || { count: 0, lastCompletedDate: "" }
    const visibleStreak =
      streak.lastCompletedDate === today || streak.lastCompletedDate === addDays(now, -1)
        ? streak.count
        : 0
    return {
      ...current,
      daily: { ...current.daily, tasks },
      completed,
      completedCount: finished,
      totalCount: tasks.length,
      streak: { ...streak, visibleCount: visibleStreak },
      soundEnabled: current.settings?.soundEnabled !== false,
    }
  }

  function setSoundEnabled(enabled) {
    const settings = { soundEnabled: Boolean(enabled) }
    storage().write(storage().keys.settings, settings)
    return settings.soundEnabled
  }

  atlas.dailyTaskEngine = {
    dateKey,
    dailyTaskCount,
    ensureDay,
    selectTask,
    selectTasks,
    snapshot,
    recordConceptOpened,
    setSoundEnabled,
  }
})()
