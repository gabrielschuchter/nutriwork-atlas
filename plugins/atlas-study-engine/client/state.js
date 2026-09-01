;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  const { id, normalizeSlug } = atlas.dom
  const databaseName = "nutriwork-atlas-study"
  const stateKey = "state"
  const preferenceKey = "nutriwork-atlas-preferences-v2"
  const legacyKey = "nutriwork-atlas-study-v1"
  const listeners = new Set()
  const defaultGraphControls = {
    spacing: 1.35,
    repulsion: 1.18,
    linkStrength: 0.72,
    nodeScale: 1,
    labelScale: 1,
    edgeOpacity: 0.7,
    collisionPadding: 10,
    centerForce: 0.28,
    depth: 2,
  }
  const emptyState = () => ({
    version: 2,
    updatedAt: Date.now(),
    favorites: [],
    visited: [],
    resume: null,
    activeSession: null,
    sessionHistory: [],
    reviews: {},
    highlights: [],
    cards: [],
    lists: [{ id: "revisar-depois", title: "Revisar depois", slugs: [], createdAt: Date.now() }],
    graphControls: { ...defaultGraphControls },
  })

  let current = emptyState()
  let preferences = { onboardingComplete: false, theme: "dark" }
  let databasePromise = null
  let hydrated = false
  let writeQueue = Promise.resolve()

  function normalizeState(value) {
    const base = emptyState()
    const next = value && typeof value === "object" ? value : {}
    base.favorites = Array.isArray(next.favorites)
      ? next.favorites.map(normalizeSlug).filter(Boolean)
      : base.favorites
    base.visited = Array.isArray(next.visited)
      ? next.visited
          .filter((item) => item && item.slug)
          .map((item) => ({
            slug: normalizeSlug(item.slug),
            seenAt: Number(item.seenAt) || Date.now(),
            section: typeof item.section === "string" ? item.section : "",
          }))
          .filter((item) => item.slug)
          .slice(0, 40)
      : base.visited
    base.resume =
      next.resume && typeof next.resume === "object" && next.resume.slug
        ? { ...next.resume, slug: normalizeSlug(next.resume.slug) }
        : null
    base.activeSession =
      next.activeSession && typeof next.activeSession === "object" ? next.activeSession : null
    base.sessionHistory = Array.isArray(next.sessionHistory) ? next.sessionHistory.slice(0, 30) : []
    base.reviews = next.reviews && typeof next.reviews === "object" ? { ...next.reviews } : {}
    base.highlights = Array.isArray(next.highlights) ? next.highlights.slice(0, 500) : []
    base.cards = Array.isArray(next.cards)
      ? next.cards.slice(0, 500).map((card) => ({
          ...card,
          type: card?.type === "cloze" ? "cloze" : "basic",
        }))
      : []
    base.lists =
      Array.isArray(next.lists) && next.lists.length
        ? next.lists.map((list) => ({
            ...list,
            id: String(list.id || id("list")),
            title: String(list.title || "Minha lista"),
            slugs: Array.isArray(list.slugs) ? list.slugs.map(normalizeSlug).filter(Boolean) : [],
          }))
        : base.lists
    base.graphControls = { ...defaultGraphControls, ...(next.graphControls || {}) }
    base.updatedAt = Number(next.updatedAt) || Date.now()
    return base
  }

  function readPreferences() {
    try {
      const raw = window.localStorage.getItem(preferenceKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        preferences = { ...preferences, ...(parsed || {}) }
      }
      const legacy = window.localStorage.getItem(legacyKey)
      if (!raw && legacy) preferences.onboardingComplete = false
    } catch (error) {
      console.warn("Preferências locais indisponíveis", error)
    }
    if (preferences.theme !== "light" && preferences.theme !== "dark") preferences.theme = "dark"
    return preferences
  }

  function savePreferences(next) {
    preferences = { ...preferences, ...(next || {}) }
    try {
      window.localStorage.setItem(preferenceKey, JSON.stringify(preferences))
    } catch (error) {
      console.warn("Não foi possível salvar as preferências do Atlas", error)
    }
    listeners.forEach((listener) => listener(current, preferences))
    return preferences
  }

  function openDatabase() {
    if (databasePromise) return databasePromise
    if (!window.indexedDB) {
      databasePromise = Promise.reject(new Error("IndexedDB não está disponível neste navegador"))
      return databasePromise
    }
    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(databaseName, 1)
      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains("atlasState"))
          database.createObjectStore("atlasState")
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () =>
        reject(request.error || new Error("Não foi possível abrir o armazenamento local"))
    })
    return databasePromise
  }

  async function readDatabase() {
    const database = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction("atlasState", "readonly")
      const request = transaction.objectStore("atlasState").get(stateKey)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () =>
        reject(request.error || new Error("Não foi possível ler o estado de estudo"))
    })
  }

  function snapshot() {
    return JSON.parse(JSON.stringify(current))
  }

  async function writeDatabase(value) {
    const database = await openDatabase()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction("atlasState", "readwrite")
      transaction.objectStore("atlasState").put(value, stateKey)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () =>
        reject(transaction.error || new Error("Não foi possível salvar o estado de estudo"))
    })
  }

  function backupToLocalStorage(value) {
    try {
      window.localStorage.setItem("nutriwork-atlas-study-backup", JSON.stringify(value))
    } catch {
      // IndexedDB remains the primary source for study state.
    }
  }

  function persist() {
    const value = snapshot()
    backupToLocalStorage(value)
    writeQueue = writeQueue
      .catch(() => undefined)
      .then(() => writeDatabase(value))
      .catch((error) => console.warn("Estado de estudo mantido apenas nesta sessão", error))
    return writeQueue
  }

  async function hydrate() {
    if (hydrated) return current
    readPreferences()
    let stored = null
    try {
      stored = await readDatabase()
    } catch (error) {
      console.warn("Armazenamento de estudo indisponível; usando recuperação local", error)
      try {
        const backup = window.localStorage.getItem("nutriwork-atlas-study-backup")
        stored = backup ? JSON.parse(backup) : null
      } catch {
        stored = null
      }
    }
    if (!stored) {
      try {
        const legacy = window.localStorage.getItem(legacyKey)
        if (legacy) {
          const parsed = JSON.parse(legacy)
          stored = { favorites: parsed.favorites, visited: parsed.visited }
        }
      } catch (error) {
        console.warn("Não foi possível migrar o histórico anterior", error)
      }
    }
    current = normalizeState(stored)
    hydrated = true
    return current
  }

  function update(mutator) {
    const result = mutator(current)
    current.updatedAt = Date.now()
    persist()
    listeners.forEach((listener) => listener(current, preferences))
    return result === undefined ? current : result
  }

  function subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function get() {
    return current
  }

  function getPreferences() {
    return preferences
  }

  function isFavorite(slug) {
    return current.favorites.includes(normalizeSlug(slug))
  }

  function toggleFavorite(slug) {
    const normalized = normalizeSlug(slug)
    return update((state) => {
      const index = state.favorites.indexOf(normalized)
      if (index >= 0) state.favorites.splice(index, 1)
      else state.favorites.unshift(normalized)
      return index < 0
    })
  }

  function recordVisit(slug, section) {
    const normalized = normalizeSlug(slug)
    if (!normalized) return
    update((state) => {
      state.visited = [
        { slug: normalized, seenAt: Date.now(), section: section || "" },
        ...state.visited.filter((item) => item.slug !== normalized),
      ].slice(0, 40)
    })
  }

  function setResume(value) {
    update((state) => {
      state.resume = value
        ? { ...value, slug: normalizeSlug(value.slug), updatedAt: Date.now() }
        : null
    })
  }

  function reviewFor(slug) {
    return current.reviews[normalizeSlug(slug)] || null
  }

  function reviewStatus(slug, now) {
    const review = reviewFor(slug)
    if (!review) return "new"
    const timestamp = now || Date.now()
    if (review.nextReviewAt && Number(review.nextReviewAt) > timestamp)
      return review.status === "mastered" ? "mastered" : "scheduled"
    if (review.status === "mastered" && !review.nextReviewAt) return "mastered"
    if (review.reps > 0) return "due"
    return "learning"
  }

  const ratings = {
    again: { label: "Não lembrei", baseDays: 1, factor: 0.55 },
    hard: { label: "Difícil", baseDays: 3, factor: 0.85 },
    good: { label: "Bom", baseDays: 7, factor: 1.45 },
    easy: { label: "Fácil", baseDays: 21, factor: 2.35 },
  }

  function scheduleReview(slug, rating) {
    const normalized = normalizeSlug(slug)
    const choice = ratings[rating] || ratings.good
    return update((state) => {
      const previous = state.reviews[normalized] || {
        reps: 0,
        stability: 0,
        difficulty: 0.5,
        lapses: 0,
      }
      const reps = Number(previous.reps || 0) + 1
      const stability = Math.max(
        1,
        Math.round(
          (Number(previous.stability || 0) || choice.baseDays) * choice.factor +
            choice.baseDays * 0.35,
        ),
      )
      const days = Math.min(180, Math.max(1, stability))
      const status =
        rating === "again"
          ? "learning"
          : rating === "easy" && reps >= 4 && days >= 30
            ? "mastered"
            : "scheduled"
      state.reviews[normalized] = {
        ...previous,
        status,
        rating,
        reps,
        difficulty: Math.max(
          0.05,
          Math.min(
            0.99,
            Number(previous.difficulty || 0.5) +
              (rating === "hard"
                ? 0.08
                : rating === "easy"
                  ? -0.08
                  : rating === "again"
                    ? 0.12
                    : 0),
          ),
        ),
        stability,
        scheduledDays: days,
        nextReviewAt: Date.now() + days * 24 * 60 * 60 * 1000,
        lastReviewedAt: Date.now(),
        lapses: Number(previous.lapses || 0) + (rating === "again" ? 1 : 0),
        engine: "deterministic-review-adapter-v1",
      }
      return state.reviews[normalized]
    })
  }

  function dueSlugs() {
    return Object.keys(current.reviews).filter((slug) => reviewStatus(slug) === "due")
  }

  function addHighlight(value) {
    return update((state) => {
      const highlight = {
        id: id("highlight"),
        createdAt: Date.now(),
        ...value,
        slug: normalizeSlug(value.slug),
      }
      state.highlights.unshift(highlight)
      return highlight
    })
  }

  function addCard(value) {
    return update((state) => {
      const card = {
        id: id("card"),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...value,
        type: value?.type === "cloze" ? "cloze" : "basic",
        slug: normalizeSlug(value.slug),
      }
      state.cards.unshift(card)
      return card
    })
  }

  function addList(title) {
    return update((state) => {
      const list = {
        id: id("list"),
        title: String(title || "Minha lista").trim() || "Minha lista",
        slugs: [],
        createdAt: Date.now(),
      }
      state.lists.push(list)
      return list
    })
  }

  function addToList(listId, slug) {
    const normalized = normalizeSlug(slug)
    return update((state) => {
      const list = state.lists.find((item) => item.id === listId)
      if (!list) return false
      if (!list.slugs.includes(normalized)) list.slugs.push(normalized)
      return true
    })
  }

  function stats(concepts) {
    const all = Array.isArray(concepts) ? concepts : []
    const statuses = all.map((node) => ({ node, status: reviewStatus(node.slug) }))
    return {
      total: all.length,
      seen: all.filter((node) => current.visited.some((item) => item.slug === node.slug)).length,
      newCount: statuses.filter((item) => item.status === "new").length,
      learning: statuses.filter((item) => item.status === "learning").length,
      scheduled: statuses.filter((item) => item.status === "scheduled").length,
      due: statuses.filter((item) => item.status === "due").length,
      mastered: statuses.filter((item) => item.status === "mastered").length,
      difficult: Object.values(current.reviews).filter(
        (review) => review.rating === "again" || review.rating === "hard",
      ).length,
      coverage: all.length
        ? Math.round(
            (all.filter((node) => current.visited.some((item) => item.slug === node.slug)).length /
              all.length) *
              100,
          )
        : 0,
    }
  }

  atlas.state = {
    addCard,
    addHighlight,
    addList,
    addToList,
    defaultGraphControls,
    dueSlugs,
    get,
    getPreferences,
    getState: get,
    hydrate,
    isFavorite,
    normalizeState,
    ratings,
    recordVisit,
    reviewFor,
    reviewStatus,
    savePreferences,
    scheduleReview,
    setResume,
    stats,
    subscribe,
    toggleFavorite,
    update,
  }
})()
