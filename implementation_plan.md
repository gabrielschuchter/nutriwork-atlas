# Nutriwork Atlas — plano de implementação

**Data da auditoria:** 2026-08-31  
**Estado:** Fases 0–5, 7 e 8 executadas localmente; Fase 9 parcialmente validada nos gates automatizados disponíveis; Fases 6, 9 e 10 mantêm gates explícitos abaixo.  
**Destino local planejado:** `C:\Users\gabsc\Documents\Codex\nutriwork-atlas`

## Resultado executivo da auditoria e da execução atual

Não havia checkout nem remoto do Nutriwork Atlas no workspace. O pacote em `D:\nutriwork-atlas-codex-handoff\nutriwork-atlas-codex-handoff` é um handoff documental, sem `.git`, `package.json` ou código Quartz. Os repositórios Nutriwork existentes foram apenas inspecionados e permanecem sem alterações.

O vault real é `C:\Users\gabsc\Documents\Obsidian Vault\Nutriwork`. Ele contém 140 notas Markdown científicas, 2 documentos DOCX de apoio e nenhum anexo publicável, Canvas ou Excalidraw. A rede é densa, com 2.485 wikilinks, mas possui 827 ocorrências heurísticamente não resolvidas; isso deve ser reportado e não “corrigido” por alteração científica automática.

O ecossistema visual auditado aponta para o Nutriwork digital atual: Poppins, azul institucional, temas claro/escuro, superfícies translúcidas, brilho controlado, formas orbitais e identidade de anéis. O pacote `gabriel-schuchter-design-system` é um sistema pessoal externo e não é autoridade visual do Atlas.

Depois da auditoria, o checkout foi inicializado a partir do Quartz v5 na branch `v5`, com o remoto oficial preservado como `upstream`. O slice com seis notas reais passou pelos gates locais e o sync determinístico promoveu as 140 notas Markdown do vault para `content/atlas/`. O shell, acesso global client-side, Search, Explorer, backlinks, TOC, Graph local/global, fallback textual, temas e responsividade foram implementados sem modificar o conteúdo científico.

## Escopo e gates

| Fase | Entrega | Gate de saída | Estado |
| --- | --- | --- | --- |
| 0 | Auditoria de repos, assets, design, vault e paridade; seis relatórios | Fontes, riscos e decisões documentados | Concluída |
| 1 | Bootstrap Quartz 5 com template Obsidian | `package.json`, `package-lock.json`, upstream preservado e build-base | Concluída localmente |
| 2 | Vertical slice com notas reais e fixtures de sintaxe | Build real, HTML, busca, backlinks, grafo e links do slice | Concluída localmente |
| 3 | Shell Atlas, tema, responsividade e autenticação client-side | QA em 390/844 e 1280/800, sessão e contraste | Concluída localmente |
| 4 | Paridade de leitura/navegação | OFM, Explorer, Search, backlinks, TOC, aliases, tags e propriedades verificadas | Concluída localmente |
| 5 | Graph P0 | Grafo local/global, canvas, clique, nó atual e fallback textual | Concluída localmente |
| 6 | Canvas, embeds, transclusions e stacked panes | Suporte real ou fallback explícito; sem invenção de conteúdo | Parcial: fixtures/contrato; sem uso real no vault |
| 7 | Importação completa | 140 notas importadas por sync determinístico; DOCX/admin excluídos | Concluída |
| 8 | Índices, filtros e paridade refinada | Busca/links/grafo comparados com o contrato | Concluída localmente; 827 ocorrências não resolvidas preservadas |
| 9 | Testes e QA | typecheck/lint/test/build, links, console, acessibilidade, viewports e zoom | Gates automatizados principais concluídos; proxy de 200% passou; a11y/zoom nativo ainda abertos |
| 10 | Publicação | GitHub/Vercel configuráveis e verificáveis; sem deploy não solicitado | Preparada; gates humanos abertos |

## Plano técnico

