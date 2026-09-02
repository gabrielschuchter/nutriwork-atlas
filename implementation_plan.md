# Nutriwork Atlas — plano e estado do MVP

**Data:** 2 de setembro de 2026
**Produto:** o Atlas é o grafo.

## Definição

O fluxo do produto é acesso, onboarding curto, exploração do grafo e leitura de uma nota. A exploração acontece em `/`; a leitura acontece em `/atlas/<conceito>`. Não existem superfícies paralelas no MVP.

O conteúdo científico em `content/atlas/*.md` é a fonte de verdade e permanece byte a byte intacto. O arquivo `data/atlas-areas.json` classifica os conceitos sem inserir metadados nas notas. O índice derivado é `quartz/static/atlas-index.json`.

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
- TypeScript, Prettier e 163 testes aprovados.
- Integridade SHA-256 dos 140 arquivos científicos aprovada.
- Fluxo local validado com canvas de largura/altura iguais à viewport, sem overflow estrutural no fullscreen.
