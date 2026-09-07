;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})

  const templates = [
    {
      id: "unique-concepts-two",
      title: "Conheça dois conceitos",
      description: "Abra 2 conceitos diferentes.",
      target: 2,
      metric: "uniqueConceptsOpened",
    },
    {
      id: "area-filter-one",
      title: "Filtre o mapa",
      description: "Escolha uma área para explorar.",
      target: 1,
      metric: "areaFilterChanges",
    },
    {
      id: "graph-pan-one",
      title: "Mova o mapa",
      description: "Arraste o grafo para explorar outra região.",
      target: 1,
      metric: "meaningfulGraphPans",
    },
    {
      id: "graph-zoom-one",
      title: "Veja mais de perto",
      description: "Use o zoom no grafo.",
      target: 1,
      metric: "meaningfulGraphZooms",
    },
  ]

  atlas.dailyTaskDefinitionVersion = 2
  atlas.dailyTaskTemplates = templates
})()
