# QA do Atlas MVP

**Data:** 3 de setembro de 2026
**Escopo:** reconstrução do Atlas em torno do grafo, revisão editorial conservadora e complementação da taxonomia prevista nas notas sincronizadas do vault.

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

- 292 conceitos publicados em `content/atlas`: 140 notas preexistentes e 152 notas novas.
- 324 termos em desenvolvimento descobertos automaticamente pelos wikilinks.
- 616 nós e 3.126 conexões no índice derivado.
- Áreas, grau, adjacência e estado de publicação são derivados sem alterar as notas.
- `npm run atlas:index` gera `quartz/static/atlas-index.json` sem reescrever o vault.
- A revisão editorial anterior preservou as 140 notas existentes; a complementação atual adicionou os 152 conceitos ausentes sem reescrever esse conjunto. A fórmula do Escore Z permanece na nota existente, com sua tabela e exemplos já organizados.

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
- Touch: pinça com escala baseada no snapshot inicial, âncora no centroide, pan contínuo ao levantar um dedo, threshold de tap, hitboxes touch próximas de 44px, pinch sobre node sem abertura acidental e nodes sem drag direto no touch.
- Phone/tablet: header de uma linha, busca quase full-screen, filtro por áreas em sheet, menu dedicado, controls de mapa próximos de 48–52px, safe areas, viewport dinâmica e minimapa com scroll vertical preservado.
- Responsividade: viewport desktop, tablet portrait/landscape e phone portrait/landscape mantêm renderer e câmera dimensionados por `ResizeObserver`/`visualViewport`, sem overflow horizontal ou área morta estrutural.

## Validações automatizadas

- `npm run check` — TypeScript e Prettier aprovados.
- `npm test` — 166 testes, 45 suítes, 0 falhas.
- `npm run vault:check` — 292 arquivos conferidos por SHA-256.
- `npm run atlas:index` — 616 nós e 3.126 conexões, incluindo termos em desenvolvimento.
- `npm run build` — build limpo aprovado, com 293 rotas de conteúdo e fallback 404.
- `npm audit --audit-level=high` — 0 vulnerabilidades.
- `git diff --check` — sem erros de whitespace.
- Auditoria da taxonomia — 229/229 conceitos resolvidos, com aliases nominais documentados e zero duplicatas normalizadas.
- Auditoria das notas novas — 152/152 com H1 e as seis seções obrigatórias na ordem definida; zero placeholders de referência e zero ocorrências dos padrões anti-IA auditados.
- Sincronização — 152 notas adicionadas e notas preexistentes preservadas, com um ajuste pontual de link nominal para a rede.

## Limitações conhecidas

- O gate continua sendo client-side e oferece privacidade casual, não autenticação forte.
- Commit, push e deploy devem ser confirmados separadamente com o SHA, deployment e alias oficial.
- A validação touch foi feita com emulação de dispositivo móvel Chromium e viewport tablet/desktop no navegador local; WebKit/Safari real em iPhone/iPad e hardware Android não estavam instalados/disponíveis neste ambiente. Zoom nativo de 200% e auditoria automatizada WCAG continuam fora deste ciclo.
