;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  if (atlas.activityTracker?.runtimeVersion === 1) return

  const version = 1
  const storageKey = "atlas_activity_v1"
  const maxDays = 30
  const maxListItems = 500
  const maxRecentEvents = 120
  const eventTypes = Object.freeze([
    "concept_opened",
    "area_filter_changed",
    "graph_panned",
    "graph_zoomed",
    "graph_fit",
  ])
  const sources = new Set(["graph", "search", "internal_link", "concept_list", "direct", "history"])
  let memoryState = null

  function safeDate(value) {
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? new Date() : date
  }

  function dateKey(value = new Date()) {
    const safe = safeDate(value)
    const year = safe.getFullYear()
    const month = String(safe.getMonth() + 1).padStart(2, "0")
    const day = String(safe.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  function isDateKey(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))
  }

  function safeNumber(value) {
    return Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0
  }

  function uniqueStrings(value) {
    if (!Array.isArray(value)) return []
    return [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))].slice(
      0,
      maxListItems,
    )
  }

  function emptyDay(date) {
    return {
      date,
      conceptsOpened: 0,
      uniqueConceptsOpened: [],
      graphConcepts: [],
      searchResultConcepts: [],
      internalLinkConcepts: [],
      conceptListConcepts: [],
      filteredConcepts: [],
      areaFilterChanges: 0,
      meaningfulGraphPans: 0,
      meaningfulGraphZooms: 0,
      activeArea: "all",
      recentEvents: [],
    }
  }

  function normalizeDay(value, date) {
    const source = value && typeof value === "object" ? value : {}
    const day = emptyDay(date)
    day.conceptsOpened = safeNumber(source.conceptsOpened)
    day.uniqueConceptsOpened = uniqueStrings(source.uniqueConceptsOpened)
    day.graphConcepts = uniqueStrings(source.graphConcepts)
    day.searchResultConcepts = uniqueStrings(source.searchResultConcepts)
    day.internalLinkConcepts = uniqueStrings(source.internalLinkConcepts)
    day.conceptListConcepts = uniqueStrings(source.conceptListConcepts)
    day.filteredConcepts = uniqueStrings(source.filteredConcepts)
    day.areaFilterChanges = safeNumber(source.areaFilterChanges)
    day.meaningfulGraphPans = safeNumber(source.meaningfulGraphPans)
    day.meaningfulGraphZooms = safeNumber(source.meaningfulGraphZooms)
    day.activeArea = String(source.activeArea || "all")
    day.recentEvents = Array.isArray(source.recentEvents)
      ? source.recentEvents
          .map((event) => ({
            type: String(event?.type || ""),
            at: String(event?.at || ""),
          }))
          .filter((event) => eventTypes.includes(event.type) && event.at)
          .slice(-maxRecentEvents)
      : []
    return day
  }

  function emptyState() {
    return { version, days: {} }
  }

  function normalizeState(value) {
    if (!value || typeof value !== "object" || Number(value.version) !== version)
      return emptyState()
    const days = {}
    for (const [date, day] of Object.entries(value.days || {})) {
      if (isDateKey(date)) days[date] = normalizeDay(day, date)
    }
    const dates = Object.keys(days).sort().slice(-maxDays)
    return {
      version,
      days: Object.fromEntries(dates.map((date) => [date, days[date]])),
    }
  }

  function readState() {
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return emptyState()
      const parsed = normalizeState(JSON.parse(raw))
      memoryState = parsed
      return parsed
    } catch {
      return memoryState ? normalizeState(memoryState) : emptyState()
    }
  }

  function writeState(state) {
    const normalized = normalizeState(state)
    memoryState = normalized
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(normalized))
    } catch {
      // Activity is an enhancement and never blocks navigation.
    }
    return normalized
  }

  function currentDay(value = new Date()) {
    const state = readState()
    const date = dateKey(value)
    return state.days[date] || emptyDay(date)
  }

  function appendUnique(list, value) {
    const item = String(value || "").trim()
    if (!item || list.includes(item) || list.length >= maxListItems) return false
    list.push(item)
    return true
  }

  function normalizedSource(value) {
    const source = String(value || "direct")
    return sources.has(source) ? source : "direct"
  }

  function emit(detail) {
    if (typeof document === "undefined" || typeof document.dispatchEvent !== "function") return
    document.dispatchEvent(new CustomEvent("atlas:activity", { detail }))
  }

  function recordActivity(type, data = {}, now = new Date()) {
    if (!eventTypes.includes(type)) return { changed: false, type }
    const safeNow = safeDate(now)
    const date = dateKey(safeNow)
    const state = readState()
    const day = normalizeDay(state.days[date], date)
    const payload = {}
    let changed = false

    if (type === "concept_opened") {
      const slug = String(data.slug || "").trim()
      if (!slug) return { changed: false, type, date }
      const source = normalizedSource(data.source)
      day.conceptsOpened += 1
      appendUnique(day.uniqueConceptsOpened, slug)
      if (source === "graph") appendUnique(day.graphConcepts, slug)
      if (source === "search") appendUnique(day.searchResultConcepts, slug)
      if (source === "internal_link") appendUnique(day.internalLinkConcepts, slug)
      if (source === "concept_list") appendUnique(day.conceptListConcepts, slug)
      if (String(data.area || "all") !== "all") appendUnique(day.filteredConcepts, slug)
      payload.slug = slug
      payload.source = source
      changed = true
    } else if (type === "area_filter_changed") {
      const area = String(data.area || "all")
      const previousArea = String(data.previousArea || day.activeArea || "all")
      if (previousArea !== area) {
        day.activeArea = area
        if (area !== "all") day.areaFilterChanges += 1
        payload.area = area
        payload.previousArea = previousArea
        changed = true
      }
    } else if (type === "graph_panned") {
      day.meaningfulGraphPans += 1
      changed = true
    } else if (type === "graph_zoomed") {
      day.meaningfulGraphZooms += 1
      changed = true
    } else {
      changed = true
    }

    if (!changed) return { changed: false, type, date, activity: day }
    day.recentEvents.push({ type, at: safeNow.toISOString() })
    day.recentEvents = day.recentEvents.slice(-maxRecentEvents)
    state.days[date] = day
    const normalized = writeState(state)
    const detail = {
      type,
      date,
      ...payload,
      activity: normalized.days[date],
    }
    emit(detail)
    return { changed: true, ...detail }
  }

  atlas.activityTracker = {
    runtimeVersion: 1,
    version,
    storageKey,
    eventTypes,
    dateKey,
    emptyDay,
    currentDay,
    snapshot: readState,
    recordActivity,
  }
})()
