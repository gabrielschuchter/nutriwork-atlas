# Nutriwork Atlas — plano e estado do MVP

## Estado de lançamento do roadmap — 7 de setembro de 2026

Escopo autorizado: remover os itens demonstrativos do roadmap e transformar a rota `/roadmap` em um convite público para sugestões até que exista o primeiro item real. Preservar a identidade visual, as rotas, a integração `/api/atlas-suggestions` e o layout tradicional para o futuro.

- `roadmapItems` começa como lista vazia; `buildRoadmapColumns` continua preparando as três colunas apenas quando itens reais forem curados na fonte.
- A UI escolhe automaticamente entre o estado de abertura e as colunas tradicionais a partir de `roadmapHasItems`; o estado vazio não renderiza contadores nem colunas vazias.
- O estado de abertura usa um cabeçalho, um convite central, três provocações clicáveis, a nota de avaliação da equipe e CTAs que reutilizam o mesmo formulário.
- O formulário mantém somente título e descrição, com placeholders orientativos, loading visível em `Enviando…` e feedback de sucesso `Sugestão recebida` após confirmação do envio.

Gates específicos: `npm run check`, `npm test`, `npm run vault:check`, `npm run atlas:index`, `npm run build`, `npm audit --audit-level=high`, `git diff --check`, inspeção do HTML sem dados fictícios, QA dos seis CTAs, fluxo de envio e teste temporário do layout tradicional com um item real removido ao final.

## Engine real de Tarefas de hoje — 6 de setembro de 2026

Escopo autorizado: substituir as aproximadamente 50 tarefas textuais por uma lista pequena de tarefas declarativas, objetivamente detectáveis e localmente persistentes. Preservar o grafo, busca, filtros, navegação, access gate, responsividade e a arquitetura sem backend.

- `activity-tracker.js` é a camada única de eventos semânticos e agrega somente slugs, métricas e eventos recentes limitados.
- `tasks.js` define dez tarefas em famílias/grupos distintos; `task-engine.js` escolhe três grupos por data, deriva progresso da atividade e mantém conclusão/streak idempotentes.
- `app.js` informa origens de abertura (`graph`, `search`, `internal_link`, `concept_list`, `direct`, `history`) e mudanças reais de filtro; `graph.js` informa pan/zoom significativos ao terminar os gestos.
- `atlas_activity_v1` e `atlas_daily_tasks_v2` substituem a lista antiga de 50 templates e o estado `atlas_daily_tasks_v1:*`; progresso antigo não é inventado nem migrado.
- Testes cobrem métricas únicas, busca, filtro, links, lista, reload, conclusão, streak, novo dia, corrupção de storage, som e calendário local.

Gates específicos: `npm run check`, `npm test`, `npm run vault:check`, `npm run atlas:index`, `npm run build`, `npm audit --audit-level=high`, `git diff --check` e fluxo manual com o painel fechado.

## Navegação espacial, labels progressivos e fluxos auxiliares — 5 de setembro de 2026

Escopo autorizado: transformar o grafo em um mapa espacial explorável, manter as posições estáveis após a estabilização do layout, revelar labels apenas conforme zoom e viewport, suavizar conexões não interativas, corrigir o envio de sugestões, preservar o contexto de retorno das páginas legais e impedir quebra de palavras em títulos. Preservar a identidade visual, as interações do grafo, `content/atlas` e as dependências atuais.

- O layout global usa um mundo significativamente maior, forças de repulsão, links, colisão e gravidade recalibrados; câmera, pan, zoom e labels não reaquece o layout.
- O canvas calcula labels somente quando câmera, viewport, hover ou física invalidam essa camada. A seleção considera razão de zoom em relação ao fit inicial, posição no viewport, distância ao centro, grau do nó, orçamento por área, visibilidade integral, colisão com nós e sobreposição entre labels.
- Conexões continuam sempre visíveis em ambos os temas, com traço mais discreto; apenas as arestas diretamente ligadas à bolinha sob hover recebem ênfase local.
- A navegação SPA reinstala o runtime correto do roadmap, enfileira sugestões até confirmação da API e preserva uma sessão local válida durante falhas transitórias de identificação. Links legais carregam o contexto `login` ou `atlas` para que o retorno respeite o fluxo de origem.
- Títulos usam `word-break: normal`, `overflow-wrap: normal` e ajuste progressivo de fonte quando não couberem, sem permitir que uma palavra seja quebrada.

