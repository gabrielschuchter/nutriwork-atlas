export type RoadmapItem = {
  title: string
  description: string
  category?: string
}

export type RoadmapColumn = {
  key: "planned" | "in-progress" | "completed"
  label: string
  items: RoadmapItem[]
}

// Keep this deliberately small and versioned. Suggestions never become items automatically.
export const roadmapColumns: RoadmapColumn[] = [
  {
    key: "planned",
    label: "Planejado",
    items: [
      {
        title: "Compartilhamento de conceitos",
        description: "Compartilhar um conceito preservando o contexto das relações do grafo.",
        category: "Exploração",
      },
      {
        title: "Contexto de relações",
        description: "Tornar mais claras as relações que conectam um conceito ao restante da rede.",
        category: "Navegação",
      },
    ],
  },
  {
    key: "in-progress",
    label: "Em andamento",
    items: [
      {
        title: "Curadoria contínua do acervo",
        description:
          "Revisar conexões, notas e caminhos de leitura para manter o Atlas consistente.",
        category: "Conteúdo",
      },
      {
        title: "Escuta da comunidade",
        description:
          "Avaliar sugestões recebidas e transformá-las em melhorias de produto quando fizer sentido.",
        category: "Produto",
      },
    ],
  },
  {
    key: "completed",
    label: "Concluído",
    items: [
      {
        title: "Grafo explorável",
        description:
          "Navegar por relações, zoom, pan e lista de conceitos em uma única superfície.",
        category: "Exploração",
      },
      {
        title: "Leitura conectada",
        description: "Abrir notas e continuar a exploração sem perder o contexto da rede.",
        category: "Leitura",
      },
      {
        title: "Experiência responsiva",
        description:
          "Explorar o Atlas com layout e interações adaptados para celular, tablet e desktop.",
        category: "Acessibilidade",
      },
    ],
  },
]