1. Clonar o Quartz 5 oficial no destino local e preservar o remoto como `upstream`; criar o projeto a partir do template `obsidian`. Fixar a instalação reprodutível com `npm ci` usando o `package-lock.json` versionado do checkout. Este checkout v5 não possui um `quartz.lock.json` separado.
2. Criar um adaptador de conteúdo local: o vault permanece somente leitura; o checkout recebe uma cópia determinística para desenvolvimento/CI. O sync deve excluir `.obsidian`, `.smart-env`, DOCX, backups, rascunhos e segredos conforme o contrato aprovado.
3. Fazer o vertical slice com notas reais sem alterar seu texto e fixtures técnicos não científicos para sintaxes exigidas pelo contrato. O slice inicial deve exercitar wikilink, alias, backlink, imagem/embed, callout, tabela, LaTeX, Mermaid, tag, propriedade, heading anchor, footnote, block reference e Canvas quando aplicável.
4. Configurar o Quartz por `quartz.config.yaml`, plugins e componentes antes de considerar alterações de core. Qualquer patch de core precisa de ADR, justificativa técnica, teste e estratégia de upstream.
5. Aplicar uma camada visual pequena e rastreável usando Poppins, tokens azuis e temas do Nutriwork auditado. Reutilizar apenas assets oficiais encontrados; não copiar os SVGs Canva gigantes para o bundle sem otimização e validação de direitos.
6. Entregar Graph como P0 após a base do Quartz: visão global e local, pan/zoom, clique para nota, indicação do nó atual, filtros mínimos, estado vazio e alternativa textual/keyboard/mobile.
7. Implementar o gate global client-side com Web Crypto, hash configurável, `localStorage`, logout, prevenção de flash quando possível, `noindex` e `robots` coerentes. É uma barreira casual para um site estático, não confidencialidade forte.
8. Importar o vault inteiro somente depois que o slice passar por build, busca, backlinks, grafo e QA. A resolução de wikilinks deve preservar links não resolvidos como informação auditável; nenhum conceito será criado automaticamente.
9. Rodar validação proporcional: TypeScript, lint, testes, build de produção, links quebrados, páginas esperadas, ausência de segredos, autenticação, busca, grafo, tema, console, navegação SPA, mobile, teclado e zoom de 200%.
10. Preparar configuração de GitHub/Vercel para o remoto aprovado. O domínio, o hash de produção e a integração do projeto Vercel continuam gates humanos.

## Critérios de aceite do slice

- `npx quartz build` conclui e produz `public/` com conteúdo real.
- Pelo menos três notas reais do vault mantêm o texto e demonstram wikilinks/aliases/backlinks.
- Explorer, Search, página de nota, breadcrumbs/TOC e Graph funcionam em desktop e mobile.
- Existe uma rota/estado de acesso protegido sem backend, com logout e sem exposição de segredo no JavaScript de configuração além do hash público necessário.
- Erros e links ausentes são visíveis e explicáveis; não há fallback silencioso.
- O build não lê ou publica `.obsidian`, `.smart-env`, DOCX ou arquivos fora do vault permitido.

## Riscos e gates humanos

- O remoto GitHub do Atlas está confirmado em `https://github.com/gabrielschuchter/nutriwork-atlas`; push somente mediante instrução explícita, já concedida para esta entrega.
- Nenhuma senha de produção foi fornecida. O mecanismo pode ser implementado, mas o hash final deve ser definido antes de uma publicação.
- Não há URL de produção do Atlas a verificar.
- Os 827 links não resolvidos precisam de triagem editorial posterior; não são autorização para editar as notas.
- Direitos de uso, nomes oficiais do lockup e eventual otimização dos SVGs precisam de validação humana.

## Evidência da execução atual