Gates específicos: `npm run check`, `npm test`, `npm run vault:check`, `npm run build`, inspeção visual desktop em light/dark, zoom/pan com culling e estabilidade de posições, fluxo SPA de sugestões, fluxos legais com e sem sessão e `git diff --name-only -- content/atlas` vazio.

## Revisão de acesso, carregamento e páginas auxiliares — 5 de setembro de 2026

Escopo autorizado: corrigir a experiência de entrada e senha global, eliminar o carregamento infinito do grafo, separar páginas legais leves, estabilizar o asset da marca, tornar as tarefas realmente múltiplas e corrigir o feedback sonoro. Preservar `content/atlas`, o grafo, o gate client-side existente, o contrato de navegação e as dependências atuais.

Diagnóstico antes da alteração:

- `main`, `origin/main` e o deployment de produção estavam no commit `f2f9957`; o checkout tinha alterações locais ainda não publicadas.
- A produção entregava `atlas-graph-root`, o painel de tarefa e o placeholder de carregamento nas quatro rotas legais. A biblioteca local já tinha 50 templates, mas a engine e a UI expunham somente uma tarefa por dia.
- O som era preparado em `click`, enquanto a abertura de nós pelo canvas usa Pointer Events; a conclusão ainda acontecia depois do carregamento assíncrono da nota.
- A logo usava URL relativa e o índice não tinha timeout nem cancelamento efetivo de uma transição concorrente.

Implementação planejada:

- Usar a URL absoluta do asset oficial e microcopy explícita de “senha global do Atlas”, disponibilizada no Nutriwork Plus, deixando claro que não é a senha do e-mail.
- Gerar o runtime pesado em `public/static` depois do build estático, carregá-lo somente na superfície do grafo e dar ao índice/às notas limite de tempo, erro recuperável e proteção contra respostas de navegação obsoletas.
- Renderizar rotas legais como documentos independentes, sem `AtlasApp`, mount, canvas, painel de tarefas ou onboarding, mantendo o padrão visual e o link “Voltar ao Atlas”.
- Migrar o armazenamento local da tarefa única para três tarefas determinísticas por dia, com progresso por tarefa e conclusão visual. Preparar Web Audio em `pointerdown`, tocar um único tom curto apenas para novas conclusões e manter a preferência local.

Gates de conclusão: `npm run check`, `npm test`, `npm run vault:check`, `npm run build`, inspeção do HTML gerado, navegação real em desktop e verificação da implantação final no domínio oficial. Nenhuma alteração editorial deve aparecer em `content/atlas`.

## Identificação por e-mail — 4 de setembro de 2026

Escopo autorizado: identificação por e-mail → Google Sheets → persistência local → gate global existente → Atlas. Preservar Quartz, hash/sessão da senha, grafo e os 292 Markdown científicos.

- Reutilizar `AtlasAccess` e seus estilos, incluindo temas, safe areas e viewport dinâmica.
- Acrescentar função Vercel `/api/atlas-identify` com validação, limite de payload, proteção simples contra abuso e timeout.
- Registrar em planilha privada via Apps Script server-side: uma linha por e-mail normalizado, datas e contador; lock para concorrência e idempotência para tentativas repetidas.
- Persistir identificação somente após confirmação da gravação. Registrar novas visitas sem solicitar novamente o e-mail; erros devem oferecer nova tentativa e impedir avanço silencioso.
- Verificar estados, sessão/senha, recorrência real na planilha, responsividade e ausência de segredos no build. Depois executar gates, commit/push, deploy e fluxo em produção.
- Snapshot local: `snapshot/pre-email-identification-2026-09-04`. Preservar `.agents/` e `skills-lock.json` preexistentes e não rastreados.

**Data:** 2 de setembro de 2026
**Produto:** o Atlas é o grafo.

## Definição

