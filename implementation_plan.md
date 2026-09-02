# Nutriwork Atlas — plano e estado do MVP

**Data:** 2 de setembro de 2026
**Produto:** o Atlas é o grafo.

## Definição

O fluxo do produto é acesso, onboarding curto, exploração do grafo e leitura de uma nota. A exploração acontece em `/`; a leitura acontece em `/atlas/<conceito>`. Não existem superfícies paralelas no MVP.

O conteúdo científico em `content/atlas/*.md` é a fonte de verdade e permanece byte a byte intacto. O arquivo `data/atlas-areas.json` classifica os conceitos sem inserir metadados nas notas. O índice derivado é `quartz/static/atlas-index.json`.

## Arquitetura implementada

- Quartz 5 continua responsável pelo parsing Markdown, geração estática, navegação SPA e assets.
- `AtlasFrame` controla as duas superfícies: navbar glass discreta, canvas do grafo, leitura ampla e minimapa.
- `plugins/atlas-study-engine/client/graph.js` usa um canvas por superfície. Os nós não viram elementos DOM individuais; a lista textual acessível é criada somente quando solicitada.
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
| “Expandir grafo” | volta à mesma rede com layout persistido |
| Clique no minimapa | navega pelo mesmo grafo espacial |
| Filtro | reduz a rede por texto ou área |

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

O navegador deve cobrir primeiro acesso, onboarding, clique, hover/preview único, nota, minimapa, histórico, filtros, navbar recolhível, tema e viewports mobile/desktop. Nenhum commit, push ou deploy faz parte deste ciclo.

## Estado verificado

- 140 conceitos científicos e 1.106 conexões resolvidas.
- Build com 141 rotas de conteúdo: raiz, 140 notas e fallback 404.
- TypeScript, Prettier e 163 testes aprovados.
- Integridade SHA-256 dos 140 arquivos científicos aprovada.
- Fluxo frio validado em 390×844 e 1280×720 sem overflow horizontal.
