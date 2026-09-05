# Tarefas diárias do Atlas

As tarefas diárias são uma camada client-side opcional do Atlas. Os módulos vivem em `plugins/atlas-study-engine/client/daily-tasks/` e são concatenados pelo runtime existente, sem dependências novas, requests ou polling.

## Fluxo

- `tasks.js` mantém 50 templates reutilizáveis.
- `task-storage.js` mantém persistência isolada em chaves `atlas_daily_tasks_v1:*`; o formato atual migra a tarefa única antiga sem descartar o histórico local.
- `task-progress.js` aplica contagem deduplicada e limite da atividade.
- `task-engine.js` escolhe três tarefas por data + identificador local, evita repetições recentes, acompanha visitas e atualiza o streak quando o conjunto do dia é concluído.
- `daily-tasks.js` conecta a engine à UI e aos eventos existentes.

O app emite `atlas:data-ready` após o índice ser carregado e `atlas:concept-opened` quando uma nota é aberta. A abertura pelo grafo, pela busca, por preview ou por uma nota relacionada informa sua origem para que tarefas específicas possam ser verificadas sem duplicar a navegação existente.

## Persistência

As chaves são independentes para tarefas do dia, progresso por tarefa, conclusão, conceitos visitados, histórico, streak, preferência de som e identificador local. Falhas de `localStorage` são ignoradas porque a atividade nunca pode bloquear o Atlas.

O som usa Web Audio apenas no instante da conclusão, com volume baixo e duração inferior a 200 ms. O contexto é preparado no `pointerdown` do grafo para respeitar as políticas de autoplay e a preferência `soundEnabled` é local e pode ser alternada no painel.
