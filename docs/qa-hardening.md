# QA do Atlas MVP

**Data:** 2 de setembro de 2026
**Escopo:** reconstrução do Atlas em torno do grafo, sem alteração dos arquivos científicos em `content/atlas/*.md`.

## Resultado

O produto agora tem somente duas superfícies: exploração em `/` e leitura em `/atlas/<conceito>`. O fluxo é protegido pelo gate existente, seguido de onboarding curto e entrada direta no grafo. A navbar é discreta, recolhível e usa os tokens/asset oficial do Nutriwork.

O grafo usa um único canvas reparentado entre fullscreen e minimapa, `d3-force` empacotado localmente, índice compacto e uma lista acessível carregada sob demanda. A leitura mantém a mesma instância, posições, forças e câmera; expansão, retorno à nota e histórico usam o mesmo contexto de navegação.

## Limpeza de escopo

- Removidas as páginas antigas de dashboard, estudo, busca avançada, análise, favoritos, biblioteca, trilhas e grafo paralelo.
- Removidos os plugins locais concorrentes de shell, painel contextual, fallback e footer.
- Removidos os módulos legados de estado, onboarding e views do Study Engine.
- Removido o fetch global de `contentIndex.json`, que não possui consumidor no MVP.
- Mantido somente o parser de frontmatter necessário para títulos/descrições; o painel visual de propriedades permanece desativado.
- Removida a arte genérica do Quartz e reutilizada a arte oficial do Nutriwork nos metadados sociais.

## Evidência do grafo

- 140 conceitos publicados em `content/atlas`.
- 381 termos em desenvolvimento descobertos automaticamente pelos wikilinks.
- 521 nós e 1.811 conexões no índice derivado versão 3.
- Áreas, grau, adjacência e estado de publicação são derivados sem alterar o vault.
- `npm run atlas:index` gera `quartz/static/atlas-index.json` sem reescrever o vault.

## Fluxos verificados no navegador

- Gate: senha incorreta exibe erro; senha de desenvolvimento autorizada libera a aplicação.
- Onboarding: seis passos informativos sobre o papel do grafo, pan/zoom, hover/preview, clique/leitura, minimapa/histórico, filtros e termos em desenvolvimento; avanço, pulo, repetição e foco funcionam.
- Exploração: canvas contínuo em `100vw × 100dvh`, pan sem `translateExtent`, zoom por roda/pinch/teclado e controles `− ○ +`, filtros por texto/área, lista acessível e ocultação/reabertura da navbar.
- Clique no canvas: abre diretamente uma nota.
- Termos sem nota: aparecem sutis/acinzentados, abrem o estado “Este termo está em desenvolvimento.” e retornam ao mesmo contexto.
- Hover/foco em link: existe exatamente uma `#atlas-preview`, com um único título e ação de abertura; não há popover nativo concorrente.
- Leitura: nota em foco, minimapa com a mesma rede/instância, botão para expandir o grafo e retorno para a nota anterior.
- Histórico: “Voltar” retorna ao contexto anterior sem perder a rota visitada.
- Interface: onboarding repetível, ajuda com contatos oficiais, tema, previews, loaders e mostrar/ocultar senha sem mudança de layout.
- Responsividade: viewport desktop, tablet e mobile devem manter renderer e câmera dimensionados por `ResizeObserver`/`visualViewport`, sem overflow horizontal ou área morta estrutural.

## Validações automatizadas

- `npm run check` — TypeScript e Prettier aprovados.
- `npm test` — 163 testes, 45 suítes, 0 falhas.
- `npm run vault:check` — 140 arquivos conferidos por SHA-256.
- `npm run atlas:index` — 521 nós e 1.811 conexões, incluindo termos em desenvolvimento.
- `npm run build` — build limpo aprovado, com 141 rotas de conteúdo e fallback 404.
- `npm audit --audit-level=high` — 0 vulnerabilidades.
- `git diff --check` — sem erros de whitespace.
- `git diff --name-only -- content/atlas` — nenhum arquivo científico alterado.

## Limitações conhecidas

- O gate continua sendo client-side e oferece privacidade casual, não autenticação forte.
- Commit, push e deploy devem ser confirmados separadamente com o SHA, deployment e alias oficial.
- A validação visual foi feita em navegador local; zoom nativo de 200% e auditoria automatizada WCAG continuam fora deste ciclo.
