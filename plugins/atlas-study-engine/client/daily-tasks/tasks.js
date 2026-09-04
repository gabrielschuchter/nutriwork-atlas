;(() => {
  const atlas = (window.__nutriworkAtlasEngine = window.__nutriworkAtlasEngine || {})

  const templates = [
    {
      id: "open-concepts-2",
      kind: "open",
      title: "Abra caminhos",
      description: "Explore 2 conceitos diferentes do Atlas.",
      target: 2,
    },
    {
      id: "open-concepts-3",
      kind: "open",
      title: "Faça uma pequena expedição",
      description: "Explore 3 conceitos diferentes do Atlas.",
      target: 3,
    },
    {
      id: "discover-new-2",
      kind: "discover",
      title: "Descubra algo novo",
      description: "Abra 2 conceitos que você ainda não visitou.",
      target: 2,
    },
    {
      id: "discover-new-3",
      kind: "discover",
      title: "Amplie o mapa",
      description: "Abra 3 conceitos que você ainda não visitou.",
      target: 3,
    },
    {
      id: "revisit-2",
      kind: "revisit",
      title: "Retome uma ideia",
      description: "Revisite 2 conceitos que você já viu.",
      target: 2,
    },
    {
      id: "revisit-3",
      kind: "revisit",
      title: "Reative conexões",
      description: "Revisite 3 conceitos que você já viu.",
      target: 3,
    },
    {
      id: "graph-nodes-3",
      kind: "source",
      source: "graph",
      title: "Siga pelo grafo",
      description: "Abra 3 nós diretamente pelo grafo.",
      target: 3,
    },
    {
      id: "graph-node-1",
      kind: "source",
      source: "graph",
      title: "Escolha um caminho",
      description: "Abra um nó diretamente pelo grafo.",
      target: 1,
    },
    {
      id: "specific-concept",
      kind: "specific",
      title: "Encontre um conceito",
      description: "Visite o conceito indicado no Atlas.",
      target: 1,
    },
    {
      id: "connected-2",
      kind: "connected",
      title: "Explore uma vizinhança",
      description: "Abra 2 conceitos conectados entre si.",
      target: 2,
    },
    {
      id: "connected-3",
      kind: "connected",
      title: "Percorra uma trilha",
      description: "Abra 3 conceitos conectados entre si.",
      target: 3,
    },
    {
      id: "search-result",
      kind: "source",
      source: "search",
      title: "Use a busca",
      description: "Busque um conceito e abra um dos resultados.",
      target: 1,
    },
  ]

  atlas.dailyTaskTemplates = templates
})()
