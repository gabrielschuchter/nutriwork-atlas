;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})

  const templates = [
    {
      id: "graph-open-one",
      family: "graph",
      selectionGroup: "exploration",
      title: "Escolha um caminho",
      description: "Abra 1 conceito diretamente pelo grafo.",
      target: 1,
      metric: "graphConcepts",
    },
    {
      id: "unique-concepts-two",
      family: "concept",
      selectionGroup: "exploration",
      title: "Conheça dois conceitos",
      description: "Abra 2 conceitos diferentes.",
      target: 2,
      metric: "uniqueConceptsOpened",
    },
    {
      id: "internal-link-one",
      family: "navigation",
      selectionGroup: "exploration",
      title: "Siga uma conexão",
      description: "Abra 1 conceito por um link dentro de uma nota.",
      target: 1,
      metric: "internalLinkConcepts",
    },
    {
      id: "internal-link-two",
      family: "navigation",
      selectionGroup: "exploration",
      title: "Continue o caminho",
      description: "Abra 2 conceitos diferentes por links dentro de notas.",
      target: 2,
      metric: "internalLinkConcepts",
    },
    {
      id: "search-open-one",
      family: "search",
      selectionGroup: "discovery",
      title: "Pesquise uma ideia",
      description: "Use a busca para abrir 1 conceito.",
      target: 1,
      metric: "searchResultConcepts",
    },
    {
      id: "search-compare-two",
      family: "search",
      selectionGroup: "discovery",
      title: "Compare resultados",
      description: "Abra 2 conceitos diferentes pela busca.",
      target: 2,
      metric: "searchResultConcepts",
    },
    {
      id: "filtered-concept-one",
      family: "filter",
      selectionGroup: "discovery",
      title: "Explore uma área",
      description: "Escolha uma área e abra 1 conceito dela.",
      target: 1,
      metric: "filteredConcepts",
    },
    {
      id: "concept-list-one",
      family: "conceptList",
      selectionGroup: "discovery",
      title: "Use a lista",
      description: "Abra 1 conceito pela Lista de conceitos.",
      target: 1,
      metric: "conceptListConcepts",
    },
    {
      id: "graph-pan-one",
      family: "graph",
      selectionGroup: "map",
      title: "Mova o mapa",
      description: "Arraste o grafo uma vez por uma distância significativa.",
      target: 1,
      metric: "meaningfulGraphPans",
    },
    {
      id: "graph-zoom-one",
      family: "graph",
      selectionGroup: "map",
      title: "Veja mais de perto",
      description: "Aproxime ou afaste o grafo de forma significativa.",
      target: 1,
      metric: "meaningfulGraphZooms",
    },
  ]

  atlas.dailyTaskDefinitionVersion = 1
  atlas.dailyTaskTemplates = templates
})()
