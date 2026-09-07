# Tarefas diárias do Atlas

As tarefas diárias são uma camada client-side do Atlas. Não há backend, analytics externo, polling ou dependência nova. O runtime existente concatena os módulos em `plugins/atlas-study-engine/client/daily-tasks/`.

## Fluxo

```text
ação real do Atlas
      ↓
activity-tracker.js — evento semântico + estado agregado do dia
      ↓
task-engine.js — tarefa declarativa + progresso derivado
      ↓
daily-tasks.js — UI, toast e som
```

- `tasks.js` mantém 10 definições declarativas, organizadas em famílias e três grupos de seleção (`exploration`, `discovery`, `map`). Cada definição tem `id`, `family`, `selectionGroup`, `target`, `metric`, título e descrição verificável.
- `activity-tracker.js` é a camada única de tracking. Seus eventos aceitos são `concept_opened`, `area_filter_changed`, `graph_panned`, `graph_zoomed` e `graph_fit`; a origem `search` ou `concept_list` viaja no próprio `concept_opened`, evitando eventos artificiais para abrir a sheet, digitar ou expandir a lista.
- `task-progress.js` calcula o progresso a partir dos agregados do dia; não existe contador paralelo de progresso por tarefa.
- `task-engine.js` persiste a atribuição do dia, deriva progresso, grava `completedAt` individualmente e atualiza o streak de forma idempotente.
- `daily-tasks.js` reage a `atlas:activity`, portanto o progresso continua sendo registrado mesmo quando o painel está fechado.

## Tarefas disponíveis

| ID | Família | Métrica | Regra |
| --- | --- | --- | --- |
| `graph-open-one` | graph | `graphConcepts` | Abrir 1 conceito pelo grafo |
| `unique-concepts-two` | concept | `uniqueConceptsOpened` | Abrir 2 conceitos diferentes |
| `internal-link-one` | navigation | `internalLinkConcepts` | Abrir 1 conceito por link interno |
| `internal-link-two` | navigation | `internalLinkConcepts` | Abrir 2 conceitos diferentes por links internos |
| `search-open-one` | search | `searchResultConcepts` | Abrir 1 resultado da busca |
| `search-compare-two` | search | `searchResultConcepts` | Abrir 2 resultados diferentes da busca |
| `filtered-concept-one` | filter | `filteredConcepts` | Selecionar uma área e abrir 1 conceito filtrado |
| `concept-list-one` | conceptList | `conceptListConcepts` | Abrir 1 conceito pela lista acessível |
| `graph-pan-one` | graph | `meaningfulGraphPans` | Fazer 1 pan significativo |
| `graph-zoom-one` | graph | `meaningfulGraphZooms` | Fazer 1 zoom significativo |

A seleção diária escolhe no máximo uma definição de cada grupo. Assim, as três tarefas não são três variações de “abra mais conceitos”.

## Eventos e origens

`app.js` emite `concept_opened` somente após uma navegação iniciada pelo usuário concluir a abertura da nota. As origens são `graph`, `search`, `internal_link`, `concept_list`, `direct` e `history`. Hydration de rota e reload não emitem esse evento. Abrir a sheet de busca, digitar e expandir a lista também não emitem atividade qualificadora; apenas abrir o resultado/conceito chega ao tracker.

`app.js` também emite `area_filter_changed` somente quando a área realmente muda. A abertura de um resultado de busca, a abertura de um item da lista e o clique em link interno chegam à mesma função de abertura, com `source` diferente.

`graph.js` emite `graph_panned` ao terminar um gesto que ultrapassou o threshold de movimento, `graph_zoomed` após botão/teclado, pinch significativo ou grupo de wheel significativo, e `graph_fit` somente pelo controle/atalho explícito de reenquadramento. Resize, aplicação de filtro e fit automático não são atividades. Pointer moves individuais e gestos cancelados não são atividades nem gravações de storage.

## Persistência

As atividades ficam em `localStorage` na chave versionada `atlas_activity_v1`. O estado guarda somente agregados, slugs necessários para conjuntos, filtros significativos e até 120 eventos recentes por dia; mantém no máximo 30 dias. Queries e conteúdo de notas não são persistidos.

A atribuição, `completedTaskIds`, `completedAt`, histórico, streak e som ficam no estado versionado `atlas_daily_tasks_v2`. O estado antigo `atlas_daily_tasks_v1:*` não é migrado como progresso válido: a engine nova começa com tarefas novas e determinísticas.

O dia usa o calendário local (`getFullYear`, `getMonth`, `getDate`). Ao mudar o dia, a engine cria ou recupera os três IDs daquele dia, preserva histórico recente e começa a atividade do novo dia vazia.

Um dia entra no streak somente quando as três tarefas são concluídas. A conclusão individual e a conclusão do dia são idempotentes: reload e eventos repetidos não mudam `completedAt`, não incrementam streak novamente e não repetem o feedback.

Falhas de `localStorage` ou JSON corrompido reiniciam apenas essas camadas opcionais; nunca bloqueiam o Atlas.

## Som

O som usa Web Audio apenas no instante de uma nova conclusão, com volume baixo e duração inferior a 200 ms. O contexto é preparado em `pointerdown` para respeitar autoplay. `soundEnabled` fica no estado local e não é enviado para servidor.
