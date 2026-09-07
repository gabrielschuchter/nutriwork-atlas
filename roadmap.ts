export type RoadmapItem = {
  title: string
  description: string
  category?: string
  column: RoadmapColumnKey
}

export type RoadmapColumnKey = "planned" | "in-progress" | "completed"

export type RoadmapColumn = {
  key: RoadmapColumnKey
  label: string
  items: RoadmapItem[]
}

// Suggestions never become items automatically. A real item must be curated here first.
export const roadmapItems: RoadmapItem[] = []

const roadmapColumnDefinitions: Array<Pick<RoadmapColumn, "key" | "label">> = [
  {
    key: "planned",
    label: "Planejado",
  },
  {
    key: "in-progress",
    label: "Em andamento",
  },
  {
    key: "completed",
    label: "Concluído",
  },
]

export function buildRoadmapColumns(items: RoadmapItem[]): RoadmapColumn[] {
  return roadmapColumnDefinitions.map((column) => ({
    ...column,
    items: items.filter((item) => item.column === column.key),
  }))
}

export const roadmapColumns: RoadmapColumn[] = buildRoadmapColumns(roadmapItems)

export const roadmapHasItems = roadmapItems.length > 0
