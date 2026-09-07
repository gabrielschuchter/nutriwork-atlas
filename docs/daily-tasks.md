# Tarefas diárias do Atlas

As tarefas diárias são uma camada client-side do Atlas. Não há backend, analytics externo, polling ou dependência nova para o progresso. O runtime concatena os módulos em `plugins/atlas-study-engine/client/daily-tasks/`.

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

- `tasks.js` mantém quatro definições declarativas. A engine escolhe três por dia de forma determinística, sem depender da origem da navegação ou de variedade artificial.
- `activity-tracker.js` é a camada única de tracking. Seus eventos aceitos são `concept_opened`, `area_filter_changed`, `graph_panned`, `graph_zoomed` e `graph_fit`; abrir a busca, digitar ou expandir a lista nunca cria progresso de tarefa.
- `task-progress.js` calcula o progresso a partir dos agregados do dia; não existe contador paralelo de progresso por tarefa.
- `task-engine.js` persiste a atribuição do dia, deriva progresso, grava `completedAt` individualmente e atualiza o streak de forma idempotente.
- `daily-tasks.js` reage a `atlas:activity`, portanto o progresso continua sendo registrado mesmo quando o painel está fechado.

## Tarefas disponíveis

| ID | Métrica | Alvo | Regra |
| --- | --- | --- | --- |
| `unique-concepts-two` | `uniqueConceptsOpened` | 2 | Abra 2 conceitos diferentes. |
| `area-filter-one` | `areaFilterChanges` | 1 | Escolha uma área para explorar. |
| `graph-pan-one` | `meaningfulGraphPans` | 1 | Arraste o grafo para explorar outra região. |
| `graph-zoom-one` | `meaningfulGraphZooms` | 1 | Use o zoom no grafo. |

A seleção diária escolhe três dessas quatro definições. Cada métrica é um agregado semântico já emitido pelo Atlas.

## Eventos

`app.js` emite `concept_opened` somente após uma navegação iniciada pelo usuário concluir a abertura da nota. A engine conta o slug único do conceito; a origem `graph`, `search` ou link interno não muda o progresso. Hydration de rota e reload não emitem esse evento.

`app.js` emite `area_filter_changed` somente quando a área realmente muda. `graph.js` emite `graph_panned` ao terminar um gesto que ultrapassou o threshold de movimento e `graph_zoomed` após botão/teclado, pinch significativo ou grupo de wheel significativo. Resize, aplicação de filtro, fit automático, pointer moves individuais e gestos cancelados não são atividades.

## Persistência

As atividades ficam em `localStorage` na chave versionada `atlas_activity_v1`. O estado guarda somente agregados, slugs necessários para conjuntos, filtros significativos e até 120 eventos recentes por dia; mantém no máximo 30 dias. Queries, conteúdo de notas e origem de navegação não são persistidos.

A atribuição, `completedTaskIds`, `completedAt`, histórico, streak e som ficam no estado versionado `atlas_daily_tasks_v2`. O estado antigo `atlas_daily_tasks_v1:*` não é migrado como progresso válido: a engine nova começa com tarefas novas e determinísticas.

O dia usa o calendário local. Ao mudar o dia, a engine cria ou recupera os três IDs daquele dia, preserva histórico recente e começa a atividade do novo dia vazia. Um dia entra no streak somente quando as três tarefas são concluídas. Falhas de `localStorage` ou JSON corrompido reiniciam apenas essas camadas opcionais; nunca bloqueiam o Atlas.

## Som

O som usa uma única instância Howler com o asset local curto `/static/task-complete.mp3` e volume baixo. O `autoUnlock` do Howler é armado quando o som está habilitado; o botão de som também oferece uma confirmação curta na própria interação do usuário. `soundEnabled` fica no estado local e não é enviado para servidor.
