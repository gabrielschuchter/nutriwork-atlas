export const atlasRuntime = String.raw`
(() => {
  const runtimeKey = "__nutriworkAtlasStudyRuntime";
  if (window[runtimeKey]) {
    window[runtimeKey].refresh();
    return;
  }

  const storageKey = "nutriwork-atlas-study-v1";
  const state = {
    index: null,
    dataPromise: null,
    bySlug: new Map(),
    graphState: new WeakMap(),
    searchState: new WeakMap(),
    visitRecordedFor: "",
    previewTimer: null,
    previewHideTimer: null,
  };

  const specialRoutes = {
    connected: "mais-conectados",
    gaps: "lacunas-da-rede",
    map: "mapa-do-atlas",
    structure: "estrutura-da-rede",
    favorites: "favoritos",
    recent: "recentes",
    search: "busca-avancada",
    graph: "grafo",
  };

  const normalizeText = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const normalizeSlug = (value) =>
    String(value || "")
      .trim()
      .replace(/\\/g, "/")
      .replace(/\.[a-z0-9]+$/i, "")
      .split("/")
      .filter(Boolean)
      .map((segment) =>
        segment
          .replace(/\s/g, "-")
          .replace(/&/g, "-and-")
          .replace(/%/g, "-percent")
          .replace(/[?#]/g, "")
          .replace(/[<>:"|*]/g, "")
          .toLowerCase(),
      )
      .join("/");

  const basePath = () => document.body?.dataset?.basepath || "";
  const currentSlug = () => normalizeSlug(document.body?.dataset?.slug || "index");
  const isConcept = (node) => Boolean(node?.slug && node.slug.startsWith("atlas/"));
  const currentNode = () => state.bySlug.get(currentSlug()) || null;
  const pathFor = (slug) => {
    const normalized = normalizeSlug(slug);
    const suffix = normalized === "index" ? "" : "/" + normalized;
    return (basePath() + suffix) || "/";
  };
  const staticPath = (name) => (basePath() + "/static/" + name).replace(/\/\/+/g, "/");

  function clear(element) {
    if (!element) return;
    while (element.firstChild) element.removeChild(element.firstChild);
  }

  function text(element, value) {
    if (element) element.textContent = value == null ? "" : String(value);
    return element;
  }

  function element(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value != null) node.textContent = value;
    return node;
  }

  function button(label, action, className) {
    const node = element("button", className || "atlas-button", label);
    node.type = "button";
    node.dataset.atlasAction = action;
    return node;
  }

  function linkFor(node, label) {
    const anchor = element("a", "internal atlas-study-link", label || node?.title || "Abrir nota");
    anchor.href = pathFor(node?.slug || "index");
    if (node?.slug) anchor.dataset.atlasTarget = node.slug;
    return anchor;
  }

  function formatDate(value) {
    if (!value) return "Data não informada";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
  }

  function formatVisit(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Visto recentemente";
    const elapsed = Date.now() - date.getTime();
    if (elapsed < 60 * 60 * 1000) return "Visto há pouco";
    if (elapsed < 24 * 60 * 60 * 1000) return "Visto hoje";
    return "Visto em " + new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
  }

  function readStore() {
    const fallback = { favorites: [], visited: [], focus: false };
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return {
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites.filter((slug) => typeof slug === "string") : [],
        visited: Array.isArray(parsed.visited)
          ? parsed.visited
              .filter((item) => item && typeof item.slug === "string" && Number.isFinite(item.seenAt))
              .slice(0, 24)
          : [],
        focus: parsed.focus === true,
      };
    } catch {
      return fallback;
    }
  }

  function writeStore(next) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      return;
    }
  }

  function updateStore(mutator) {
    const next = readStore();
    mutator(next);
    writeStore(next);
    return next;
  }

  function isFavorite(slug) {
    return readStore().favorites.includes(slug);
  }

  function navigate(slug) {
    const url = new URL(pathFor(slug), window.location.origin);
    if (typeof window.spaNavigate === "function") window.spaNavigate(url, false);
    else window.location.assign(url.toString());
  }

  async function loadIndex() {
    if (state.index) return state.index;
    if (!state.dataPromise) {
      state.dataPromise = fetch(staticPath("atlas-index.json"), { cache: "force-cache" })
        .then((response) => {
          if (!response.ok) throw new Error("Índice de estudo indisponível");
          return response.json();
        })
        .then((index) => {
          state.index = index;
          state.bySlug = new Map((index.concepts || []).map((node) => [node.slug, node]));
          return index;
        })
        .catch((error) => {
          console.error("Falha ao carregar os dados do Atlas", error);
          state.dataPromise = null;
          return null;
        });
    }
    return state.dataPromise;
  }

  function recordVisit() {
    const node = currentNode();
    if (!isConcept(node) || state.visitRecordedFor === node.slug) return;
    state.visitRecordedFor = node.slug;
    updateStore((stored) => {
      stored.visited = [
        { slug: node.slug, seenAt: Date.now() },
        ...stored.visited.filter((item) => item.slug !== node.slug),
      ].slice(0, 24);
    });
  }

  function addPageHeading(container, kicker, title, description) {
    clear(container);
    const header = element("header", "atlas-view-header");
    if (kicker) header.appendChild(element("p", "atlas-kicker", kicker));
    header.appendChild(element("h2", "atlas-view-title", title));
    if (description) header.appendChild(element("p", "atlas-view-description", description));
    container.appendChild(header);
    return container;
  }

  function metricCard(value, label, detail) {
    const card = element("article", "atlas-metric-card");
    card.appendChild(element("strong", "atlas-metric-value", value));
    card.appendChild(element("span", "atlas-metric-label", label));
    if (detail) card.appendChild(element("small", "atlas-metric-detail", detail));
    return card;
  }

  function conceptCard(node, options) {
    const card = element("article", "atlas-concept-card");
    const top = element("div", "atlas-concept-card-top");
    top.appendChild(linkFor(node));
    if (options?.badge) top.appendChild(element("span", "atlas-badge", options.badge));
    card.appendChild(top);
    if (node.areaLabel) card.appendChild(element("p", "atlas-card-area", node.areaLabel));
    if (options?.excerpt !== false && node.excerpt) card.appendChild(element("p", "atlas-card-excerpt", node.excerpt));
    const stats = element("div", "atlas-card-stats");
    stats.appendChild(element("span", "atlas-card-stat", node.degree + " conexões"));
    if (node.incomingCount != null) stats.appendChild(element("span", "atlas-card-stat", node.incomingCount + " recebidos"));
    card.appendChild(stats);
    return card;
  }

  function sectionBlock(title, actionLabel, action) {
    const section = element("section", "atlas-dashboard-section");
    const heading = element("div", "atlas-section-heading");
    heading.appendChild(element("h2", null, title));
    if (actionLabel && action) heading.appendChild(button(actionLabel, action, "atlas-text-button"));
    section.appendChild(heading);
    return section;
  }

  function renderHome(index) {
    const container = document.getElementById("atlas-home-dashboard");
    if (!container) return;
    clear(container);
    const stored = readStore();
    const intro = element("header", "atlas-dashboard-intro");
    intro.appendChild(element("p", "atlas-kicker", "NUTRIWORK ATLAS"));
    intro.appendChild(element("h2", null, "Seu próximo conceito começa aqui"));
    intro.appendChild(element("p", null, "Retome uma leitura, siga as relações mais fortes ou escolha uma área para continuar estudando."));
    const introActions = element("div", "atlas-action-row");
    introActions.appendChild(button("Conceito aleatório", "random", "atlas-button atlas-button-primary"));
    introActions.appendChild(button("Abrir o grafo", "graph", "atlas-button"));
    intro.appendChild(introActions);
    container.appendChild(intro);

    const recentNodes = stored.visited.map((item) => ({ node: state.bySlug.get(item.slug), item })).filter((entry) => entry.node);
    const recent = sectionBlock("Continuar explorando", "Ver todos", "recent");
    const recentGrid = element("div", "atlas-card-grid");
    if (recentNodes.length) {
      recentNodes.slice(0, 4).forEach(({ node, item }) => {
        const card = conceptCard(node, { badge: formatVisit(item.seenAt), excerpt: false });
        recentGrid.appendChild(card);
      });
    } else {
      const empty = element("p", "atlas-empty", "Suas próximas leituras aparecerão aqui depois que você abrir alguns conceitos.");
      recentGrid.appendChild(empty);
    }
    recent.appendChild(recentGrid);
    container.appendChild(recent);

    const hubs = sectionBlock("Conceitos mais conectados", "Abrir ranking", "connected");
    const hubGrid = element("div", "atlas-card-grid");
    (index.hubs || []).slice(0, 6).forEach((node) => hubGrid.appendChild(conceptCard(node, { excerpt: false })));
    hubs.appendChild(hubGrid);
    container.appendChild(hubs);

    const updated = sectionBlock("Recentemente atualizados", null, null);
    const recentUpdates = [...(index.concepts || [])]
      .sort((left, right) => (new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime()) || left.title.localeCompare(right.title, "pt-BR"))
      .slice(0, 5);
    const updateList = element("div", "atlas-list-grid");
    recentUpdates.forEach((node) => {
      const row = element("div", "atlas-list-row");
      row.appendChild(linkFor(node));
      row.appendChild(element("span", "atlas-list-meta", formatDate(node.updatedAt)));
      updateList.appendChild(row);
    });
    updated.appendChild(updateList);
    container.appendChild(updated);

    const areas = sectionBlock("Explorar por área", null, null);
    const areaGrid = element("div", "atlas-area-grid");
    (index.areas || []).forEach((area) => {
      const areaButton = button("", "advanced-search", "atlas-area-card");
      areaButton.dataset.atlasArea = area.id;
      areaButton.appendChild(element("strong", null, area.label));
      areaButton.appendChild(element("span", null, area.count + (area.count === 1 ? " conceito" : " conceitos")));
      areaGrid.appendChild(areaButton);
    });
    areas.appendChild(areaGrid);
    container.appendChild(areas);

    const footer = element("section", "atlas-dashboard-footer");
    footer.appendChild(element("p", "atlas-kicker", "MAPA DE ESTUDO"));
    footer.appendChild(element("p", null, "A rede cresce quando você segue uma relação de cada vez."));
    const links = element("div", "atlas-action-row");
    links.appendChild(button("Mapa do Atlas", "map", "atlas-button"));
    links.appendChild(button("Estrutura da rede", "structure", "atlas-button"));
    footer.appendChild(links);
    container.appendChild(footer);
  }

  function renderConnected(container, index) {
    addPageHeading(container, "RANKING DA REDE", "Conceitos mais conectados", "Veja quais conceitos têm mais relações no acervo e escolha por onde aprofundar.");
    const metrics = element("div", "atlas-metric-grid");
    metrics.appendChild(metricCard(index.metrics?.conceptCount || 0, "conceitos"));
    metrics.appendChild(metricCard(index.metrics?.connectionCount || 0, "conexões"));
    metrics.appendChild(metricCard(index.metrics?.areaCount || 0, "áreas"));
    container.appendChild(metrics);
    const list = element("div", "atlas-ranked-list");
    (index.hubs || []).forEach((node, position) => {
      const row = element("article", "atlas-ranked-row");
      row.appendChild(element("span", "atlas-rank", String(position + 1).padStart(2, "0")));
      const copy = element("div", "atlas-ranked-copy");
      copy.appendChild(linkFor(node));
      copy.appendChild(element("span", "atlas-card-area", node.areaLabel));
      row.appendChild(copy);
      const counts = element("div", "atlas-ranked-counts");
      counts.appendChild(element("strong", null, String(node.degree)));
      counts.appendChild(element("span", null, "grau total"));
      counts.appendChild(element("small", null, node.incomingCount + " recebidos · " + node.outgoingCount + " emitidos"));
      row.appendChild(counts);
      list.appendChild(row);
    });
    container.appendChild(list);
  }

  function renderGaps(container, index) {
    addPageHeading(container, "DIAGNÓSTICO DA REDE", "Lacunas da rede", "Referências que ainda não encontram uma nota correspondente no acervo.");
    const metrics = element("div", "atlas-metric-grid");
    metrics.appendChild(metricCard(index.metrics?.unresolvedTargetCount || 0, "conceitos citados"));
    metrics.appendChild(metricCard(index.metrics?.unresolvedOccurrenceCount || 0, "ocorrências"));
    container.appendChild(metrics);
    const list = element("div", "atlas-gap-list");
    (index.gaps || []).forEach((gap) => {
      const row = element("article", "atlas-gap-row");
      const heading = element("div", "atlas-gap-heading");
      heading.appendChild(element("strong", null, gap.title));
      heading.appendChild(element("span", "atlas-badge", gap.occurrences + (gap.occurrences === 1 ? " ocorrência" : " ocorrências")));
      row.appendChild(heading);
      row.appendChild(element("p", "atlas-card-excerpt", "Apontado por " + gap.sourceCount + (gap.sourceCount === 1 ? " nota" : " notas") + "."));
      const sources = element("div", "atlas-gap-sources");
      (gap.sources || []).slice(0, 8).forEach((source) => {
        const item = element("div", "atlas-gap-source");
        item.appendChild(linkFor(state.bySlug.get(source.slug) || { slug: source.slug, title: source.title }, source.title));
        item.appendChild(element("span", "atlas-list-meta", source.occurrences + (source.occurrences === 1 ? " vez" : " vezes")));
        if (source.contexts?.[0]) item.appendChild(element("p", "atlas-context-snippet", source.contexts[0]));
        sources.appendChild(item);
      });
      row.appendChild(sources);
      list.appendChild(row);
    });
    container.appendChild(list);
  }

  function renderMap(container, index) {
    addPageHeading(container, "VISÃO GERAL", "Mapa do Atlas", "Uma leitura rápida da escala, da densidade e dos caminhos da rede de conceitos.");
    const metrics = element("div", "atlas-metric-grid atlas-metric-grid-large");
    const metricItems = [
      [index.metrics?.conceptCount || 0, "conceitos"],
      [index.metrics?.connectionCount || 0, "conexões"],
      [index.metrics?.areaCount || 0, "áreas"],
      [index.metrics?.componentCount || 0, "componentes"],
      [index.metrics?.unresolvedTargetCount || 0, "lacunas"],
      [index.metrics?.isolatedCount || 0, "órfãos"],
      [index.metrics?.peripheralCount || 0, "periféricas"],
    ];
    metricItems.forEach(([value, label]) => metrics.appendChild(metricCard(value, label)));
    container.appendChild(metrics);

    const columns = element("div", "atlas-map-columns");
    const areaSection = sectionBlock("Áreas do acervo", null, null);
    const areaList = element("div", "atlas-map-list");
    (index.areas || []).forEach((area) => {
      const row = element("div", "atlas-map-list-row");
      row.appendChild(element("span", null, area.label));
      row.appendChild(element("strong", null, String(area.count)));
      areaList.appendChild(row);
    });
    areaSection.appendChild(areaList);
    columns.appendChild(areaSection);

    const hubSection = sectionBlock("Hubs da rede", "Ver ranking", "connected");
    const hubList = element("div", "atlas-map-list");
    (index.hubs || []).slice(0, 8).forEach((node) => {
      const row = element("div", "atlas-map-list-row");
      row.appendChild(linkFor(node));
      row.appendChild(element("strong", null, String(node.degree)));
      hubList.appendChild(row);
    });
    hubSection.appendChild(hubList);
    columns.appendChild(hubSection);
    container.appendChild(columns);

    const networkDetails = element("div", "atlas-map-columns");
    const peripheralSection = sectionBlock("Notas periféricas", null, null);
    const peripheralList = element("div", "atlas-chip-list");
    (index.concepts || [])
      .filter((node) => node.degree <= 1)
      .slice(0, 40)
      .forEach((node) => peripheralList.appendChild(linkFor(node)));
    peripheralSection.appendChild(
      peripheralList.childElementCount
        ? peripheralList
        : element("p", "atlas-empty", "Nenhuma nota periférica foi encontrada."),
    );
    networkDetails.appendChild(peripheralSection);

    const componentSection = sectionBlock("Componentes desconectados", null, null);
    const componentList = element("div", "atlas-map-list");
    (index.components || []).forEach((members, position) => {
      const row = element("div", "atlas-map-list-row atlas-component-row");
      const copy = element("div", "atlas-ranked-copy");
      copy.appendChild(
        element("strong", null, "Componente " + String(position + 1).padStart(2, "0")),
      );
      copy.appendChild(
        element(
          "span",
          "atlas-list-meta",
          members.length + (members.length === 1 ? " conceito" : " conceitos"),
        ),
      );
      const sample = element("div", "atlas-chip-list");
      members
        .slice(0, 3)
        .map((slug) => state.bySlug.get(slug))
        .filter(Boolean)
        .forEach((node) => sample.appendChild(linkFor(node)));
      copy.appendChild(sample);
      row.appendChild(copy);
      componentList.appendChild(row);
    });
    componentSection.appendChild(
      componentList.childElementCount
        ? componentList
        : element("p", "atlas-empty", "A rede forma um único componente."),
    );
    networkDetails.appendChild(componentSection);
    container.appendChild(networkDetails);

    const diagnostic = element("p", "atlas-search-summary");
    diagnostic.textContent =
      (index.metrics?.unresolvedOccurrenceCount || 0) +
      " ocorrências apontam para " +
      (index.metrics?.unresolvedTargetCount || 0) +
      " referências ainda sem nota correspondente.";
    container.appendChild(diagnostic);
  }

  function renderStructure(container, index) {
    addPageHeading(container, "TOPOLOGIA", "Estrutura da rede", "Encontre pontos de entrada, regiões pequenas e conceitos que conectam partes do acervo.");
    const metrics = element("div", "atlas-metric-grid");
    metrics.appendChild(metricCard(index.metrics?.isolatedCount || 0, "notas órfãs"));
    metrics.appendChild(metricCard(index.metrics?.oneConnectionCount || 0, "com 1 conexão"));
    metrics.appendChild(metricCard(index.metrics?.peripheralCount || 0, "notas periféricas"));
    metrics.appendChild(metricCard(index.metrics?.bridgeCount || 0, "pontes"));
    metrics.appendChild(metricCard(index.metrics?.componentCount || 0, "componentes"));
    container.appendChild(metrics);

    const columns = element("div", "atlas-map-columns");
    const orphans = sectionBlock("Notas órfãs", null, null);
    const orphanList = element("div", "atlas-chip-list");
    (index.concepts || []).filter((node) => node.degree === 0).forEach((node) => orphanList.appendChild(linkFor(node)));
    orphans.appendChild(orphanList.childElementCount ? orphanList : element("p", "atlas-empty", "Nenhuma nota órfã foi encontrada."));
    columns.appendChild(orphans);

    const oneLink = sectionBlock("Uma conexão", null, null);
    const oneLinkList = element("div", "atlas-chip-list");
    (index.concepts || []).filter((node) => node.degree === 1).slice(0, 40).forEach((node) => oneLinkList.appendChild(linkFor(node)));
    oneLink.appendChild(oneLinkList.childElementCount ? oneLinkList : element("p", "atlas-empty", "Nenhuma nota com apenas uma conexão."));
    columns.appendChild(oneLink);

    const bridges = sectionBlock("Conceitos ponte", null, null);
    const bridgeList = element("div", "atlas-card-grid");
    (index.bridgeNodes || []).slice(0, 12).forEach((node) => bridgeList.appendChild(conceptCard(node, { excerpt: false, badge: "ponte" })));
    bridges.appendChild(bridgeList.childElementCount ? bridgeList : element("p", "atlas-empty", "Nenhum ponto de articulação robusto foi identificado."));
    container.appendChild(columns);

    const componentSection = sectionBlock("Componentes desconectados", null, null);
    const componentList = element("div", "atlas-map-list");
    (index.components || []).forEach((members, position) => {
      const row = element("div", "atlas-map-list-row atlas-component-row");
      const copy = element("div", "atlas-ranked-copy");
      copy.appendChild(
        element("strong", null, "Componente " + String(position + 1).padStart(2, "0")),
      );
      copy.appendChild(
        element(
          "span",
          "atlas-list-meta",
          members.length + (members.length === 1 ? " conceito" : " conceitos"),
        ),
      );
      const sample = element("div", "atlas-chip-list");
      members
        .slice(0, 5)
        .map((slug) => state.bySlug.get(slug))
        .filter(Boolean)
        .forEach((node) => sample.appendChild(linkFor(node)));
      copy.appendChild(sample);
      row.appendChild(copy);
      componentList.appendChild(row);
    });
    componentSection.appendChild(
      componentList.childElementCount
        ? componentList
        : element("p", "atlas-empty", "A rede forma um único componente."),
    );
    container.appendChild(componentSection);
    container.appendChild(bridges);
  }

  function renderPersonalList(container, index, mode) {
    const isFavorites = mode === "favorites";
    const stored = readStore();
    addPageHeading(container, isFavorites ? "SEU ACERVO" : "SEU PERCURSO", isFavorites ? "Favoritos" : "Vistos recentemente", isFavorites ? "Guarde conceitos para revisitar quando quiser." : "Retome as notas que você abriu por último neste navegador.");
    const entries = isFavorites
      ? stored.favorites.map((slug) => ({ node: state.bySlug.get(slug) })).filter((entry) => entry.node)
      : stored.visited.map((item) => ({ node: state.bySlug.get(item.slug), item })).filter((entry) => entry.node);
    const grid = element("div", "atlas-card-grid atlas-card-grid-wide");
    if (!entries.length) {
      grid.appendChild(element("p", "atlas-empty", isFavorites ? "Você ainda não salvou nenhum conceito." : "Você ainda não abriu conceitos suficientes para criar um histórico."));
    } else {
      entries.forEach(({ node, item }) => grid.appendChild(conceptCard(node, { badge: item ? formatVisit(item.seenAt) : "salvo", excerpt: true })));
    }
    container.appendChild(grid);
  }

  function addSearchField(label, type, name, value, className) {
    const wrapper = element("label", "atlas-field " + (className || ""));
    wrapper.appendChild(element("span", null, label));
    const input = element(type === "select" ? "select" : "input");
    input.name = name;
    input.dataset.atlasSearchField = name;
    if (type !== "select") {
      input.type = type;
      if (value) input.value = value;
    }
    wrapper.appendChild(input);
    return { wrapper, input };
  }

  function searchMatches(node, query, field) {
    const haystack = field === "title" ? node.title : field === "content" ? node.text : node.title + " " + node.text;
    const normalized = normalizeText(haystack);
    return query.every((token) => normalized.includes(token));
  }

  function searchScore(node, query) {
    if (!query.length) return node.degree;
    const title = normalizeText(node.title);
    const content = normalizeText(node.text);
    return query.reduce((score, token) => score + (title.includes(token) ? 12 : 0) + (content.includes(token) ? 2 : 0), 0) + node.degree / 100;
  }

  function renderSearchResults(container, index) {
    const form = container.querySelector(".atlas-advanced-search-form");
    const results = container.querySelector(".atlas-advanced-search-results");
    if (!form || !results) return;
    const value = form.querySelector('[data-atlas-search-field="query"]')?.value || "";
    const query = normalizeText(value).split(/\s+/).filter(Boolean);
    const field = form.querySelector('[data-atlas-search-field="field"]')?.value || "all";
    const area = form.querySelector('[data-atlas-search-field="area"]')?.value || "all";
    const minDegree = Number(form.querySelector('[data-atlas-search-field="minDegree"]')?.value || 0);
    const updatedAfter = form.querySelector('[data-atlas-search-field="updatedAfter"]')?.value || "";
    const order = form.querySelector('[data-atlas-search-field="order"]')?.value || "relevance";
    let matches = (index.concepts || []).filter((node) => {
      if (area !== "all" && node.area !== area) return false;
      if (node.degree < minDegree) return false;
      if (updatedAfter && (!node.updatedAt || new Date(node.updatedAt) < new Date(updatedAfter))) return false;
      return searchMatches(node, query, field);
    });
    matches.sort((left, right) => {
      if (order === "connection") return right.degree - left.degree || left.title.localeCompare(right.title, "pt-BR");
      if (order === "recent") return new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0) || left.title.localeCompare(right.title, "pt-BR");
      if (order === "name") return left.title.localeCompare(right.title, "pt-BR");
      return searchScore(right, query) - searchScore(left, query) || left.title.localeCompare(right.title, "pt-BR");
    });
    clear(results);
    const summary = element("p", "atlas-search-summary", matches.length + (matches.length === 1 ? " conceito encontrado" : " conceitos encontrados"));
    results.appendChild(summary);
    if (!matches.length) {
      results.appendChild(element("p", "atlas-empty", "Ajuste os filtros ou tente outra busca."));
      return;
    }
    matches.slice(0, 100).forEach((node) => {
      const row = element("article", "atlas-search-result");
      const heading = element("div", "atlas-search-result-heading");
      heading.appendChild(linkFor(node));
      heading.appendChild(element("span", "atlas-badge", node.areaLabel));
      row.appendChild(heading);
      row.appendChild(element("p", "atlas-card-excerpt", node.excerpt));
      const meta = element("div", "atlas-card-stats");
      meta.appendChild(element("span", "atlas-card-stat", node.degree + " conexões"));
      meta.appendChild(element("span", "atlas-card-stat", "Atualizado " + formatDate(node.updatedAt)));
      row.appendChild(meta);
      results.appendChild(row);
    });
  }

  function renderAdvancedSearch(container, index) {
    addPageHeading(container, "BUSCA AVANÇADA", "Encontre um ponto de entrada", "Combine texto, área, conectividade e data para chegar à nota certa.");
    const form = element("form", "atlas-advanced-search-form");
    form.addEventListener("submit", (event) => event.preventDefault());
    const query = addSearchField("Buscar", "search", "query", "", "atlas-field-wide");
    query.input.placeholder = "Título ou conteúdo";
    form.appendChild(query.wrapper);
    const field = addSearchField("Onde procurar", "select", "field");
    [["all", "Título e conteúdo"], ["title", "Somente título"], ["content", "Somente conteúdo"]].forEach(([value, label]) => field.input.add(new Option(label, value)));
    form.appendChild(field.wrapper);
    const area = addSearchField("Área", "select", "area");
    area.input.add(new Option("Todas as áreas", "all"));
    (index.areas || []).forEach((item) => area.input.add(new Option(item.label, item.id)));
    form.appendChild(area.wrapper);
    const minDegree = addSearchField("Conectividade mínima", "select", "minDegree");
    [[0, "Qualquer"], [1, "1 ou mais"], [3, "3 ou mais"], [6, "6 ou mais"], [10, "10 ou mais"]].forEach(([value, label]) => minDegree.input.add(new Option(label, String(value))));
    form.appendChild(minDegree.wrapper);
    const updatedAfter = addSearchField("Atualizado desde", "date", "updatedAfter");
    form.appendChild(updatedAfter.wrapper);
    const order = addSearchField("Ordenar por", "select", "order");
    [["relevance", "Relevância"], ["connection", "Conectividade"], ["recent", "Mais recentes"], ["name", "Nome"]].forEach(([value, label]) => order.input.add(new Option(label, value)));
    form.appendChild(order.wrapper);
    container.appendChild(form);
    const results = element("section", "atlas-advanced-search-results");
    container.appendChild(results);
    const initialArea = new URLSearchParams(window.location.search).get("area");
    if (initialArea && [...area.input.options].some((option) => option.value === initialArea)) area.input.value = initialArea;
    const update = () => renderSearchResults(container, index);
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    update();
  }

  function createGraphMarkup(container) {
    if (container.querySelector(".atlas-graph-enhanced")) return container.querySelector(".atlas-graph-enhanced");
    const graph = element("section", "atlas-graph-enhanced");
    graph.setAttribute("aria-labelledby", "atlas-graph-title");
    const heading = element("div", "atlas-graph-heading");
    heading.appendChild(element("div", null, ""));
    heading.firstChild.appendChild(element("p", "atlas-kicker", "NAVEGAÇÃO VISUAL"));
    heading.firstChild.appendChild(element("h3", null, "Grafo do Atlas"));
    heading.appendChild(button("Tela cheia", "fullscreen-graph", "atlas-text-button"));
    graph.appendChild(heading);
    const controls = element("div", "atlas-graph-controls");
    const scope = element("label", "atlas-graph-control");
    scope.appendChild(element("span", null, "Visão"));
    const scopeInput = element("select");
    scopeInput.dataset.atlasGraphScope = "true";
    scopeInput.add(new Option("Local", "local"));
    scopeInput.add(new Option("Global", "global"));
    scope.appendChild(scopeInput);
    controls.appendChild(scope);
    const depth = element("div", "atlas-graph-depth");
    depth.appendChild(element("span", null, "Profundidade"));
    [1, 2, 3].forEach((value) => {
      const control = button(String(value), "graph-depth", "atlas-graph-depth-button");
      control.dataset.atlasGraphDepth = String(value);
      depth.appendChild(control);
    });
    controls.appendChild(depth);
    const area = element("label", "atlas-graph-control atlas-graph-area");
    area.appendChild(element("span", null, "Área"));
    const areaInput = element("select");
    areaInput.dataset.atlasGraphArea = "true";
    area.appendChild(areaInput);
    controls.appendChild(area);
    const search = element("label", "atlas-graph-control atlas-graph-node-search");
    search.appendChild(element("span", null, "Buscar nó"));
    const searchInput = element("input");
    searchInput.type = "search";
    searchInput.placeholder = "Digite um conceito";
    searchInput.dataset.atlasGraphSearch = "true";
    search.appendChild(searchInput);
    controls.appendChild(search);
    controls.appendChild(button("Recentralizar", "recenter-graph", "atlas-button atlas-button-small"));
    graph.appendChild(controls);
    const canvas = element("div", "atlas-graph-canvas");
    canvas.dataset.atlasGraphCanvas = "true";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 820 500");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Relações entre conceitos");
    svg.dataset.atlasGraphSvg = "true";
    canvas.appendChild(svg);
    canvas.appendChild(element("p", "atlas-graph-empty", "Nenhum conceito corresponde aos filtros."));
    graph.appendChild(canvas);
    const legend = element("div", "atlas-graph-legend");
    legend.appendChild(element("span", null, "Legenda:"));
    legend.appendChild(element("span", "atlas-legend-item atlas-legend-current", "Nota atual"));
    legend.appendChild(element("span", "atlas-legend-item atlas-legend-hub", "Hub"));
    legend.appendChild(element("span", "atlas-legend-item atlas-legend-node", "Conceito"));
    graph.appendChild(legend);
    container.appendChild(graph);
    return graph;
  }

  function renderGraph(graph, index) {
    const current = currentNode();
    const stored = state.graphState.get(graph) || { scope: "local", depth: 2, area: "all", query: "" };
    state.graphState.set(graph, stored);
    const scope = graph.querySelector("[data-atlas-graph-scope]");
    const area = graph.querySelector("[data-atlas-graph-area]");
    const search = graph.querySelector("[data-atlas-graph-search]");
    if (scope) scope.value = stored.scope;
    if (search) search.value = stored.query;
    if (area && !area.dataset.ready) {
      area.add(new Option("Todas as áreas", "all"));
      (index.areas || []).forEach((item) => area.add(new Option(item.label, item.id)));
      area.dataset.ready = "true";
    }
    if (area) area.value = stored.area;
    graph.querySelectorAll("[data-atlas-graph-depth]").forEach((control) => control.classList.toggle("is-active", control.dataset.atlasGraphDepth === String(stored.depth)));
    const adjacent = new Map((index.concepts || []).map((node) => [node.slug, new Set([...(node.outgoing || []), ...(node.incoming || [])])]));
    const allowed = new Set();
    if (stored.scope === "local" && current) {
      const queue = [{ slug: current.slug, level: 0 }];
      allowed.add(current.slug);
      while (queue.length) {
        const item = queue.shift();
        if (item.level >= stored.depth) continue;
        for (const next of adjacent.get(item.slug) || []) {
          if (allowed.has(next)) continue;
          allowed.add(next);
          queue.push({ slug: next, level: item.level + 1 });
        }
      }
    } else {
      (index.concepts || []).slice().sort((left, right) => right.degree - left.degree || left.title.localeCompare(right.title, "pt-BR")).slice(0, 180).forEach((node) => allowed.add(node.slug));
    }
    const query = normalizeText(stored.query);
    const visible = (index.concepts || []).filter((node) => allowed.has(node.slug) && (stored.area === "all" || node.area === stored.area) && (!query || normalizeText(node.title).includes(query))).slice(0, 180);
    const visibleSlugs = new Set(visible.map((node) => node.slug));
    const svg = graph.querySelector("[data-atlas-graph-svg]");
    const empty = graph.querySelector(".atlas-graph-empty");
    if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (!visible.length) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    const center = { x: 410, y: 250 };
    const positions = new Map();
    const centerNode = current && visibleSlugs.has(current.slug) ? current : visible[0];
    positions.set(centerNode.slug, center);
    const others = visible.filter((node) => node.slug !== centerNode.slug).sort((left, right) => right.degree - left.degree || left.title.localeCompare(right.title, "pt-BR"));
    const radius = Math.min(210, Math.max(105, 25 + others.length * 3.2));
    others.forEach((node, indexValue) => {
      const angle = -Math.PI / 2 + (indexValue / Math.max(others.length, 1)) * Math.PI * 2;
      positions.set(node.slug, { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius });
    });
    const ns = "http://www.w3.org/2000/svg";
    const linkGroup = document.createElementNS(ns, "g");
    linkGroup.setAttribute("class", "atlas-graph-links");
    (index.edges || []).forEach((edge) => {
      if (!visibleSlugs.has(edge.source) || !visibleSlugs.has(edge.target)) return;
      const from = positions.get(edge.source);
      const to = positions.get(edge.target);
      if (!from || !to) return;
      const line = document.createElementNS(ns, "line");
      line.setAttribute("x1", String(from.x));
      line.setAttribute("y1", String(from.y));
      line.setAttribute("x2", String(to.x));
      line.setAttribute("y2", String(to.y));
      line.setAttribute("class", "atlas-graph-edge");
      line.setAttribute("data-occurrences", String(edge.occurrences));
      linkGroup.appendChild(line);
    });
    svg.appendChild(linkGroup);
    const nodeGroup = document.createElementNS(ns, "g");
    nodeGroup.setAttribute("class", "atlas-graph-nodes");
    const hubSlugs = new Set((index.hubs || []).slice(0, 12).map((node) => node.slug));
    visible.forEach((node) => {
      const point = positions.get(node.slug);
      if (!point) return;
      const group = document.createElementNS(ns, "g");
      const classes = ["atlas-graph-node"];
      if (node.slug === current?.slug) classes.push("is-current");
      if (hubSlugs.has(node.slug)) classes.push("is-hub");
      if (query && normalizeText(node.title).includes(query)) classes.push("is-match");
      group.setAttribute("class", classes.join(" "));
      group.setAttribute("transform", "translate(" + point.x + " " + point.y + ")");
      group.setAttribute("tabindex", "0");
      group.setAttribute("role", "link");
      group.setAttribute("aria-label", node.title + ", " + node.degree + " conexões");
      group.dataset.atlasTarget = node.slug;
      const circle = document.createElementNS(ns, "circle");
      circle.setAttribute("r", node.slug === current?.slug ? "13" : hubSlugs.has(node.slug) ? "10" : "7");
      group.appendChild(circle);
      const label = document.createElementNS(ns, "text");
      label.setAttribute("x", "16");
      label.setAttribute("y", "4");
      label.textContent = node.title.length > 28 ? node.title.slice(0, 27) + "…" : node.title;
      group.appendChild(label);
      group.addEventListener("click", () => navigate(node.slug));
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate(node.slug);
        }
      });
      nodeGroup.appendChild(group);
    });
    svg.appendChild(nodeGroup);
  }

  function renderGraphPage(container, index) {
    clear(container);
    addPageHeading(container, "NAVEGAÇÃO VISUAL", "Grafo do Atlas", "Use a visão local para estudar a partir da nota atual ou a visão global para reconhecer a forma da rede.");
    const graph = createGraphMarkup(container);
    renderGraph(graph, index);
  }

  function renderView(index) {
    const container = document.querySelector("#atlas-view[data-view]");
    if (!container || container.dataset.renderedFor === currentSlug()) return;
    const view = container.dataset.view;
    container.dataset.renderedFor = currentSlug();
    if (view === "connected") renderConnected(container, index);
    else if (view === "gaps") renderGaps(container, index);
    else if (view === "map") renderMap(container, index);
    else if (view === "structure") renderStructure(container, index);
    else if (view === "favorites") renderPersonalList(container, index, "favorites");
    else if (view === "recent") renderPersonalList(container, index, "recent");
    else if (view === "search") renderAdvancedSearch(container, index);
    else if (view === "graph") renderGraphPage(container, index);
  }

  function renderContextPanel(index) {
    const panel = document.getElementById("atlas-context-panel");
    if (!panel) return;
    const node = currentNode();
    const active = panel.dataset.activeTab || "summary";
    panel.querySelectorAll("[data-atlas-context-tab]").forEach((tab) => {
      const selected = tab.dataset.atlasContextTab === active;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });
    panel.querySelectorAll("[data-atlas-context-content]").forEach((content) => {
      content.hidden = content.dataset.atlasContextContent !== active;
    });
    const summary = panel.querySelector('[data-atlas-context-content="summary"]');
    if (summary && !summary.dataset.ready) {
      clear(summary);
      const toc = document.querySelector(".toc");
      if (toc) {
        const list = element("div", "atlas-context-list");
        toc.querySelectorAll("a").forEach((anchor) => {
          const clone = anchor.cloneNode(true);
          clone.className = "atlas-context-link";
          list.appendChild(clone);
        });
        summary.appendChild(list);
      } else summary.appendChild(element("p", "atlas-empty", "Esta nota não possui sumário."));
      summary.dataset.ready = "true";
    }
    const backlinks = panel.querySelector('[data-atlas-context-content="backlinks"]');
    if (backlinks) {
      clear(backlinks);
      const incoming = (index.edges || []).filter((edge) => edge.target === node?.slug);
      if (!incoming.length) backlinks.appendChild(element("p", "atlas-empty", "Nenhuma nota aponta para este conceito."));
      incoming
        .sort((left, right) => (state.bySlug.get(right.source)?.degree || 0) - (state.bySlug.get(left.source)?.degree || 0))
        .forEach((edge) => {
          const source = state.bySlug.get(edge.source);
          if (!source) return;
          const item = element("article", "atlas-context-item");
          item.appendChild(linkFor(source));
          item.appendChild(element("span", "atlas-card-area", source.areaLabel));
          (edge.contexts || []).slice(0, 1).forEach((context) => item.appendChild(element("p", "atlas-context-snippet", context.context)));
          backlinks.appendChild(item);
        });
    }
    const relations = panel.querySelector('[data-atlas-context-content="relations"]');
    if (relations) {
      clear(relations);
      if (!node) relations.appendChild(element("p", "atlas-empty", "Abra um conceito para ver suas relações."));
      else {
        const relationList = element("div", "atlas-context-list");
        (node.related || []).slice(0, 12).forEach((relation) => {
          const relatedNode = state.bySlug.get(relation.slug);
          if (!relatedNode) return;
          const item = element("article", "atlas-context-item");
          item.appendChild(linkFor(relatedNode));
          item.appendChild(element("span", "atlas-card-area", relation.basis));
          relationList.appendChild(item);
        });
        relations.appendChild(relationList.childElementCount ? relationList : element("p", "atlas-empty", "Nenhuma relação encontrada."));
      }
    }
    const graphContent = panel.querySelector('[data-atlas-context-content="graph"]');
    if (graphContent) {
      clear(graphContent);
      graphContent.appendChild(element("p", "atlas-card-excerpt", "Estude a vizinhança da nota atual e alterne para a rede inteira quando quiser."));
      graphContent.appendChild(button("Focar o grafo", "focus-graph", "atlas-button atlas-button-small"));
    }
    const recent = panel.querySelector('[data-atlas-context-content="recent"]');
    if (recent) renderContextList(recent, readStore().visited.map((item) => state.bySlug.get(item.slug)).filter(Boolean), "Nenhum conceito recente.");
    const favorites = panel.querySelector('[data-atlas-context-content="favorites"]');
    if (favorites) renderContextList(favorites, readStore().favorites.map((slug) => state.bySlug.get(slug)).filter(Boolean), "Nenhum favorito salvo.");
  }

  function renderContextList(container, nodes, emptyText) {
    clear(container);
    if (!nodes.length) {
      container.appendChild(element("p", "atlas-empty", emptyText));
      return;
    }
    const list = element("div", "atlas-context-list");
    nodes.slice(0, 10).forEach((node) => list.appendChild(linkFor(node)));
    container.appendChild(list);
  }

  function renderActions() {
    const node = currentNode();
    document.querySelectorAll(".atlas-study-actions").forEach((actions) => {
      const favorite = actions.querySelector('[data-atlas-action="favorite"]');
      if (favorite) text(favorite, isFavorite(node?.slug) ? "Remover dos favoritos" : "Salvar nos favoritos");
      const focus = actions.querySelector('[data-atlas-action="focus"]');
      if (focus) text(focus, document.documentElement.classList.contains("atlas-focus-mode") ? "Sair do modo foco" : "Modo foco");
    });
  }

  function renderExplorer(index) {
    document.querySelectorAll(".explorer").forEach((explorer) => {
      if (explorer.querySelector(".atlas-explorer-controls")) return;
      const controls = element("div", "atlas-explorer-controls");
      const search = element("input");
      search.type = "search";
      search.placeholder = "Filtrar conceitos";
      search.setAttribute("aria-label", "Filtrar conceitos");
      search.dataset.atlasExplorerSearch = "true";
      controls.appendChild(search);
      const sort = element("select");
      sort.setAttribute("aria-label", "Ordenar conceitos");
      sort.dataset.atlasExplorerSort = "true";
      [["name", "Nome"], ["degree", "Conectividade"], ["recent", "Atualização"]].forEach(([value, label]) => sort.add(new Option(label, value)));
      controls.appendChild(sort);
      const area = element("select");
      area.setAttribute("aria-label", "Filtrar por área");
      area.dataset.atlasExplorerArea = "true";
      area.add(new Option("Todas as áreas", "all"));
      (index.areas || []).forEach((item) => area.add(new Option(item.label, item.id)));
      controls.appendChild(area);
      const anchor = explorer.querySelector(".desktop-explorer") || explorer.querySelector(".mobile-explorer");
      if (anchor) anchor.insertAdjacentElement("afterend", controls);
      else explorer.prepend(controls);
    });
    applyExplorerFilters(index);
  }

  function applyExplorerFilters(index) {
    document.querySelectorAll(".explorer").forEach((explorer) => {
      const query = normalizeText(explorer.querySelector("[data-atlas-explorer-search]")?.value || "");
      const sort = explorer.querySelector("[data-atlas-explorer-sort]")?.value || "name";
      const area = explorer.querySelector("[data-atlas-explorer-area]")?.value || "all";
      const list = explorer.querySelector(".explorer-ul");
      if (!list) return;
      const items = [...list.querySelectorAll(":scope > li")].filter((item) => item.querySelector(":scope > a"));
      const visible = [];
      items.forEach((item) => {
        const anchor = item.querySelector(":scope > a");
        const target = normalizeSlug(anchor?.getAttribute("href") || "");
        const node = state.bySlug.get(target);
        const matches = node && (!query || normalizeText(node.title).includes(query)) && (area === "all" || node.area === area);
        item.hidden = !matches;
        if (matches) visible.push({ item, node });
      });
      visible.sort((left, right) => {
        if (sort === "degree") return right.node.degree - left.node.degree || left.node.title.localeCompare(right.node.title, "pt-BR");
        if (sort === "recent") return new Date(right.node.updatedAt || 0) - new Date(left.node.updatedAt || 0) || left.node.title.localeCompare(right.node.title, "pt-BR");
        return left.node.title.localeCompare(right.node.title, "pt-BR");
      });
      visible.forEach(({ item }) => list.appendChild(item));
    });
  }

  function toggleFavorite() {
    const node = currentNode();
    if (!isConcept(node)) return;
    updateStore((stored) => {
      stored.favorites = stored.favorites.includes(node.slug)
        ? stored.favorites.filter((slug) => slug !== node.slug)
        : [node.slug, ...stored.favorites];
    });
    renderActions();
    if (state.index) renderContextPanel(state.index);
  }

  function toggleFocus() {
    const active = document.documentElement.classList.toggle("atlas-focus-mode");
    updateStore((stored) => {
      stored.focus = active;
    });
    renderActions();
  }

  function closeOverlays() {
    document.querySelectorAll("#atlas-command-palette, #atlas-advanced-search-modal").forEach((modal) => {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
    });
    hidePreview();
  }

  function openAdvancedSearch(areaId) {
    const modal = document.getElementById("atlas-advanced-search-modal");
    const content = document.getElementById("atlas-advanced-search-modal-content");
    if (!modal || !content || !state.index) return;
    clear(content);
    const wrapper = element("div", "atlas-view atlas-modal-view");
    wrapper.dataset.view = "search";
    content.appendChild(wrapper);
    renderAdvancedSearch(wrapper, state.index);
    if (areaId) {
      const field = wrapper.querySelector('[data-atlas-search-field="area"]');
      if (field) field.value = areaId;
      renderSearchResults(wrapper, state.index);
    }
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    modal.querySelector("input")?.focus();
  }

  function commandList(query) {
    const node = currentNode();
    const commands = [
      { label: "Ir para o início", hint: "Página de estudo", run: () => navigate("index") },
      { label: "Abrir o grafo", hint: "Visão local e global", run: () => navigate(specialRoutes.graph) },
      { label: "Conceito aleatório", hint: "Escolher uma nota do acervo", run: randomConcept },
      { label: "Conceitos mais conectados", hint: "Ranking da rede", run: () => navigate(specialRoutes.connected) },
      { label: "Favoritos", hint: "Notas salvas neste navegador", run: () => navigate(specialRoutes.favorites) },
      { label: "Vistos recentemente", hint: "Retomar sua sequência", run: () => navigate(specialRoutes.recent) },
      { label: "Busca avançada", hint: "Combinar filtros", run: () => openAdvancedSearch() },
      { label: "Alternar tema", hint: "Claro ou escuro", run: () => document.querySelector(".darkmode")?.click() },
    ];
    if (node) commands.splice(2, 0, { label: "Abrir links recebidos", hint: "Notas que apontam para este conceito", run: () => selectContextTab("backlinks") });
    const normalized = normalizeText(query);
    return commands.filter((command) => !normalized || normalizeText(command.label + " " + command.hint).includes(normalized));
  }

  function openPalette() {
    const modal = document.getElementById("atlas-command-palette");
    const input = document.getElementById("atlas-command-input");
    if (!modal || !input) return;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    input.value = "";
    renderPaletteResults("");
    input.focus();
  }

  function renderPaletteResults(query) {
    const results = document.getElementById("atlas-command-results");
    if (!results) return;
    clear(results);
    const commands = commandList(query);
    commands.forEach((command, index) => {
      const item = button("", "palette-command", "atlas-command-item");
      item.dataset.atlasCommandIndex = String(index);
      item.__atlasRun = command.run;
      item.appendChild(element("strong", null, command.label));
      item.appendChild(element("span", null, command.hint));
      results.appendChild(item);
    });
    if (!commands.length) results.appendChild(element("p", "atlas-empty", "Nenhum comando encontrado."));
  }

  function randomConcept() {
    const concepts = state.index?.concepts || [];
    if (!concepts.length) return;
    const random = new Uint32Array(1);
    try {
      crypto.getRandomValues(random);
    } catch {
      random[0] = Math.floor(Math.random() * 0xffffffff);
    }
    navigate(concepts[random[0] % concepts.length].slug);
  }

  function selectContextTab(tab) {
    const panel = document.getElementById("atlas-context-panel");
    if (!panel) return;
    panel.dataset.activeTab = tab;
    panel.dataset.open = "true";
    panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    if (state.index) renderContextPanel(state.index);
  }

  function openGraphFocus(graph) {
    const target = graph || document.querySelector(".atlas-graph-enhanced");
    if (!target) {
      navigate(specialRoutes.graph);
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    if (target.requestFullscreen) target.requestFullscreen().catch(() => target.classList.add("is-fullscreen"));
    else target.classList.add("is-fullscreen");
  }

  function hidePreview() {
    if (state.previewTimer) clearTimeout(state.previewTimer);
    if (state.previewHideTimer) clearTimeout(state.previewHideTimer);
    state.previewTimer = null;
    const preview = document.getElementById("atlas-link-preview");
    if (preview) preview.hidden = true;
  }

  function schedulePreview(anchor) {
    if (state.previewTimer) clearTimeout(state.previewTimer);
    state.previewTimer = setTimeout(() => showPreview(anchor), 140);
  }

  function previewPosition(preview, anchor) {
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 24);
    preview.style.width = width + "px";
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
    const top = rect.bottom + 10 + 260 > window.innerHeight ? Math.max(12, rect.top - 270) : rect.bottom + 10;
    preview.style.left = left + "px";
    preview.style.top = top + "px";
  }

  function showPreview(anchor) {
    const slug = anchor?.dataset?.atlasTarget;
    const node = state.bySlug.get(slug);
    const preview = document.getElementById("atlas-link-preview");
    if (!node || !preview) return;
    clear(preview);
    const header = element("div", "atlas-preview-heading");
    header.appendChild(element("p", "atlas-kicker", node.areaLabel));
    header.appendChild(element("strong", null, node.title));
    preview.appendChild(header);
    preview.appendChild(element("p", "atlas-preview-excerpt", node.excerpt));
    const stats = element("div", "atlas-card-stats");
    stats.appendChild(element("span", "atlas-card-stat", node.degree + " conexões"));
    stats.appendChild(element("span", "atlas-card-stat", node.incomingCount + " recebidos"));
    preview.appendChild(stats);
    const relations = element("div", "atlas-preview-relations");
    (node.related || []).slice(0, 3).forEach((relation) => {
      const related = state.bySlug.get(relation.slug);
      if (related) relations.appendChild(linkFor(related));
    });
    if (relations.childElementCount) {
      relations.insertBefore(element("span", "atlas-preview-label", "Relações próximas"), relations.firstChild);
      preview.appendChild(relations);
    }
    const actions = element("div", "atlas-action-row");
    const open = linkFor(node, "Abrir nota");
    open.className = "atlas-button atlas-button-primary";
    actions.appendChild(open);
    const panelButton = button("Abrir no painel", "preview-panel", "atlas-button");
    panelButton.dataset.atlasTarget = node.slug;
    actions.appendChild(panelButton);
    preview.appendChild(actions);
    preview.hidden = false;
    previewPosition(preview, anchor);
  }

  function enhanceLinks() {
    document.querySelectorAll("a.internal").forEach((anchor) => {
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const url = new URL(anchor.href, window.location.origin);
      const target = normalizeSlug(url.pathname.replace(basePath(), ""));
      const node = state.bySlug.get(target);
      if (!node) return;
      anchor.dataset.atlasTarget = node.slug;
      anchor.dataset.noPopover = "true";
    });
  }

  function handleClick(event) {
    const target = event.target instanceof Element ? event.target.closest("[data-atlas-action]") : null;
    if (!target) return;
    const action = target.dataset.atlasAction;
    if (action === "favorite") toggleFavorite();
    else if (action === "focus") toggleFocus();
    else if (action === "random") randomConcept();
    else if (action === "palette") openPalette();
    else if (action === "advanced-search") openAdvancedSearch(target.dataset.atlasArea);
    else if (action === "connected") navigate(specialRoutes.connected);
    else if (action === "recent") navigate(specialRoutes.recent);
    else if (action === "favorites") navigate(specialRoutes.favorites);
    else if (action === "map") navigate(specialRoutes.map);
    else if (action === "structure") navigate(specialRoutes.structure);
    else if (action === "graph") navigate(specialRoutes.graph);
    else if (action === "focus-graph") openGraphFocus();
    else if (action === "toggle-context") {
      const panel = document.getElementById("atlas-context-panel");
      if (panel) {
        panel.dataset.open = panel.dataset.open === "true" ? "false" : "true";
        text(target, panel.dataset.open === "true" ? "Ocultar painel" : "Mostrar painel");
      }
    }
    else if (action === "fullscreen-graph") openGraphFocus(target.closest(".atlas-graph-enhanced"));
    else if (action === "recenter-graph") {
      const graph = target.closest(".atlas-graph-enhanced");
      if (graph) {
        const graphState = state.graphState.get(graph) || { scope: "local", depth: 2, area: "all", query: "" };
        graphState.scope = "local";
        graphState.query = "";
        state.graphState.set(graph, graphState);
        renderGraph(graph, state.index);
      }
    } else if (action === "graph-depth") {
      const graph = target.closest(".atlas-graph-enhanced");
      if (graph) {
        const graphState = state.graphState.get(graph) || { scope: "local", depth: 2, area: "all", query: "" };
        graphState.depth = Number(target.dataset.atlasGraphDepth) || 2;
        state.graphState.set(graph, graphState);
        renderGraph(graph, state.index);
      }
    } else if (action === "palette-command") {
      if (typeof target.__atlasRun === "function") target.__atlasRun();
      closeOverlays();
    } else if (action === "preview-panel") {
      event.preventDefault();
      hidePreview();
      selectContextTab("relations");
    } else if (action === "close-palette" || action === "close-advanced") closeOverlays();
    if (["palette", "advanced-search", "connected", "recent", "favorites", "map", "structure", "graph", "focus-graph", "toggle-context", "fullscreen-graph", "recenter-graph", "graph-depth", "palette-command", "preview-panel", "close-palette", "close-advanced"].includes(action)) event.preventDefault();
  }

  function handleContextClick(event) {
    const target = event.target instanceof Element ? event.target.closest("[data-atlas-context-tab]") : null;
    if (!target) return;
    const panel = target.closest("#atlas-context-panel");
    if (!panel) return;
    panel.dataset.activeTab = target.dataset.atlasContextTab || "summary";
    panel.dataset.open = "true";
    if (state.index) renderContextPanel(state.index);
  }

  function handleChange(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.matches("[data-atlas-graph-scope], [data-atlas-graph-area]")) {
      const graph = target.closest(".atlas-graph-enhanced");
      if (graph) {
        const graphState = state.graphState.get(graph) || { scope: "local", depth: 2, area: "all", query: "" };
        if (target.matches("[data-atlas-graph-scope]")) graphState.scope = target.value;
        else graphState.area = target.value;
        state.graphState.set(graph, graphState);
        renderGraph(graph, state.index);
      }
    }
    if (target.matches("[data-atlas-explorer-sort], [data-atlas-explorer-area]")) applyExplorerFilters(state.index);
  }

  function handleInput(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.matches("[data-atlas-graph-search]")) {
      const graph = target.closest(".atlas-graph-enhanced");
      if (graph) {
        const graphState = state.graphState.get(graph) || { scope: "local", depth: 2, area: "all", query: "" };
        graphState.query = target.value;
        state.graphState.set(graph, graphState);
        renderGraph(graph, state.index);
      }
    }
    if (target.matches("[data-atlas-explorer-search]")) applyExplorerFilters(state.index);
  }

  function handleKeydown(event) {
    const target = event.target;
    const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      event.stopImmediatePropagation();
      const palette = document.getElementById("atlas-command-palette");
      if (palette && !palette.hidden) closeOverlays();
      else openPalette();
      return;
    }
    if (typing) {
      if (event.key === "Escape") closeOverlays();
      return;
    }
    if (event.key === "Escape") {
      const hasOpenOverlay = [...document.querySelectorAll("#atlas-command-palette, #atlas-advanced-search-modal")].some((modal) => !modal.hidden);
      const hasFullscreenGraph = Boolean(document.fullscreenElement || document.querySelector(".atlas-graph-enhanced.is-fullscreen"));
      closeOverlays();
      document.querySelectorAll(".atlas-graph-enhanced.is-fullscreen").forEach((graph) => graph.classList.remove("is-fullscreen"));
      if (!hasOpenOverlay && !hasFullscreenGraph && document.documentElement.classList.contains("atlas-focus-mode")) toggleFocus();
      return;
    }
    if (event.key === "/") {
      event.preventDefault();
      document.querySelector(".search-button")?.click();
      window.setTimeout(() => document.querySelector(".search-bar")?.focus(), 0);
      return;
    }
    const key = event.key.toLowerCase();
    if (key === "g") openGraphFocus();
    else if (key === "b") selectContextTab("backlinks");
    else if (key === "f") toggleFavorite();
    else if (key === "r") randomConcept();
  }

  function handlePointerOver(event) {
    const anchor = event.target instanceof Element ? event.target.closest("a.internal[data-atlas-target]") : null;
    if (!anchor || (event.relatedTarget instanceof Node && anchor.contains(event.relatedTarget))) return;
    schedulePreview(anchor);
  }

  function handlePointerOut(event) {
    const anchor = event.target instanceof Element ? event.target.closest("a.internal[data-atlas-target]") : null;
    const preview = document.getElementById("atlas-link-preview");
    if (!anchor || (event.relatedTarget instanceof Node && (anchor.contains(event.relatedTarget) || preview?.contains(event.relatedTarget)))) return;
    if (state.previewHideTimer) clearTimeout(state.previewHideTimer);
    state.previewHideTimer = setTimeout(hidePreview, 160);
  }

  function applyFocusFromStore() {
    document.documentElement.classList.toggle("atlas-focus-mode", readStore().focus === true);
  }

  function bindStaticEvents() {
    if (state.bound) return;
    state.bound = true;
    document.addEventListener("click", handleClick);
    document.addEventListener("click", handleContextClick);
    document.addEventListener("change", handleChange);
    document.addEventListener("input", handleInput);
    document.addEventListener("keydown", handleKeydown, true);
    document.addEventListener("mouseover", handlePointerOver);
    document.addEventListener("mouseout", handlePointerOut);
    document.addEventListener("focusin", (event) => {
      const anchor = event.target instanceof Element ? event.target.closest("a.internal[data-atlas-target]") : null;
      if (anchor) schedulePreview(anchor);
    });
    document.addEventListener("focusout", hidePreview);
    document.addEventListener("fullscreenchange", () => {
      document.querySelectorAll(".atlas-graph-enhanced").forEach((graph) => {
        graph.classList.toggle("is-fullscreen", document.fullscreenElement === graph);
      });
    });
  }

  async function refresh() {
    bindStaticEvents();
    applyFocusFromStore();
    const index = await loadIndex();
    if (!index) return;
    recordVisit();
    enhanceLinks();
    renderActions();
    renderHome(index);
    renderView(index);
    renderExplorer(index);
    document.querySelectorAll(".atlas-graph-mount").forEach((mount) => {
      const graph = createGraphMarkup(mount);
      renderGraph(graph, index);
    });
    document.querySelectorAll(".atlas-graph-enhanced").forEach((graph) => renderGraph(graph, index));
    renderContextPanel(index);
    document.querySelectorAll(".binder-close").forEach((close) => {
      const title = close.closest(".binder-tab")?.querySelector(".binder-label")?.textContent || "página";
      close.setAttribute("aria-label", "Fechar " + title);
    });
  }

  state.refresh = refresh;
  window[runtimeKey] = state;
  document.addEventListener("nav", refresh);
  document.addEventListener("render", refresh);
  refresh();
})();
`

export default atlasRuntime