O fluxo do produto é acesso, onboarding curto, exploração do grafo e leitura de uma nota. A exploração acontece em `/`; a leitura acontece em `/atlas/<conceito>`. Não existem superfícies paralelas no MVP.

O conteúdo científico em `content/atlas/*.md` é sincronizado deterministicamente a partir do vault, que é a fonte de verdade. Alterações editoriais explícitas devem ser feitas na fonte e propagadas por `npm run vault:sync`, com hashes registrados no manifesto. O arquivo `data/atlas-areas.json` classifica os conceitos sem inserir metadados nas notas. O índice derivado é `quartz/static/atlas-index.json`.

## Arquitetura implementada

- Quartz 5 continua responsável pelo parsing Markdown, geração estática, navegação SPA e assets.
- `AtlasFrame` controla as duas superfícies: navbar glass discreta, canvas do grafo, leitura ampla e minimapa.
- `plugins/atlas-study-engine/client/graph.js` mantém um único canvas reparentado entre fullscreen e minimapa. O renderer ocupa a viewport real, mede resize/orientação dinamicamente, mantém pan/zoom sem parede artificial e calcula fit pelo bounding box visível. Os nós não viram elementos DOM individuais; a lista textual acessível é criada somente quando solicitada.
- `plugins/atlas-study-engine/client/graph-physics.js` usa `d3-force` local com repulsão, links, colisão, centralização e gravidade suave.
- `plugins/atlas-study-engine/client/app.js` é o único coordenador de preview, ações, onboarding, filtros, histórico e lifecycle SPA.
- `scripts/build-atlas-index.mjs` emite somente os dados necessários para nós, arestas, áreas, adjacência e filtros.

## Contrato de interação

| Intenção | Comportamento |
| --- | --- |
| Hover ou foco | uma única preview contextual |
| Clique no nó ou em “Abrir nota” | abre a nota do conceito |
| Link dentro da nota | mostra preview e permite continuar pela rede |
| “Voltar” | retorna ao contexto anterior no histórico |
| “Expandir grafo” | volta suavemente à mesma rede com layout/câmera persistidos |
| Clique no minimapa | navega pelo mesmo grafo espacial |
| Filtro | reduz a rede por texto ou área |
| Termo sem nota | abre o estado minimalista “Este termo está em desenvolvimento.” |
| `− ○ +` | ajusta zoom ou faz fit-to-graph baseado nos nós visíveis |

## Limpeza de escopo

Foram removidas as páginas, rotas, dados, componentes, estilos e módulos do produto antigo que não melhoravam exploração, descoberta, leitura ou navegação de conceitos. O build não injeta mais o índice global de conteúdo do Quartz nem carrega widgets paralelos.

O parser de frontmatter continua ativo apenas para títulos e descrições. O painel visual de propriedades está desativado. A autenticação mantida é um gate client-side de privacidade casual; não deve ser tratada como autenticação forte.

## Gates de entrega

```bash
npm run check
npm test
npm run vault:check
npm run atlas:index
npm run build
git diff --check
git diff --name-only -- content/atlas
```

O navegador deve cobrir primeiro acesso, onboarding, clique, hover/preview único, nota, minimapa, histórico, filtros, navbar recolhível, tema, ajuda, senha, fit/zoom e viewports mobile/desktop. Commit, push e deploy são executados somente após a revisão final e os gates passarem.

## Estado verificado

- 140 conceitos publicados, 381 termos em desenvolvimento, 521 nós e 1.811 conexões.
- Build com as rotas de conteúdo publicadas e fallback 404; termos em desenvolvimento não geram notas vazias.
- TypeScript, Prettier e 166 testes aprovados.
- Máquina touch, matemática da pinça, sheets mobile, safe areas e regimes phone/tablet passaram por QA emulado; a suíte agora tem 166 testes aprovados.
- Revisão editorial conservadora: 140 notas lidas, 31 alteradas para remover resíduos de produção e organizar a fórmula/exemplos do escore Z.
- Integridade SHA-256 dos 140 arquivos científicos aprovada.
- Fluxo local validado com canvas de largura/altura iguais à viewport, sem overflow estrutural no fullscreen.
