;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  const { normalizeSlug, staticPath } = atlas.dom

  const data = {
    index: null,
    bySlug: new Map(),
    promise: null,
  }

  function normalizeNode(node) {
    const normalized = { ...(node || {}) }
    normalized.slug = normalizeSlug(normalized.slug)
    normalized.title = String(normalized.title || normalized.slug || "Conceito sem título")
    normalized.area = String(normalized.area || "fundamentos")
    normalized.areaLabel = String(normalized.areaLabel || "Fundamentos da nutrição")
    normalized.excerpt = String(normalized.excerpt || "")
    normalized.outgoing = Array.isArray(normalized.outgoing)
      ? normalized.outgoing.map(normalizeSlug).filter(Boolean)
      : []
    normalized.incoming = Array.isArray(normalized.incoming)
      ? normalized.incoming.map(normalizeSlug).filter(Boolean)
      : []
    normalized.degree = Number.isFinite(normalized.degree)
      ? normalized.degree
      : new Set([...normalized.outgoing, ...normalized.incoming]).size
    return normalized
  }

  async function load() {
    if (data.index) return data
    if (!data.promise) {
      data.promise = fetch(staticPath("atlas-index.json"), { cache: "force-cache" })
        .then((response) => {
          if (!response.ok) throw new Error("Não foi possível carregar o índice do Atlas.")
          return response.json()
        })
        .then((index) => {
          const concepts = Array.isArray(index?.concepts) ? index.concepts.map(normalizeNode) : []
          data.index = {
            version: Number(index?.version || 2),
            concepts,
            edges: Array.isArray(index?.edges) ? index.edges : [],
            areas: Array.isArray(index?.areas) ? index.areas : [],
            metrics: index?.metrics || {},
          }
          data.bySlug = new Map(concepts.map((node) => [node.slug, node]))
          atlas.data.index = data.index
          atlas.data.bySlug = data.bySlug
          return data
        })
        .catch((error) => {
          data.promise = null
          console.error("Falha ao carregar o índice do Atlas", error)
          throw error
        })
    }
    return data.promise
  }

  function get(slug) {
    return data.bySlug.get(normalizeSlug(slug)) || null
  }

  function concepts() {
    return data.index?.concepts || []
  }

  atlas.data = { ...data, load, get, concepts }
})()
