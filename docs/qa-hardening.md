# QA do Atlas MVP

**Data:** 2 de setembro de 2026
**Escopo:** reconstrução do Atlas em torno do grafo, sem alteração dos arquivos científicos em `content/atlas/*.md`.

## Resultado

O produto agora tem somente duas superfícies: exploração em `/` e leitura em `/atlas/<conceito>`. O fluxo é protegido pelo gate existente, seguido de onboarding curto e entrada direta no grafo. A navbar é discreta, recolhível e usa os tokens/asset oficial do Nutriwork.

O grafo usa um canvas único por superfície, `d3-force` empacotado localmente, índice compacto e uma lista acessível carregada sob demanda. A leitura mantém o mesmo grafo como minimapa; expansão, retorno à nota e histórico usam o mesmo contexto de navegação.

## Limpeza de escopo

- Removidas as páginas antigas de dashboard, estudo, busca avançada, análise, favoritos, biblioteca, trilhas e grafo paralelo.
- Removidos os plugins locais concorrentes de shell, painel contextual, fallback e footer.
- Removidos os módulos legados de estado, onboarding e views do Study Engine.
- Removido o fetch global de `contentIndex.json`, que não possui consumidor no MVP.
- Mantido somente o parser de frontmatter necessário para títulos/descrições; o painel visual de propriedades permanece desativado.
- Removida a arte genérica do Quartz e reutilizada a arte oficial do Nutriwork nos metadados sociais.

## Evidência do grafo

- 140 conceitos em `content/atlas`.
- 1.106 conexões resolvidas.
- Índice derivado compacto com versão 2, áreas, grau e adjacência.
- `npm run atlas:index` gera `quartz/static/atlas-index.json` sem reescrever o vault.

## Fluxos verificados no navegador

- Gate: senha incorreta exibe erro; senha de desenvolvimento autorizada libera a aplicação.
- Onboarding: cinco passos informativos sobre pan/zoom, hover/preview, clique/leitura, minimapa/histórico e filtros; avanço, pulo e foco funcionam.
- Exploração: canvas em tela cheia, pan, zoom por teclado, filtros por texto/área, lista acessível e ocultação/reabertura da navbar.
- Clique no canvas: abre diretamente uma nota.
- Hover/foco em link: existe exatamente uma `#atlas-preview`, com um único título e ação de abertura; não há popover nativo concorrente.
- Leitura: nota em tela ampla, minimapa com a mesma rede, botão para expandir o grafo e retorno para a nota anterior.
- Histórico: “Voltar” retorna ao contexto anterior sem perder a rota visitada.
- Responsividade: viewport desktop de 1280×720 e mobile de 390×844 conferidos sem overflow horizontal; a composição mobile mantém navbar, grafo e leitura utilizáveis.

## Validações automatizadas

- `npm run check` — TypeScript e Prettier aprovados.
- `npm test` — 163 testes, 45 suítes, 0 falhas.
- `npm run vault:check` — 140 arquivos conferidos por SHA-256.
- `npm run atlas:index` — 140 conceitos e 1.106 conexões.
- `npm run build` — build limpo aprovado, com 141 rotas de conteúdo e fallback 404.
- `npm audit --audit-level=high` — 0 vulnerabilidades.
- `git diff --check` — sem erros de whitespace.
- `git diff --name-only -- content/atlas` — nenhum arquivo científico alterado.

## Limitações conhecidas

- O gate continua sendo client-side e oferece privacidade casual, não autenticação forte.
- Não houve commit, push ou deploy; a produção não foi verificada nesta rodada.
- A validação visual foi feita em navegador local; zoom nativo de 200% e auditoria automatizada WCAG continuam fora deste ciclo.