- `npm run check`: TypeScript sem erros e Prettier aprovado.
- `npm test`: 163 testes em 45 suites, 0 falhas.
- `npm ci --ignore-scripts`: instalação limpa concluída; `npm audit` e `npm audit --omit=dev` retornaram 0 vulnerabilidades após atualizar `sharp`, `esbuild` e dependências transitivas.
- `npm run vault:check`: 140 arquivos Markdown conferidos por SHA-256.
- `npx quartz build --concurrency=8 && node scripts/emit-root-static.mjs`: 141 Markdown processados, 339 arquivos emitidos e `public/robots.txt` copiado na raiz.
- Auditoria estática de saída: 144 HTML, dos quais 143 páginas de conteúdo protegidas (`404.html` excluído), com `missingGate: 0` e `missingNoindex: 0`; `/robots.txt` respondeu HTTP 200 como texto plano e bloqueia rastreadores.
- QA headless em `390x844`, `640x800` (proxy de viewport CSS para zoom de 200%) e `1280x800`: autenticação inválida/válida/logout, Search `ATP` → `ADP`, Explorer mobile, tema claro/escuro, Graph local/global, fallback textual e ausência de overflow horizontal. Contrastes finais medidos: texto escuro 13,63, título 19,39, link 10,40; tema claro com texto 5,80 e link 4,74.
- Console: 0 erros; permanecem apenas 2 avisos padrão de preload do Quartz.

Ainda não foram executadas auditoria automatizada WCAG completa, comparação com uma sessão real do Obsidian Publish, verificação em produção ou teste do zoom nativo do navegador em 200%; o viewport CSS equivalente de 640 px passou sem overflow. Esses itens continuam gates de QA/publicação, não são declarados como concluídos.

## Evidência consultada

- Handoff: `D:\nutriwork-atlas-codex-handoff\nutriwork-atlas-codex-handoff\AGENTS.md`, `CODEX_MASTER_PROMPT.md` e `docs\00_PRODUCT_BRIEF.md`–`docs\12_CODEX_WORKFLOW.md`.
- Vault: `C:\Users\gabsc\Documents\Obsidian Vault\Nutriwork`.
- Código Nutriwork digital: `C:\Users\gabsc\Documents\Codex\nutriwork-plus`.
- Design: `C:\Users\gabsc\Documents\Codex\NUTRIWORK_DESIGN_SYSTEM.md`, `D:\ID VISUAL NUTRIWORK.pdf`, `D:\Nutriwork Design System.pdf`.
- Assets de referência: `D:\Nutriwork` e `nutriwork-plus\public`.
- Quartz oficial: [CLI create](https://github.com/jackyzha0/quartz/blob/v5/docs/cli/create.md), [arquitetura e plugins](https://github.com/jackyzha0/quartz/blob/v5/docs/advanced/architecture.md), [authoring](https://github.com/jackyzha0/quartz/blob/v5/docs/getting-started/authoring-content.md).

Nenhum commit, push ou deploy havia sido feito na fase inicial de auditoria.

## Atualização pós-QA da camada pública — 2026-08-31

A rodada corretiva solicitada após a inspeção visual foi concluída no checkout do Atlas, sem alterar nenhuma nota científica:

- o parser de frontmatter do Quartz foi preservado e a visualização de propriedades foi ocultada; `description` continua disponível somente como metadado de página, não como painel público;
- a cópia técnica sobre sincronização, manifesto e validação foi removida da página pública; o rodapé padrão do Quartz e rótulos internos em inglês também foram substituídos por uma camada pública em português;
- o Explorer mobile passou a dimensionar e quebrar nomes longos sem recorte; as regras customizadas de `prefers-reduced-motion` foram removidas;
- `vercel.json` agora declara `cleanUrls: true`, mantendo os arquivos estáticos `.html` no output e expondo as rotas limpas usadas pelos links do site;
- o build final local processou as 141 entradas Markdown, e a execução nova no servidor local confirmou `/atlas/metabolismo` com conteúdo real, breadcrumb `Início`, busca sem resultados em português, grafo global rotulado em português e zero erros de console;
- a inspeção em 1280 px, 390 px e 320 px confirmou `document.scrollWidth === viewport` e nenhum link visível do Explorer ultrapassando a viewport; o build continua sujeito aos avisos de fallback de fonte do ambiente sem acesso ao Google Fonts;
- o remoto foi definido como `https://github.com/gabrielschuchter/nutriwork-atlas`. A confirmação de HTTP em produção fica para depois do push e da execução/integração da Vercel.
