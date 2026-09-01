;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})
  const {
    button,
    clear,
    formatDate,
    iconButton,
    link,
    make,
    normalizeSlug,
    normalizeText,
    relativeDate,
    routeSlug,
    setHidden,
    svgIcon,
  } = atlas.dom
  const statusLabels = {
    new: "Nunca estudado",
    learning: "Estudando",
    scheduled: "Revisão futura",
    due: "Revisão vencida",
    mastered: "Consolidado",
  }

  let currentLibraryTab = "highlights"
  let comparisonSlugs = []

  function formSubmitButton(label, action, className) {
    const control = button(label, action, className)
    control.type = "submit"
    return control
  }

  function pageHeader(container, kicker, title, description) {
    clear(container)
    const header = make("header", "atlas-view-header")
    header.appendChild(make("p", "atlas-kicker", kicker))
    header.appendChild(make("h1", "atlas-view-title", title))
    if (description) header.appendChild(make("p", "atlas-view-description", description))
    container.appendChild(header)
    return header
  }

  function statusChip(slug) {
    const status = atlas.state.reviewStatus(slug)
    const chip = make("span", "atlas-status-chip is-" + status, statusLabels[status])
    chip.dataset.status = status
    return chip
  }

  function sectionHeading(title, actionLabel, action) {
    const heading = make("div", "atlas-section-heading")
    const titleWrap = make("div", null)
    titleWrap.appendChild(make("p", "atlas-kicker", "ATLAS"))
    titleWrap.appendChild(make("h2", null, title))
    heading.appendChild(titleWrap)
    if (actionLabel && action) heading.appendChild(button(actionLabel, action, "atlas-text-button"))
    return heading
  }

  function conceptCard(node, options) {
    const card = make("article", "atlas-concept-card" + (options?.featured ? " is-featured" : ""))
    const top = make("div", "atlas-concept-card-top")
    const copy = make("div", "atlas-concept-card-copy")
    copy.appendChild(link(node, node.title, "atlas-study-link atlas-card-title"))
    copy.appendChild(make("span", "atlas-card-area", node.areaLabel))
    top.appendChild(copy)
    top.appendChild(statusChip(node.slug))
    card.appendChild(top)
    if (options?.showExcerpt !== false && node.excerpt)
      card.appendChild(make("p", "atlas-card-excerpt", node.excerpt))
    const footer = make("div", "atlas-card-footer")
    footer.appendChild(make("span", "atlas-card-stat", `${node.degree || 0} relações`))
    if (options?.date)
      footer.appendChild(make("span", "atlas-card-stat", relativeDate(options.date)))
    else if (options?.action)
      footer.appendChild(
        button(options.actionLabel || "Estudar", options.action, "atlas-card-action"),
      )
    card.appendChild(footer)
    return card
  }

  function metric(value, label, detail) {
    const card = make("article", "atlas-metric-card")
    card.appendChild(make("strong", "atlas-metric-value", String(value)))
    card.appendChild(make("span", "atlas-metric-label", label))
    if (detail) card.appendChild(make("small", "atlas-metric-detail", detail))
    return card
  }

  function metricsStrip(stats, index) {
    const strip = make("div", "atlas-home-metrics")
    strip.appendChild(metric(stats.seen, "vistos", `de ${stats.total}`))
    strip.appendChild(
      metric(stats.due, "para revisar", stats.due ? "seu próximo retorno" : "sua fila está livre"),
    )
    strip.appendChild(metric(stats.mastered, "consolidados", "com revisões registradas"))
    strip.appendChild(
      metric(
        `${stats.coverage}%`,
        "cobertura",
        `${index.metrics?.areaCount || 0} áreas conectadas`,
      ),
    )
    return strip
  }

  function emptyState(title, description, action, actionLabel) {
    const box = make("div", "atlas-empty-state")
    box.appendChild(make("span", "atlas-empty-orbit", "✦"))
    box.appendChild(make("h3", null, title))
    box.appendChild(make("p", null, description))
    if (action)
      box.appendChild(button(actionLabel || "Começar", action, "atlas-button atlas-button-primary"))
    return box
  }

  function recentNodes() {
    return atlas.state
      .get()
      .visited.map((item) => ({ item, node: atlas.data.get(item.slug) }))
      .filter((entry) => entry.node)
  }

  function nextRecommendation() {
    const stored = atlas.state.get()
    const resumeNode = stored.resume ? atlas.data.get(stored.resume.slug) : null
    if (resumeNode)
      return { node: resumeNode, reason: "retomar exatamente o ponto em que você parou" }
    const visited = new Set(stored.visited.map((item) => item.slug))
    const due = atlas.state
      .dueSlugs()
      .map((slug) => atlas.data.get(slug))
      .filter(Boolean)
    if (due[0]) return { node: due[0], reason: "uma revisão sua já está vencida" }
    const origin = recentNodes()[0]?.node || atlas.data.get("atlas/nutrição")
    if (origin) {
      const related = (origin.related || [])
        .map((item) => atlas.data.get(item.slug))
        .filter(Boolean)
      const unseen = related.find((node) => !visited.has(node.slug))
      if (unseen) return { node: unseen, reason: `continua a vizinhança de ${origin.title}` }
    }
    const fallback =
      (atlas.data.index?.hubs || []).find((node) => !visited.has(node.slug)) ||
      atlas.data.concepts()[0]
    return fallback ? { node: fallback, reason: "é uma porta de entrada central do Atlas" } : null
  }

  function pathProgress(path) {
    const valid = path.concepts.map((slug) => atlas.data.get(slug)).filter(Boolean)
    const state = atlas.state.get()
    const completed = valid.filter(
      (node) =>
        ["mastered", "scheduled"].includes(atlas.state.reviewStatus(node.slug)) ||
        state.visited.some((item) => item.slug === node.slug),
    ).length
    return {
      total: valid.length,
      completed,
      percentage: valid.length ? Math.round((completed / valid.length) * 100) : 0,
      valid,
    }
  }

  function pathCard(path) {
    const progress = pathProgress(path)
    const card = make("article", "atlas-path-card")
    const top = make("div", "atlas-path-card-top")
    top.appendChild(make("span", "atlas-path-index", String(progress.completed).padStart(2, "0")))
    top.appendChild(make("span", "atlas-card-area", path.areaLabel))
    if (path.difficulty) top.appendChild(make("span", "atlas-badge", path.difficulty))
    card.appendChild(top)
    card.appendChild(make("h3", null, path.title))
    card.appendChild(make("p", "atlas-card-excerpt", path.description))
    const bar = make("div", "atlas-progress-bar")
    const fill = make("span", null)
    fill.style.width = progress.percentage + "%"
    bar.appendChild(fill)
    card.appendChild(bar)
    const footer = make("div", "atlas-card-footer")
    footer.appendChild(
      make("span", "atlas-card-stat", `${progress.completed}/${progress.total} conceitos`),
    )
    const start = button(
      progress.completed ? "Continuar trilha" : "Começar trilha",
      "start-path",
      "atlas-card-action",
    )
    start.dataset.pathId = path.id
    footer.appendChild(start)
    card.appendChild(footer)
    return card
  }

  function renderHome(index, target) {
    const container = target || document.getElementById("atlas-home-dashboard")
    if (!container) return
    clear(container)
    container.className = "atlas-home"
    const stats = atlas.state.stats(index.concepts)
    const recommendation = nextRecommendation()
    const hero = make("section", "atlas-home-hero")
    const heroCopy = make("div", "atlas-home-hero-copy")
    heroCopy.appendChild(make("p", "atlas-kicker", "HOJE · NUTRIWORK ATLAS"))
    heroCopy.appendChild(make("h1", null, "Aprenda por relações, não por listas."))
    heroCopy.appendChild(
      make(
        "p",
        "atlas-home-lede",
        "Uma experiência de estudo para entender como os conceitos de Nutrição se conectam — e escolher conscientemente o próximo passo.",
      ),
    )
    const actions = make("div", "atlas-action-row")
    actions.appendChild(
      button(
        stats.due ? "Revisar agora" : "Começar uma sessão",
        stats.due ? "start-review" : "start-study",
        "atlas-button atlas-button-primary",
      ),
    )
    actions.appendChild(button("Abrir o grafo", "graph", "atlas-button atlas-button-quiet"))
    heroCopy.appendChild(actions)
    const orb = make("div", "atlas-home-hero-orb", null)
    orb.setAttribute("aria-hidden", "true")
    ;["one", "two", "three", "four", "five"].forEach((name) => orb.appendChild(make("i", name)))
    const orbCore = make("strong", null, String(stats.coverage).padStart(2, "0"))
    orbCore.appendChild(make("span", null, "% da rede vista"))
    orb.appendChild(orbCore)
    hero.appendChild(heroCopy)
    hero.appendChild(orb)
    container.appendChild(hero)
    container.appendChild(metricsStrip(stats, index))

    const mainGrid = make("div", "atlas-home-grid")
    const studyColumn = make("div", "atlas-home-main")
    const continueSection = make("section", "atlas-home-section atlas-continue-section")
    continueSection.appendChild(sectionHeading("Continue de onde parou", "Ver histórico", "recent"))
    if (atlas.state.get().resume && atlas.data.get(atlas.state.get().resume.slug)) {
      const node = atlas.data.get(atlas.state.get().resume.slug)
      const resume = make("article", "atlas-resume-card")
      resume.appendChild(make("span", "atlas-resume-eyebrow", "SEU ÚLTIMO PONTO"))
      resume.appendChild(link(node, node.title, "atlas-resume-title"))
      resume.appendChild(
        make(
          "p",
          null,
          atlas.state.get().resume.section
            ? `Seção: ${atlas.state.get().resume.section}`
            : "Retome a leitura com um clique.",
        ),
      )
      const resumeFooter = make("div", "atlas-card-footer")
      resumeFooter.appendChild(
        make(
          "span",
          "atlas-card-stat",
          `${Math.round(Number(atlas.state.get().resume.scroll || 0))}% lido`,
        ),
      )
      resumeFooter.appendChild(button("Retomar leitura", "resume", "atlas-card-action"))
      resume.appendChild(resumeFooter)
      continueSection.appendChild(resume)
    } else {
      continueSection.appendChild(
        emptyState(
          "Seu caminho começa agora.",
          "Abra um conceito ou inicie uma sessão curta. O Atlas guarda seu ponto de retorno neste navegador.",
          "start-study",
          "Começar a estudar",
        ),
      )
    }
    studyColumn.appendChild(continueSection)

    const recommendationSection = make("section", "atlas-home-section atlas-recommendation-section")
    recommendationSection.appendChild(sectionHeading("Seu próximo conceito", null, null))
    if (recommendation) {
      const card = make("article", "atlas-recommendation-card")
      card.appendChild(make("span", "atlas-resume-eyebrow", "SUGESTÃO EXPLICÁVEL"))
      card.appendChild(
        link(recommendation.node, recommendation.node.title, "atlas-recommendation-title"),
      )
      card.appendChild(make("p", null, `Porque ${recommendation.reason}.`))
      const row = make("div", "atlas-card-footer")
      row.appendChild(statusChip(recommendation.node.slug))
      row.appendChild(button("Estudar conceito", "start-study-concept", "atlas-card-action"))
      row.lastChild.dataset.slug = recommendation.node.slug
      card.appendChild(row)
      recommendationSection.appendChild(card)
    }
    studyColumn.appendChild(recommendationSection)

    const pathsSection = make("section", "atlas-home-section")
    pathsSection.appendChild(sectionHeading("Trilhas para ganhar contexto", "Ver todas", "paths"))
    const pathGrid = make("div", "atlas-path-grid")
    atlas.data.paths.slice(0, 3).forEach((path) => pathGrid.appendChild(pathCard(path)))
    if (!atlas.data.paths.length)
      pathGrid.appendChild(
        emptyState(
          "Trilhas chegando ao Atlas.",
          "O índice de conceitos continua disponível enquanto as trilhas são preparadas.",
        ),
      )
    pathsSection.appendChild(pathGrid)
    studyColumn.appendChild(pathsSection)
    mainGrid.appendChild(studyColumn)

    const sideColumn = make("aside", "atlas-home-side")
    const reviewCard = make("section", "atlas-home-side-card atlas-review-card")
    reviewCard.appendChild(sectionHeading("Revisar hoje", null, null))
    reviewCard.appendChild(make("strong", "atlas-side-number", String(stats.due).padStart(2, "0")))
    reviewCard.appendChild(
      make(
        "p",
        null,
        stats.due ? "conceitos esperando seu retorno" : "Nenhuma revisão vencida por enquanto.",
      ),
    )
    reviewCard.appendChild(
      button(
        stats.due ? "Abrir revisão" : "Montar sessão",
        stats.due ? "start-review" : "start-study",
        "atlas-button atlas-button-primary",
      ),
    )
    sideColumn.appendChild(reviewCard)
    const recentSection = make("section", "atlas-home-side-card")
    recentSection.appendChild(sectionHeading("Visitados recentemente", "Biblioteca", "library"))
    const recentList = make("div", "atlas-mini-list")
    recentNodes()
      .slice(0, 5)
      .forEach(({ node, item }) => {
        const row = make("div", "atlas-mini-row")
        row.appendChild(link(node, node.title, "atlas-study-link"))
        row.appendChild(make("span", null, relativeDate(item.seenAt)))
        recentList.appendChild(row)
      })
    if (!recentList.childElementCount)
      recentList.appendChild(make("p", "atlas-empty-copy", "Ainda não há conceitos visitados."))
    recentSection.appendChild(recentList)
    sideColumn.appendChild(recentSection)
    const areaSection = make("section", "atlas-home-side-card")
    areaSection.appendChild(sectionHeading("Explore por área", null, null))
    const areaGrid = make("div", "atlas-area-grid")
    ;(index.areas || []).slice(0, 7).forEach((area) => {
      const areaButton = button("", "advanced-search", "atlas-area-card")
      areaButton.dataset.atlasArea = area.id
      areaButton.appendChild(make("strong", null, area.label))
      areaButton.appendChild(make("span", null, `${area.count} conceitos`))
      areaGrid.appendChild(areaButton)
    })
    areaSection.appendChild(areaGrid)
    sideColumn.appendChild(areaSection)
    mainGrid.appendChild(sideColumn)
    container.appendChild(mainGrid)

    const graphSection = make("section", "atlas-home-graph-section")
    graphSection.appendChild(sectionHeading("Veja o Atlas respirando", "Explorar grafo", "graph"))
    const graphMount = make("div", "atlas-graph-mount atlas-home-graph-mount")
    graphSection.appendChild(graphMount)
    container.appendChild(graphSection)
    atlas.graph.mount(graphMount, {
      scope: "local",
      depth: 2,
      title: "Uma entrada, muitas possibilidades",
    })
  }

  function renderDashboard(container, index) {
    pageHeader(
      container,
      "HOJE",
      "Seu espaço de estudo",
      "Uma leitura clara do que pede atenção e do que pode abrir a próxima conexão.",
    )
    const home = make("div", "atlas-dashboard-view")
    const stats = atlas.state.stats(index.concepts)
    const summary = make("div", "atlas-dashboard-summary")
    summary.appendChild(
      make(
        "strong",
        null,
        stats.due
          ? `${stats.due} revisões aguardam você.`
          : "Seu Atlas está pronto para a próxima sessão.",
      ),
    )
    summary.appendChild(
      make("span", null, `${stats.seen} de ${stats.total} conceitos já passaram pelo seu caminho.`),
    )
    summary.appendChild(button("Montar sessão", "start-study", "atlas-button atlas-button-primary"))
    home.appendChild(summary)
    const cards = make("div", "atlas-card-grid atlas-card-grid-wide")
    const recommendation = nextRecommendation()
    if (recommendation)
      cards.appendChild(
        conceptCard(recommendation.node, {
          action: "start-study-concept",
          actionLabel: "Abrir próximo",
        }),
      )
    const due = atlas.state
      .dueSlugs()
      .map((slug) => atlas.data.get(slug))
      .filter(Boolean)
    due
      .slice(0, 3)
      .forEach((node) =>
        cards.appendChild(conceptCard(node, { action: "start-review", actionLabel: "Revisar" })),
      )
    home.appendChild(cards)
    container.appendChild(home)
  }

  function renderReview(container, index) {
    pageHeader(
      container,
      "REVISÃO ESPAÇADA",
      "Revisar hoje",
      "Retorne aos conceitos no momento em que a memória precisa ser reativada.",
    )
    const stats = atlas.state.stats(index.concepts)
    const summary = make("div", "atlas-review-summary")
    summary.appendChild(metric(stats.due, "vencidos", "prontos agora"))
    summary.appendChild(metric(stats.learning, "estudando", "ainda em formação"))
    summary.appendChild(metric(stats.scheduled, "agendados", "revisões futuras"))
    summary.appendChild(
      button(
        stats.due ? "Começar revisão" : "Estudar conceitos novos",
        stats.due ? "start-review" : "start-study",
        "atlas-button atlas-button-primary",
      ),
    )
    container.appendChild(summary)
    const list = make("section", "atlas-view-section")
    list.appendChild(sectionHeading("Sua fila de hoje", null, null))
    const due = atlas.state
      .dueSlugs()
      .map((slug) => atlas.data.get(slug))
      .filter(Boolean)
    const cards = make("div", "atlas-card-grid")
    due.forEach((node) =>
      cards.appendChild(conceptCard(node, { action: "start-review", actionLabel: "Revisar este" })),
    )
    if (!due.length)
      list.appendChild(
        emptyState(
          "Tudo em dia por aqui.",
          "Use o tempo livre para iniciar uma sessão e adicionar novos conceitos ao seu ciclo de revisão.",
          "start-study",
          "Estudar agora",
        ),
      )
    else list.appendChild(cards)
    container.appendChild(list)
    const explanation = make("section", "atlas-note-card")
    explanation.appendChild(make("p", "atlas-kicker", "ARQUITETURA DE REVISÃO"))
    explanation.appendChild(make("h2", null, "O estado acompanha o seu ritmo."))
    explanation.appendChild(
      make(
        "p",
        null,
        "Cada resposta registra dificuldade, estabilidade, lapsos e próxima data. O adaptador local está isolado para receber FSRS quando a integração for deliberadamente aprovada.",
      ),
    )
    container.appendChild(explanation)
  }

  function renderPaths(container) {
    pageHeader(
      container,
      "APRENDIZAGEM GUIADA",
      "Trilhas de estudo",
      "Sequências externas ao vault para transformar relações em percursos possíveis.",
    )
    const intro = make("div", "atlas-paths-intro")
    intro.appendChild(
      make(
        "p",
        null,
        `${atlas.data.paths.length} trilhas editoriais para começar com contexto e avançar sem perder a visão da rede.`,
      ),
    )
    intro.appendChild(
      button("Montar sessão livre", "start-study", "atlas-button atlas-button-primary"),
    )
    container.appendChild(intro)
    const grid = make("div", "atlas-path-grid atlas-path-grid-large")
    atlas.data.paths.forEach((path) => grid.appendChild(pathCard(path)))
    if (!atlas.data.paths.length)
      grid.appendChild(
        emptyState(
          "Nenhuma trilha disponível ainda.",
          "Você pode estudar pela rede completa ou explorar uma área do Atlas.",
        ),
      )
    container.appendChild(grid)
  }

  function renderLibrary(container) {
    pageHeader(
      container,
      "SEU MATERIAL",
      "Minha biblioteca",
      "Favoritos, trechos, cartões e listas ficam no seu navegador — sem alterar uma linha do vault.",
    )
    const tabs = make("div", "atlas-library-tabs", null)
    ;[
      ["highlights", "Destaques"],
      ["cards", "Cartões"],
      ["lists", "Listas"],
    ].forEach(([value, label]) => {
      const tab = button(
        label,
        "library-tab",
        "atlas-library-tab" + (currentLibraryTab === value ? " is-active" : ""),
      )
      tab.dataset.libraryTab = value
      tabs.appendChild(tab)
    })
    tabs.appendChild(button("Nova lista", "new-list", "atlas-button atlas-button-primary"))
    container.appendChild(tabs)
    const body = make("section", "atlas-library-body")
    if (currentLibraryTab === "highlights") renderHighlights(body)
    else if (currentLibraryTab === "cards") renderCards(body)
    else renderLists(body)
    container.appendChild(body)
  }

  function renderHighlights(container) {
    const highlights = atlas.state.get().highlights
    container.appendChild(sectionHeading("Trechos que merecem retorno", null, null))
    if (!highlights.length) {
      container.appendChild(
        emptyState(
          "Ainda não há destaques.",
          "Selecione um trecho em qualquer nota para guardar uma ideia no seu espaço de estudo.",
        ),
      )
      return
    }
    const list = make("div", "atlas-highlight-list")
    highlights.forEach((highlight) => {
      const card = make("article", "atlas-highlight-card")
      card.appendChild(make("blockquote", null, `“${highlight.quote || "Trecho sem texto"}”`))
      const node = atlas.data.get(highlight.slug)
      if (node) card.appendChild(link(node, node.title, "atlas-study-link"))
      if (highlight.note) card.appendChild(make("p", "atlas-highlight-note", highlight.note))
      card.appendChild(make("small", "atlas-card-stat", formatDate(highlight.createdAt)))
      list.appendChild(card)
    })
    container.appendChild(list)
  }

  function renderCards(container) {
    const cards = atlas.state.get().cards
    const heading = make("div", "atlas-library-heading")
    heading.appendChild(sectionHeading("Cartões manuais", null, null))
    heading.appendChild(
      make("p", null, "Crie cartões apenas quando um trecho realmente pedir recuperação ativa."),
    )
    container.appendChild(heading)
    if (!cards.length) {
      container.appendChild(
        emptyState(
          "Seus cartões começam com uma escolha.",
          "Selecione um trecho e use Criar cartão para construir frente, verso ou cloze manual.",
        ),
      )
      return
    }
    const grid = make("div", "atlas-card-grid")
    cards.forEach((card) => {
      const item = make("article", "atlas-flashcard")
      item.appendChild(
        make("span", "atlas-resume-eyebrow", card.type === "cloze" ? "CLOZE" : "FRENTE"),
      )
      item.appendChild(make("h3", null, card.front || "Sem frente"))
      item.appendChild(make("div", "atlas-flashcard-back", card.back || "Sem verso"))
      const node = atlas.data.get(card.slug)
      if (node) item.appendChild(link(node, node.title, "atlas-study-link"))
      grid.appendChild(item)
    })
    container.appendChild(grid)
  }

  function renderLists(container) {
    container.appendChild(sectionHeading("Listas pessoais", null, null))
    const lists = make("div", "atlas-list-collection")
    atlas.state.get().lists.forEach((list) => {
      const card = make("article", "atlas-personal-list")
      const header = make("div", "atlas-personal-list-header")
      header.appendChild(make("h3", null, list.title))
      header.appendChild(make("span", "atlas-badge", `${list.slugs.length} itens`))
      card.appendChild(header)
      const items = make("div", "atlas-mini-list")
      list.slugs.slice(0, 8).forEach((slug) => {
        const node = atlas.data.get(slug)
        if (node) items.appendChild(link(node, node.title, "atlas-study-link"))
      })
      if (!items.childElementCount)
        items.appendChild(
          make(
            "p",
            "atlas-empty-copy",
            "Adicione conceitos a esta lista a partir de qualquer nota.",
          ),
        )
      card.appendChild(items)
      lists.appendChild(card)
    })
    container.appendChild(lists)
  }

  function renderRanking(container, index) {
    pageHeader(
      container,
      "RELAÇÕES",
      "Conceitos mais conectados",
      "Pontos centrais para entrar na rede e encontrar caminhos de aprofundamento.",
    )
    const metrics = make("div", "atlas-metric-grid")
    metrics.appendChild(metric(index.metrics?.conceptCount || 0, "conceitos"))
    metrics.appendChild(metric(index.metrics?.connectionCount || 0, "conexões"))
    metrics.appendChild(metric(index.metrics?.bridgeCount || 0, "pontes"))
    container.appendChild(metrics)
    const list = make("div", "atlas-ranked-list")
    ;(index.hubs || []).forEach((node, position) => {
      const row = make("article", "atlas-ranked-row")
      row.appendChild(make("span", "atlas-rank", String(position + 1).padStart(2, "0")))
      const copy = make("div", "atlas-ranked-copy")
      copy.appendChild(link(node, node.title, "atlas-study-link"))
      copy.appendChild(make("span", "atlas-card-area", node.areaLabel))
      row.appendChild(copy)
      row.appendChild(make("strong", "atlas-ranked-value", String(node.degree)))
      list.appendChild(row)
    })
    container.appendChild(list)
  }

  function renderGaps(container, index) {
    const requested = new URL(window.location.href).searchParams.get("concept") || ""
    const gaps = requested
      ? (index.gaps || []).filter((gap) => normalizeText(gap.title) === normalizeText(requested))
      : index.gaps || []
    pageHeader(
      container,
      "DIAGNÓSTICO",
      "Lacunas da rede",
      requested
        ? "A referência ainda não possui uma nota correspondente no acervo."
        : "Referências citadas que ainda não encontram uma nota correspondente.",
    )
    const summary = make("div", "atlas-review-summary")
    summary.appendChild(metric(index.metrics?.unresolvedTargetCount || 0, "referências"))
    summary.appendChild(metric(index.metrics?.unresolvedOccurrenceCount || 0, "ocorrências"))
    container.appendChild(summary)
    const list = make("div", "atlas-gap-list")
    gaps.slice(0, 120).forEach((gap) => {
      const row = make("article", "atlas-gap-row")
      const heading = make("div", "atlas-gap-heading")
      heading.appendChild(make("h2", null, gap.title))
      heading.appendChild(make("span", "atlas-badge", `${gap.occurrences} ocorrências`))
      row.appendChild(heading)
      row.appendChild(
        make(
          "p",
          "atlas-card-excerpt",
          `Apontado por ${gap.sourceCount} ${gap.sourceCount === 1 ? "nota" : "notas"}.`,
        ),
      )
      const sources = make("div", "atlas-gap-sources")
      ;(gap.sources || []).slice(0, 8).forEach((source) => {
        const sourceNode = atlas.data.get(source.slug)
        if (sourceNode)
          sources.appendChild(
            link(sourceNode, `${sourceNode.title} · ${source.occurrences}x`, "atlas-study-link"),
          )
      })
      row.appendChild(sources)
      list.appendChild(row)
    })
    if (!gaps.length)
      list.appendChild(
        emptyState(
          "Nenhuma referência encontrada.",
          "O diagnóstico não encontrou esse termo entre as lacunas do Atlas.",
        ),
      )
    container.appendChild(list)
  }

  function renderMap(container, index) {
    pageHeader(
      container,
      "VISÃO GERAL",
      "Mapa do Atlas",
      "A escala, a densidade e os caminhos da rede em uma só leitura.",
    )
    const metrics = make("div", "atlas-metric-grid atlas-metric-grid-large")
    ;[
      [index.metrics?.conceptCount || 0, "conceitos"],
      [index.metrics?.connectionCount || 0, "conexões"],
      [index.metrics?.areaCount || 0, "áreas"],
      [index.metrics?.componentCount || 0, "componentes"],
      [index.metrics?.unresolvedTargetCount || 0, "lacunas"],
      [index.metrics?.isolatedCount || 0, "isolados"],
    ].forEach(([value, label]) => metrics.appendChild(metric(value, label)))
    container.appendChild(metrics)
    const columns = make("div", "atlas-map-columns")
    const areas = make("section", "atlas-view-section")
    areas.appendChild(sectionHeading("Áreas do acervo", null, null))
    ;(index.areas || []).forEach((area) => {
      const row = make("div", "atlas-map-list-row")
      row.appendChild(make("span", null, area.label))
      row.appendChild(make("strong", null, String(area.count)))
      areas.appendChild(row)
    })
    columns.appendChild(areas)
    const bridges = make("section", "atlas-view-section")
    bridges.appendChild(sectionHeading("Pontes da rede", null, null))
    ;(index.bridgeNodes || [])
      .slice(0, 8)
      .forEach((node) => bridges.appendChild(conceptCard(node, { showExcerpt: false })))
    columns.appendChild(bridges)
    container.appendChild(columns)
  }

  function renderStructure(container, index) {
    pageHeader(
      container,
      "TOPOLOGIA",
      "Estrutura da rede",
      "Uma leitura da forma do acervo: centros, periferias, pontes e componentes.",
    )
    const grid = make("div", "atlas-structure-grid")
    ;[
      [index.metrics?.bridgeCount || 0, "notas ponte", "conectam regiões do conhecimento"],
      [index.metrics?.peripheralCount || 0, "notas periféricas", "com uma borda de entrada"],
      [index.metrics?.isolatedCount || 0, "notas isoladas", "sem conexões encontradas"],
      [index.metrics?.componentCount || 0, "componentes", "regiões desconectadas"],
    ].forEach(([value, label, detail]) => grid.appendChild(metric(value, label, detail)))
    container.appendChild(grid)
    const note = make("section", "atlas-note-card")
    note.appendChild(make("p", "atlas-kicker", "LEITURA DO MAPA"))
    note.appendChild(make("h2", null, "A forma também ensina."))
    note.appendChild(
      make(
        "p",
        null,
        "Use o grafo local para começar em uma nota e acompanhar como a sua vizinhança se organiza. Use o mapa completo para reconhecer as comunidades do Atlas.",
      ),
    )
    note.appendChild(button("Abrir grafo completo", "graph", "atlas-button atlas-button-primary"))
    container.appendChild(note)
  }

  function renderFavorites(container) {
    pageHeader(
      container,
      "SUA CURADORIA",
      "Favoritos",
      "Um lugar para guardar conceitos que merecem uma segunda passagem.",
    )
    const cards = make("div", "atlas-card-grid")
    atlas.state
      .get()
      .favorites.map((slug) => atlas.data.get(slug))
      .filter(Boolean)
      .forEach((node) =>
        cards.appendChild(
          conceptCard(node, { action: "start-study-concept", actionLabel: "Estudar" }),
        ),
      )
    if (!cards.childElementCount)
      cards.appendChild(
        emptyState(
          "Sua curadoria está vazia.",
          "Salve um conceito usando o botão Favoritar dentro de qualquer nota.",
        ),
      )
    container.appendChild(cards)
  }

  function renderRecent(container) {
    pageHeader(
      container,
      "HISTÓRICO",
      "Recentes",
      "Retorne aos conceitos que passaram pelo seu caminho.",
    )
    const cards = make("div", "atlas-card-grid")
    recentNodes().forEach(({ node, item }) =>
      cards.appendChild(
        conceptCard(node, {
          date: item.seenAt,
          action: "start-study-concept",
          actionLabel: "Continuar",
        }),
      ),
    )
    if (!cards.childElementCount)
      cards.appendChild(
        emptyState(
          "Nada por aqui ainda.",
          "Quando você abrir um conceito, ele aparecerá nesta linha do tempo.",
        ),
      )
    container.appendChild(cards)
  }

  function renderSearch(container) {
    pageHeader(
      container,
      "BUSCA UNIVERSAL",
      "Encontre uma conexão",
      "Pesquise títulos, áreas e trechos úteis do Atlas.",
    )
    const form = make("form", "atlas-search-form")
    form.dataset.atlasForm = "search"
    const input = make("input", "atlas-search-input")
    input.name = "query"
    input.type = "search"
    input.placeholder = "Ex.: ATP, causalidade, aleitamento..."
    input.autocomplete = "off"
    form.appendChild(input)
    form.appendChild(button("Buscar", "submit-search", "atlas-button atlas-button-primary"))
    container.appendChild(form)
    const results = make("div", "atlas-search-results")
    results.dataset.searchResults = ""
    container.appendChild(results)
    input.focus()
  }

  function renderSearchResults(container, query, area) {
    const results = container.querySelector("[data-search-results]") || container
    clear(results)
    const matches = atlas.data
      .concepts()
      .filter(
        (node) =>
          (!area || area === "all" || node.area === area) && atlas.dom.searchMatch(node, query),
      )
      .slice(0, 80)
    results.appendChild(
      make(
        "p",
        "atlas-search-summary",
        `${matches.length} ${matches.length === 1 ? "resultado" : "resultados"} para “${query || "todos os conceitos"}”.`,
      ),
    )
    const grid = make("div", "atlas-card-grid")
    matches.forEach((node) =>
      grid.appendChild(
        conceptCard(node, { action: "start-study-concept", actionLabel: "Estudar" }),
      ),
    )
    if (!matches.length)
      grid.appendChild(
        emptyState(
          "Nenhum conceito encontrado.",
          "Tente um termo mais curto ou abra o mapa por área.",
        ),
      )
    results.appendChild(grid)
  }

  function renderGraph(container) {
    pageHeader(
      container,
      "EXPLORAÇÃO ESPACIAL",
      "Grafo do Atlas",
      "Arraste, aproxime e siga as relações. O mapa começa espaçado para você enxergar antes de investigar.",
    )
    const mount = make("div", "atlas-graph-mount atlas-dedicated-graph")
    container.appendChild(mount)
    atlas.graph.mount(mount, {
      scope: "global",
      depth: atlas.state.get().graphControls.depth,
      title: "O Atlas em uma só paisagem",
    })
  }

  function renderView(index) {
    const container = document.getElementById("atlas-view")
    if (!container) return
    const view = container.dataset.view || "dashboard"
    if (view === "dashboard") renderDashboard(container, index)
    else if (view === "review") renderReview(container, index)
    else if (view === "paths") renderPaths(container)
    else if (view === "library") renderLibrary(container)
    else if (view === "connected") renderRanking(container, index)
    else if (view === "gaps") renderGaps(container, index)
    else if (view === "map") renderMap(container, index)
    else if (view === "structure") renderStructure(container, index)
    else if (view === "favorites") renderFavorites(container)
    else if (view === "recent") renderRecent(container)
    else if (view === "search") renderSearch(container)
    else if (view === "graph") renderGraph(container)
    else renderDashboard(container, index)
  }

  function modalShell(title, kicker, className) {
    const overlay = make("div", "atlas-modal-overlay " + (className || ""))
    overlay.dataset.atlasOverlay = "true"
    overlay.setAttribute("role", "dialog")
    overlay.setAttribute("aria-modal", "true")
    const card = make("section", "atlas-modal-card")
    const header = make("div", "atlas-modal-header")
    const copy = make("div", null)
    copy.appendChild(make("p", "atlas-kicker", kicker))
    copy.appendChild(make("h2", null, title))
    header.appendChild(copy)
    header.appendChild(iconButton("close", "Fechar", "close-modal", "atlas-icon-button"))
    card.appendChild(header)
    overlay.appendChild(card)
    return { overlay, card }
  }

  function mountModal(overlay) {
    const root = document.getElementById("atlas-modal-root")
    if (!root) return
    clear(root)
    root.appendChild(overlay)
    document.documentElement.classList.add("atlas-modal-open")
    const focusTarget = overlay.querySelector("input, textarea, select, button")
    window.requestAnimationFrame(() => focusTarget?.focus())
  }

  function openStudySetup(initial) {
    const { overlay, card } = modalShell(
      "Montar uma sessão",
      "ESTUDO ATIVO",
      "atlas-study-setup-modal",
    )
    const form = make("form", "atlas-modal-form")
    form.dataset.atlasForm = "study-setup"
    const intro = make(
      "p",
      "atlas-modal-lede",
      "Escolha uma porta de entrada. O Atlas monta uma sequência curta e registra seu ponto de retorno.",
    )
    form.appendChild(intro)
    const grid = make("div", "atlas-form-grid")
    const areaLabel = make("label", "atlas-form-field")
    areaLabel.appendChild(make("span", null, "Área"))
    const area = document.createElement("select")
    area.name = "area"
    ;[
      ["all", "Conteúdo misto"],
      ...(atlas.data.index?.areas || []).map((item) => [item.id, item.label]),
    ].forEach(([value, label]) => {
      const option = make("option", null, label)
      option.value = value
      option.selected = (initial?.area || "all") === value
      area.appendChild(option)
    })
    areaLabel.appendChild(area)
    grid.appendChild(areaLabel)
    const pathLabel = make("label", "atlas-form-field")
    pathLabel.appendChild(make("span", null, "Trilha (opcional)"))
    const path = document.createElement("select")
    path.name = "pathId"
    const noPath = make("option", null, "Sem trilha")
    noPath.value = ""
    path.appendChild(noPath)
    atlas.data.paths.forEach((item) => {
      const option = make("option", null, item.title)
      option.value = item.id
      option.selected = initial?.pathId === item.id
      path.appendChild(option)
    })
    pathLabel.appendChild(path)
    grid.appendChild(pathLabel)
    form.appendChild(grid)
    form.appendChild(make("span", "atlas-form-label", "Duração aproximada"))
    const durations = make("div", "atlas-duration-options")
    ;[
      [10, "10 min", "5 conceitos"],
      [20, "20 min", "8 conceitos"],
      [30, "30 min", "12 conceitos"],
    ].forEach(([value, label, detail]) => {
      const option = make(
        "label",
        "atlas-duration-option" + ((initial?.duration || 20) === value ? " is-selected" : ""),
      )
      const input = document.createElement("input")
      input.type = "radio"
      input.name = "duration"
      input.value = String(value)
      input.checked = (initial?.duration || 20) === value
      option.appendChild(input)
      option.appendChild(make("strong", null, label))
      option.appendChild(make("span", null, detail))
      durations.appendChild(option)
    })
    form.appendChild(durations)
    if (initial?.slug) {
      const hidden = document.createElement("input")
      hidden.type = "hidden"
      hidden.name = "initialSlug"
      hidden.value = normalizeSlug(initial.slug)
      form.appendChild(hidden)
    }
    const footer = make("div", "atlas-modal-footer")
    footer.appendChild(make("span", "atlas-modal-hint", "Você poderá pausar a qualquer momento."))
    footer.appendChild(
      formSubmitButton("Começar sessão", "submit-study-setup", "atlas-button atlas-button-primary"),
    )
    form.appendChild(footer)
    card.appendChild(form)
    mountModal(overlay)
  }

  function buildSessionSequence(options) {
    const duration = Number(options.duration || 20)
    const amount = duration <= 10 ? 5 : duration <= 20 ? 8 : 12
    const concepts = atlas.data
      .concepts()
      .filter((node) => !options.area || options.area === "all" || node.area === options.area)
    const path = options.pathId ? atlas.data.pathById(options.pathId) : null
    const source = path
      ? path.concepts.map((slug) => atlas.data.get(slug)).filter(Boolean)
      : concepts
    const due = source.filter((node) => atlas.state.reviewStatus(node.slug) === "due")
    const fresh = source.filter((node) => atlas.state.reviewStatus(node.slug) === "new")
    const learning = source.filter((node) => atlas.state.reviewStatus(node.slug) === "learning")
    const sorted = [
      ...due,
      ...learning,
      ...fresh,
      ...source.filter((node) => ![...due, ...learning, ...fresh].includes(node)),
    ]
    const result = []
    if (options.initialSlug && atlas.data.get(options.initialSlug))
      result.push(atlas.data.get(options.initialSlug))
    sorted.forEach((node) => {
      if (result.length < amount && !result.some((item) => item.slug === node.slug))
        result.push(node)
    })
    return result.slice(0, amount).map((node) => node.slug)
  }

  function startSession(options) {
    const sequence = buildSessionSequence(options)
    if (!sequence.length) return false
    const session = {
      id: atlas.dom.id("session"),
      mode: options.mode || "study",
      area: options.area || "all",
      pathId: options.pathId || "",
      durationMinutes: Number(options.duration || 20),
      conceptSlugs: sequence,
      index: 0,
      startedAt: Date.now(),
      updatedAt: Date.now(),
      recalled: {},
    }
    atlas.state.update((state) => {
      state.activeSession = session
    })
    openStudySession()
    return true
  }

  function openStudySession() {
    const session = atlas.state.get().activeSession
    if (!session) return openStudySetup()
    const node = atlas.data.get(session.conceptSlugs[session.index])
    if (!node) return false
    const { overlay, card } = modalShell(
      "Sessão em andamento",
      session.mode === "review" ? "REVISÃO" : "ACTIVE RECALL",
      "atlas-study-session-modal",
    )
    const progress = make("div", "atlas-session-progress")
    progress.appendChild(
      make("span", null, `${session.index + 1} de ${session.conceptSlugs.length}`),
    )
    const bar = make("div", "atlas-progress-bar")
    const fill = make("span", null)
    fill.style.width = `${((session.index + 1) / session.conceptSlugs.length) * 100}%`
    bar.appendChild(fill)
    progress.appendChild(bar)
    card.appendChild(progress)
    const content = make("div", "atlas-session-content")
    content.appendChild(make("p", "atlas-kicker", node.areaLabel))
    content.appendChild(make("h3", "atlas-session-title", node.title))
    const prompt = make("div", "atlas-recall-prompt")
    prompt.appendChild(make("span", "atlas-resume-eyebrow", "ANTES DE LER"))
    prompt.appendChild(make("p", null, `Tente explicar o que você lembra sobre ${node.title}.`))
    const recall = make("textarea", "atlas-recall-input")
    recall.placeholder = "Escreva uma lembrança, hipótese ou pergunta (opcional)..."
    recall.value = session.recalled?.[node.slug] || ""
    recall.dataset.sessionRecall = node.slug
    prompt.appendChild(recall)
    content.appendChild(prompt)
    const reveal = make("div", "atlas-session-reveal")
    reveal.dataset.sessionReveal = ""
    reveal.hidden = !session.revealed
    reveal.appendChild(make("p", "atlas-kicker", "AGORA COMPARE"))
    reveal.appendChild(make("p", "atlas-session-excerpt", node.excerpt || node.description))
    const related = make("div", "atlas-session-related")
    related.appendChild(make("span", "atlas-resume-eyebrow", "RELAÇÕES PRÓXIMAS"))
    ;(node.related || []).slice(0, 4).forEach((item) => {
      const relatedNode = atlas.data.get(item.slug)
      if (relatedNode) related.appendChild(link(relatedNode, relatedNode.title, "atlas-study-link"))
    })
    reveal.appendChild(related)
    content.appendChild(reveal)
    card.appendChild(content)
    const footer = make("div", "atlas-modal-footer atlas-session-footer")
    footer.appendChild(button("Pausar", "pause-session", "atlas-text-button"))
    const footerActions = make("div", "atlas-action-row")
    if (!session.revealed)
      footerActions.appendChild(
        button("Revelar conceito", "reveal-session", "atlas-button atlas-button-primary"),
      )
    else {
      Object.entries(atlas.state.ratings).forEach(([rating, metadata]) => {
        const ratingButton = button(
          metadata.label,
          "rate-session",
          "atlas-rating-button is-" + rating,
        )
        ratingButton.dataset.rating = rating
        footerActions.appendChild(ratingButton)
      })
    }
    footer.appendChild(footerActions)
    card.appendChild(footer)
    mountModal(overlay)
  }

  function revealSession() {
    const session = atlas.state.get().activeSession
    if (!session) return
    const node = atlas.data.get(session.conceptSlugs[session.index])
    if (!node) return
    const input = document.querySelector(`[data-session-recall="${CSS.escape(node.slug)}"]`)
    atlas.state.update((state) => {
      state.activeSession.revealed = true
      state.activeSession.recalled = {
        ...(state.activeSession.recalled || {}),
        [node.slug]: input?.value || "",
      }
      state.activeSession.updatedAt = Date.now()
    })
    openStudySession()
  }

  function rateSession(rating) {
    const session = atlas.state.get().activeSession
    if (!session) return
    const node = atlas.data.get(session.conceptSlugs[session.index])
    if (!node) return
    const input = document.querySelector(`[data-session-recall="${CSS.escape(node.slug)}"]`)
    atlas.state.scheduleReview(node.slug, rating)
    atlas.state.recordVisit(node.slug, "sessão de estudo")
    atlas.state.update((state) => {
      state.activeSession.recalled = {
        ...(state.activeSession.recalled || {}),
        [node.slug]: input?.value || "",
      }
      state.activeSession.index += 1
      state.activeSession.revealed = false
      state.activeSession.updatedAt = Date.now()
      if (state.activeSession.index >= state.activeSession.conceptSlugs.length) {
        state.sessionHistory.unshift({
          ...state.activeSession,
          completedAt: Date.now(),
          completed: true,
        })
        state.sessionHistory = state.sessionHistory.slice(0, 30)
        state.activeSession = null
      }
    })
    if (atlas.state.get().activeSession) openStudySession()
    else openSessionComplete(session)
  }

  function openSessionComplete(session) {
    const { overlay, card } = modalShell(
      "Sessão concluída",
      "MOMENTO DE INTEGRAÇÃO",
      "atlas-session-complete-modal",
    )
    const inner = make("div", "atlas-complete-content")
    inner.appendChild(make("span", "atlas-complete-mark", "✦"))
    inner.appendChild(make("h3", null, "Você deixou a rede mais forte."))
    inner.appendChild(
      make(
        "p",
        null,
        `${session.conceptSlugs.length} conceitos receberam uma nova passagem e agora têm um próximo retorno registrado.`,
      ),
    )
    const actions = make("div", "atlas-action-row")
    actions.appendChild(
      button("Voltar ao Hoje", "close-modal-go-home", "atlas-button atlas-button-primary"),
    )
    actions.appendChild(
      button("Continuar explorando", "close-modal", "atlas-button atlas-button-quiet"),
    )
    inner.appendChild(actions)
    card.appendChild(inner)
    mountModal(overlay)
  }

  function openComparison(slugs) {
    comparisonSlugs = (slugs || [])
      .map(normalizeSlug)
      .filter((slug, index, array) => atlas.data.get(slug) && array.indexOf(slug) === index)
      .slice(0, 3)
    if (comparisonSlugs.length < 2) {
      const current = atlas.data.get(routeSlug())
      const related =
        current?.related?.map((item) => item.slug).filter((slug) => atlas.data.get(slug)) || []
      comparisonSlugs = [current?.slug, ...related].filter(Boolean).slice(0, 2)
    }
    renderComparison()
  }

  function renderComparison() {
    const { overlay, card } = modalShell(
      "Comparar conceitos",
      "LEITURA LADO A LADO",
      "atlas-comparison-modal",
    )
    const intro = make(
      "p",
      "atlas-modal-lede",
      "Alinhe seções equivalentes para perceber onde os conceitos convergem, divergem ou deixam perguntas abertas.",
    )
    card.appendChild(intro)
    const selectors = make("div", "atlas-compare-selectors")
    ;[0, 1, 2].forEach((index) => {
      const label = make("label", "atlas-form-field")
      label.appendChild(make("span", null, `Conceito ${index + 1}`))
      const select = document.createElement("select")
      select.dataset.compareSlot = String(index)
      const empty = make("option", null, index < 2 ? "Escolha um conceito" : "Opcional")
      empty.value = ""
      select.appendChild(empty)
      atlas.data.concepts().forEach((node) => {
        const option = make("option", null, node.title)
        option.value = node.slug
        option.selected = comparisonSlugs[index] === node.slug
        select.appendChild(option)
      })
      label.appendChild(select)
      selectors.appendChild(label)
    })
    card.appendChild(selectors)
    const valid = comparisonSlugs.map((slug) => atlas.data.get(slug)).filter(Boolean)
    const table = make("div", "atlas-comparison-table")
    const headings = new Map()
    valid.forEach((node) =>
      node.sections.forEach((section) => headings.set(normalizeText(section.title), section.title)),
    )
    if (!headings.size) headings.set("definicao", "Visão geral")
    ;[...headings.entries()].forEach(([key, title]) => {
      const row = make("section", "atlas-comparison-row")
      row.appendChild(make("h3", null, title))
      const cells = make("div", "atlas-comparison-cells")
      valid.forEach((node) => {
        const section = node.sections.find((item) => normalizeText(item.title) === key)
        cells.appendChild(
          make(
            "div",
            "atlas-comparison-cell",
            section?.text || node.excerpt || "Esta nota não traz uma seção equivalente.",
          ),
        )
      })
      row.appendChild(cells)
      table.appendChild(row)
    })
    card.appendChild(table)
    mountModal(overlay)
  }

  function updateComparison(slot, slug) {
    comparisonSlugs[Number(slot)] = normalizeSlug(slug)
    comparisonSlugs = comparisonSlugs.filter(Boolean)
    renderComparison()
  }

  function openListChooser(slug) {
    const { overlay, card } = modalShell(
      "Adicionar à lista",
      "CURADORIA PESSOAL",
      "atlas-list-chooser-modal",
    )
    card.appendChild(
      make(
        "p",
        "atlas-modal-lede",
        "Escolha uma lista existente ou crie uma nova para este conceito.",
      ),
    )
    const list = make("div", "atlas-choice-list")
    atlas.state.get().lists.forEach((item) => {
      const action = button(item.title, "choose-list", "atlas-choice-row")
      action.dataset.listId = item.id
      action.dataset.slug = normalizeSlug(slug)
      action.appendChild(make("span", null, `${item.slugs.length} conceitos`))
      list.appendChild(action)
    })
    card.appendChild(list)
    card.appendChild(button("Criar nova lista", "new-list", "atlas-button atlas-button-primary"))
    mountModal(overlay)
  }

  function openNewList() {
    const { overlay, card } = modalShell(
      "Criar uma lista",
      "CURADORIA PESSOAL",
      "atlas-new-list-modal",
    )
    const form = make("form", "atlas-modal-form")
    form.dataset.atlasForm = "new-list"
    const label = make("label", "atlas-form-field")
    label.appendChild(make("span", null, "Nome da lista"))
    const input = make("input", null)
    input.name = "title"
    input.required = true
    input.placeholder = "Ex.: Prova de quinta"
    label.appendChild(input)
    form.appendChild(label)
    form.appendChild(
      formSubmitButton("Criar lista", "submit-new-list", "atlas-button atlas-button-primary"),
    )
    card.appendChild(form)
    mountModal(overlay)
  }

  function openCardForm(selection) {
    const node = atlas.data.get(selection?.slug || routeSlug())
    const { overlay, card } = modalShell(
      "Criar cartão",
      "RECUPERAÇÃO MANUAL",
      "atlas-card-form-modal",
    )
    const form = make("form", "atlas-modal-form")
    form.dataset.atlasForm = "new-card"
    const formatLabel = make("label", "atlas-form-field")
    formatLabel.appendChild(make("span", null, "Formato"))
    const format = document.createElement("select")
    format.name = "type"
    format.dataset.cardType = ""
    ;[
      ["basic", "Frente e verso"],
      ["cloze", "Cloze manual"],
    ].forEach(([value, label]) => {
      const option = make("option", null, label)
      option.value = value
      format.appendChild(option)
    })
    formatLabel.appendChild(format)
    form.appendChild(formatLabel)
    form.appendChild(
      make(
        "p",
        "atlas-card-format-help",
        "No cloze, escreva o texto e marque o trecho oculto com {{assim}}.",
      ),
    )
    const frontLabel = make("label", "atlas-form-field")
    frontLabel.appendChild(make("span", "atlas-card-front-label", "Frente"))
    const front = make("textarea", null, selection?.quote || "")
    front.name = "front"
    front.required = true
    front.placeholder = "Pergunta, trecho ou afirmação..."
    frontLabel.appendChild(front)
    form.appendChild(frontLabel)
    const backLabel = make("label", "atlas-form-field")
    backLabel.appendChild(make("span", "atlas-card-back-label", "Verso"))
    const back = make("textarea", null)
    back.name = "back"
    back.required = true
    back.placeholder = node ? `Explique ${node.title} com suas palavras...` : "Escreva a resposta"
    backLabel.appendChild(back)
    form.appendChild(backLabel)
    const type = document.createElement("input")
    type.type = "hidden"
    type.name = "type"
    type.value = "basic"
    form.appendChild(type)
    const slug = document.createElement("input")
    slug.type = "hidden"
    slug.name = "slug"
    slug.value = node?.slug || routeSlug()
    form.appendChild(slug)
    form.appendChild(
      formSubmitButton("Salvar cartão", "submit-new-card", "atlas-button atlas-button-primary"),
    )
    card.appendChild(form)
    mountModal(overlay)
  }

  function openAnnotationForm(selection) {
    const { overlay, card } = modalShell(
      "Anotar trecho",
      "LEITURA ATIVA",
      "atlas-annotation-form-modal",
    )
    const form = make("form", "atlas-modal-form")
    form.dataset.atlasForm = "annotation"
    form.appendChild(
      make("blockquote", "atlas-selection-quote", selection?.quote || "Trecho selecionado"),
    )
    const note = make("textarea", null)
    note.name = "note"
    note.required = true
    note.placeholder = "O que este trecho muda na sua compreensão?"
    form.appendChild(note)
    const slug = make("input", null)
    slug.type = "hidden"
    slug.name = "slug"
    slug.value = selection?.slug || routeSlug()
    form.appendChild(slug)
    form.appendChild(
      formSubmitButton(
        "Guardar anotação",
        "submit-annotation",
        "atlas-button atlas-button-primary",
      ),
    )
    card.appendChild(form)
    mountModal(overlay)
  }

  function openSettings() {
    const { overlay, card } = modalShell("Preferências", "SEU ATLAS", "atlas-settings-modal")
    const grid = make("div", "atlas-settings-grid")
    const onboarding = make("article", "atlas-settings-item")
    onboarding.appendChild(make("h3", null, "Conheça o Atlas novamente"))
    onboarding.appendChild(make("p", null, "Reabra a apresentação inicial quando quiser."))
    onboarding.appendChild(
      button("Abrir apresentação", "open-onboarding", "atlas-button atlas-button-primary"),
    )
    grid.appendChild(onboarding)
    const theme = make("article", "atlas-settings-item")
    theme.appendChild(make("h3", null, "Aparência"))
    theme.appendChild(
      make("p", null, "O tema é salvo neste navegador e acompanha todas as páginas."),
    )
    theme.appendChild(button("Alternar tema", "toggle-theme", "atlas-button atlas-button-quiet"))
    grid.appendChild(theme)
    card.appendChild(grid)
    mountModal(overlay)
  }

  atlas.views = {
    buildSessionSequence,
    closeModal() {
      const root = document.getElementById("atlas-modal-root")
      if (root) clear(root)
      document.documentElement.classList.remove("atlas-modal-open")
      document.documentElement.classList.remove("atlas-overlay-open")
    },
    currentLibraryTab: () => currentLibraryTab,
    setLibraryTab(tab) {
      if (["highlights", "cards", "lists"].includes(tab)) currentLibraryTab = tab
    },
    openAnnotationForm,
    openCardForm,
    openComparison,
    openGraphRecall(slug) {
      const node = atlas.data.get(slug) || atlas.data.get(routeSlug())
      if (!node) return
      const { overlay, card } = modalShell(
        "Graph Recall",
        "APRENDER PELAS RELAÇÕES",
        "atlas-graph-recall-modal",
      )
      card.appendChild(
        make(
          "p",
          "atlas-modal-lede",
          `Sem consultar a nota, quais conceitos você espera encontrar diretamente ligados a ${node.title}?`,
        ),
      )
      const answer = make("textarea", "atlas-recall-input")
      answer.placeholder = "Liste relações, mecanismos ou conceitos vizinhos..."
      card.appendChild(answer)
      const hidden = make("div", "atlas-recall-reveal")
      hidden.dataset.graphRecallReveal = ""
      hidden.hidden = true
      hidden.appendChild(make("p", "atlas-kicker", "RELAÇÕES REAIS NO ATLAS"))
      ;(node.related || []).slice(0, 12).forEach((item) => {
        const related = atlas.data.get(item.slug)
        if (related) hidden.appendChild(link(related, related.title, "atlas-study-link"))
      })
      card.appendChild(hidden)
      const footer = make("div", "atlas-modal-footer")
      footer.appendChild(
        button("Revelar conexões", "reveal-graph-recall", "atlas-button atlas-button-primary"),
      )
      footer.appendChild(button("Fechar", "close-modal", "atlas-text-button"))
      card.appendChild(footer)
      mountModal(overlay)
    },
    openListChooser,
    openNewList,
    openSettings,
    openStudySession,
    openStudySetup,
    rateSession,
    renderHome,
    renderLibrary,
    renderSearchResults,
    renderView,
    revealSession,
    startSession,
    updateComparison,
  }
})()
