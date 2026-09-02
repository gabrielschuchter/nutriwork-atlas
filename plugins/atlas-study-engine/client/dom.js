;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})

  const iconPaths = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="m15 18-6-6 6-6"/><path d="M9 12h10"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    expand: '<path d="M8 3H3v5M3 3l6 6M16 21h5v-5M21 21l-6-6"/>',
    graph:
      '<circle cx="5" cy="12" r="2"/><circle cx="17" cy="5" r="2"/><circle cx="19" cy="18" r="2"/><path d="m6.8 11 8.3-5M6.8 13l10.4 4"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    moon: '<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2z"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.2"/><path d="m16 16 4 4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  }

  function normalizeSlug(value) {
    let raw = String(value || "")
      .trim()
      .replace(/\\/g, "/")
    try {
      raw = decodeURIComponent(raw)
    } catch {
      // Keep a partially encoded URL usable.
    }
    return raw
      .replace(/^\/+|\/+$/g, "")
      .replace(/\.(?:html?|md)$/i, "")
      .split("/")
      .filter(Boolean)
      .map((segment) => segment.replace(/\s+/g, "-").toLowerCase())
      .join("/")
  }

  function basePath() {
    return document.body?.dataset?.basepath || ""
  }

  function routeSlug() {
    return normalizeSlug(document.body?.dataset?.slug || "index") || "index"
  }

  function pathFor(slug) {
    let normalized = normalizeSlug(slug) || "index"
    const prefix = basePath().replace(/\/+$/, "")
    if (normalized === "index") return prefix + "/"
    if (normalized.endsWith("/index")) normalized = normalized.slice(0, -"/index".length)
    if (!normalized) return prefix + "/"
    const encoded = normalized
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/")
    return prefix + "/" + encoded
  }

  function staticPath(filename) {
    return pathFor("static/" + filename)
  }

  function isConcept(slugOrNode) {
    const slug = typeof slugOrNode === "string" ? slugOrNode : slugOrNode?.slug
    return normalizeSlug(slug).startsWith("atlas/")
  }

  function clear(node) {
    if (!node) return
    while (node.firstChild) node.removeChild(node.firstChild)
  }

  function make(tag, className, label) {
    const node = document.createElement(tag)
    if (className) node.className = className
    if (label !== undefined && label !== null) node.textContent = String(label)
    return node
  }

  function button(label, action, className) {
    const node = make("button", className || "atlas-button", label)
    node.type = "button"
    if (action) node.dataset.atlasAction = action
    return node
  }

  function link(nodeOrSlug, label, className) {
    const node =
      typeof nodeOrSlug === "string" ? { slug: nodeOrSlug, title: label } : nodeOrSlug || {}
    const anchor = make(
      "a",
      className || "atlas-note-link",
      label || node.title || "Abrir conceito",
    )
    anchor.href = pathFor(node.slug || "index")
    if (node.slug) anchor.dataset.atlasTarget = normalizeSlug(node.slug)
    return anchor
  }

  function svgIcon(name, className) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("viewBox", "0 0 24 24")
    svg.setAttribute("aria-hidden", "true")
    svg.setAttribute("focusable", "false")
    svg.setAttribute("class", className || "atlas-icon")
    svg.setAttribute("fill", "none")
    svg.setAttribute("stroke", "currentColor")
    svg.setAttribute("stroke-width", "1.7")
    svg.setAttribute("stroke-linecap", "round")
    svg.setAttribute("stroke-linejoin", "round")
    svg.innerHTML = iconPaths[name] || iconPaths.graph
    return svg
  }

  function setHidden(node, hidden) {
    if (!node) return
    node.hidden = hidden
    node.setAttribute("aria-hidden", String(hidden))
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value))
  }

  function hash(value) {
    let result = 2166136261
    for (let index = 0; index < String(value).length; index += 1) {
      result ^= String(value).charCodeAt(index)
      result = Math.imul(result, 16777619)
    }
    return (result >>> 0) / 4294967296
  }

  function focusable(container) {
    return [
      ...(container?.querySelectorAll(
        "button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])",
      ) || []),
    ].filter((item) => !item.disabled && !item.hidden && item.getClientRects().length > 0)
  }

  function searchMatch(node, query) {
    if (!query) return true
    const haystack = normalizeText([node.title, node.areaLabel, node.excerpt].join(" "))
    return normalizeText(query)
      .split(/\s+/)
      .filter(Boolean)
      .every((part) => haystack.includes(part))
  }

  atlas.dom = {
    basePath,
    button,
    clear,
    clamp,
    focusable,
    hash,
    isConcept,
    link,
    make,
    normalizeSlug,
    normalizeText,
    pathFor,
    routeSlug,
    searchMatch,
    setHidden,
    staticPath,
    svgIcon,
  }
})()
