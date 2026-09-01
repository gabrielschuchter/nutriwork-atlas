;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  const { normalizeSlug, staticPath } = atlas.dom

  const data = {
    index: null,
    paths: [],
    bySlug: new Map(),
    promise: null,
    pathsError: null,
  }

  function normalizeNode(node) {
    const normalized = { ...(node || {}) }
    normalized.slug = normalizeSlug(normalized.slug)
    normalized.title = String(normalized.title || normalized.slug || "Conceito sem título")
    normalized.area = String(normalized.area || "fundamentos")
    normalized.areaLabel = String(normalized.areaLabel || "Fundamentos da nutrição")
    normalized.description = String(normalized.description || normalized.excerpt || "")
    normalized.excerpt = String(normalized.excerpt || normalized.description || "")
    normalized.text = String(normalized.text || normalized.description || "")
    normalized.outgoing = Array.isArray(normalized.outgoing)
      ? normalized.outgoing.map(normalizeSlug).filter(Boolean)
      : []
    normalized.incoming = Array.isArray(normalized.incoming)
      ? normalized.incoming.map(normalizeSlug).filter(Boolean)
      : []
    normalized.related = Array.isArray(normalized.related)
      ? normalized.related
          .map((item) => ({ ...item, slug: normalizeSlug(item?.slug) }))
          .filter((item) => item.slug)
      : []
    normalized.sections = Array.isArray(normalized.sections)
      ? normalized.sections
          .map((section) => ({
            title: String(section?.title || ""),
            text: String(section?.text || ""),
          }))
          .filter((section) => section.title)
      : []
    normalized.degree = Number.isFinite(normalized.degree)
      ? normalized.degree
      : normalized.outgoing.length + normalized.incoming.length
    return normalized
  }

  function normalizePath(path) {
    return {
      id: String(path?.id || ""),
      title: String(path?.title || "Trilha sem título"),
      description: String(path?.description || ""),
      area: String(path?.area || "fundamentos"),
      areaLabel: String(path?.areaLabel || "Fundamentos da nutrição"),
      difficulty: path?.difficulty ? String(path.difficulty) : "",
      concepts: Array.isArray(path?.concepts)
        ? path.concepts.map(normalizeSlug).filter(Boolean)
        : [],
    }
  }

  async function fetchJson(filename) {
    const response = await fetch(staticPath(filename), { cache: "force-cache" })
    if (!response.ok) throw new Error("Não foi possível carregar " + filename)
    return response.json()
  }

  async function load() {
    if (data.index) return data
    if (!data.promise) {
      data.promise = Promise.all([
        fetchJson("atlas-index.json"),
        fetchJson("learning-paths.json").catch((error) => {
          data.pathsError = error
          console.warn("Trilhas de estudo indisponíveis", error)
          return []
        }),
      ])
        .then(([index, paths]) => {
          data.index = { ...(index || {}) }
          data.index.concepts = Array.isArray(data.index.concepts)
            ? data.index.concepts.map(normalizeNode)
            : []
          data.index.hubs = Array.isArray(data.index.hubs) ? data.index.hubs.map(normalizeNode) : []
          data.index.bridgeNodes = Array.isArray(data.index.bridgeNodes)
            ? data.index.bridgeNodes.map(normalizeNode)
            : []
          data.index.areas = Array.isArray(data.index.areas) ? data.index.areas : []
          data.index.components = Array.isArray(data.index.components) ? data.index.components : []
          data.index.gaps = Array.isArray(data.index.gaps) ? data.index.gaps : []
          data.bySlug = new Map(data.index.concepts.map((node) => [node.slug, node]))
          const pathItems = Array.isArray(paths)
            ? paths
            : Array.isArray(paths?.paths)
              ? paths.paths
              : []
          const areaLabels = new Map(data.index.areas.map((area) => [area.id, area.label]))
          data.paths = pathItems
            .map((path) =>
              normalizePath({ ...path, areaLabel: path?.areaLabel || areaLabels.get(path?.area) }),
            )
            .filter((path) => path.id && path.concepts.length)
          atlas.data.index = data.index
          atlas.data.paths = data.paths
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

  function pathById(id) {
    return data.paths.find((path) => path.id === id) || null
  }

  atlas.data = { ...data, load, get, concepts, pathById }
})()
