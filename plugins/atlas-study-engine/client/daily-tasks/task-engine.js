;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  const storage = () => atlas.dailyTaskStorage
  const progressTools = () => atlas.dailyTaskProgress

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

  function selectTask({ date, installationId, visited, history, concepts, streak = 0 }) {
    const templates = atlas.dailyTaskTemplates || []
    const visitedCount = Object.keys(visited || {}).length
    const recentIds = (Array.isArray(history) ? history : []).slice(-2).map((item) => item.id)
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
    const withoutRecent = candidates.filter((template) => !recentIds.includes(template.id))
    const pool = withoutRecent.length ? withoutRecent : candidates
    const chosen = pool[hash(`${date}:${installationId}`) % pool.length] || templates[0]
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

  function ensureDay(now = new Date(), concepts = []) {
    const today = dateKey(now)
    const current = storage().snapshot()
    if (current.daily?.date === today && current.daily.task) return current

    const history = Array.isArray(current.history) ? [...current.history] : []
    if (current.daily?.date && current.daily.task) {
      history.push({
        date: current.daily.date,
        id: current.daily.task.id,
        completed: Boolean(current.completedAt?.date === current.daily.date),
      })
    }
    const task = selectTask({
      date: today,
      installationId: storage().installationId(),
      visited: current.visited || {},
      history: history.slice(-7),
      concepts,
      streak: current.streak?.count || 0,
    })
    const daily = { date: today, task }
    storage().write(storage().keys.daily, daily)
    storage().write(storage().keys.progress, progressTools().blank(today))
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

  function recordConceptOpened({ slug, source = "navigation", now = new Date() }) {
    if (!slug) return { changed: false, completed: false, snapshot: storage().snapshot() }
    const current = ensureDay(now, atlas.data?.concepts?.() || [])
    const today = dateKey(now)
    if (current.progress?.date !== today || !current.daily?.task)
      return { changed: false, completed: false, snapshot: current }

    const visited = current.visited || {}
    const wasVisited = Boolean(visited[slug])
    const nextVisited = rememberVisited(visited, slug, now)
    storage().write(storage().keys.visited, nextVisited)
    const task = current.daily.task
    let progress = progressTools().normalize(
      current.progress || progressTools().blank(today),
      today,
    )
    const isConnected = Boolean(progress.lastSlug && taskRelation(progress.lastSlug, slug))
    const qualifies =
      task.kind === "open" ||
      (task.kind === "discover" && !wasVisited) ||
      (task.kind === "revisit" && wasVisited) ||
      (task.kind === "source" && source === task.source) ||
      (task.kind === "specific" && slug === task.targetSlug) ||
      (task.kind === "connected" && (progress.items.length === 0 || isConnected))
    if (qualifies) progress = progressTools().add(progress, slug, task.target)
    progress = { ...progress, lastSlug: slug }
    storage().write(storage().keys.progress, progress)

    const completedBefore = Boolean(current.completedAt?.date === today)
    const completed = !completedBefore && progressTools().isComplete(progress, task)
    if (completed) complete(now, today)
    return {
      changed: true,
      completed,
      snapshot: storage().snapshot(),
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
    const completed = current.completedAt?.date === today
    const streak = current.streak || { count: 0, lastCompletedDate: "" }
    const visibleStreak =
      streak.lastCompletedDate === today || streak.lastCompletedDate === addDays(now, -1)
        ? streak.count
        : 0
    return {
      ...current,
      completed,
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
    ensureDay,
    selectTask,
    snapshot,
    recordConceptOpened,
    setSoundEnabled,
  }
})()
