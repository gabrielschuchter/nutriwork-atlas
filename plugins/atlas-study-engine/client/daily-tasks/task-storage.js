;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  const prefix = "atlas_daily_tasks_v1"
  const keys = {
    daily: prefix + ":daily",
    progress: prefix + ":progress",
    completedAt: prefix + ":completed-at",
    visited: prefix + ":visited",
    history: prefix + ":history",
    streak: prefix + ":streak",
    settings: prefix + ":settings",
    installation: prefix + ":installation",
  }

  function read(key, fallback) {
    try {
      const value = window.localStorage.getItem(key)
      return value ? JSON.parse(value) : fallback
    } catch {
      return fallback
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Daily tasks are optional and must never block navigation.
    }
  }

  function remove(key) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Ignore unavailable storage.
    }
  }

  function installationId() {
    let id = read(keys.installation, "")
    if (typeof id === "string" && id) return id
    id =
      globalThis.crypto?.randomUUID?.() ||
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    write(keys.installation, id)
    return id
  }

  function snapshot() {
    return {
      daily: read(keys.daily, null),
      progress: read(keys.progress, null),
      completedAt: read(keys.completedAt, null),
      visited: read(keys.visited, {}),
      history: read(keys.history, []),
      streak: read(keys.streak, { count: 0, lastCompletedDate: "" }),
      settings: read(keys.settings, { soundEnabled: true }),
    }
  }

  atlas.dailyTaskStorage = {
    prefix,
    keys,
    read,
    write,
    remove,
    installationId,
    snapshot,
  }
})()
