# Nutriwork Atlas — decisões arquiteturais atuais

**Data:** 2 de setembro de 2026
**Princípio:** o Atlas é o grafo.

## 1. O produto tem duas superfícies

A raiz `/` é a superfície de exploração. Uma rota `/atlas/<conceito>` é a superfície de leitura. Login e onboarding aparecem antes da exploração; não há dashboard, biblioteca pessoal, revisão, trilhas, estatísticas ou páginas analíticas.

Essa restrição é deliberada: cada controle precisa melhorar exploração, descoberta, leitura ou navegação entre conceitos. Se não cumprir uma dessas funções, fica fora do MVP.

## 2. Quartz é a base de publicação

Quartz 5 permanece como gerador estático e parser do vault. A composição padrão foi substituída por `quartz/components/frames/AtlasFrame.tsx`, que usa os contratos de página e os plugins Markdown necessários sem carregar shells, widgets ou índices de descoberta que não pertencem ao produto.

## 3. O grafo usa canvas e física local

O grafo global e o minimapa usam `canvas`, um renderer por superfície e `d3-force` local. O canvas reduz a quantidade de elementos DOM e permite desenhar arestas e nós sem re-renderizar uma árvore de componentes a cada tick.

A física combina repulsão, links, colisão, centralização e gravidade suave. O seed é determinístico apenas para iniciar a rede. Posições e câmera são persistidas na sessão; o minimapa reutiliza essas posições para preservar contexto espacial.

## 4. O índice é pequeno e derivado

`scripts/build-atlas-index.mjs` lê as notas e produz um índice versionado em memória de build. Ele contém apenas título, slug, área, resumo, adjacência, grau e arestas resolvidas. Relações são provenientes de wikilinks reais; o script não altera nem completa o vault.

O emitter local copia o índice para `static/`. O runtime não carrega o índice completo de conteúdo do Quartz, texto integral de notas ou dados de estudo que não são necessários para o grafo.

## 5. Existe um único sistema de interação

`plugins/atlas-study-engine/client/app.js` delega ações e mantém uma única preview `#atlas-preview`. `enablePopovers` fica desativado. O canvas chama o mesmo `openConcept` e `showGraphPreview` usados pelos links de notas, eliminando handlers concorrentes e a possibilidade de duas previews da mesma nota.

O ciclo SPA destrói a instância do grafo antes da troca de rota e monta uma nova instância depois da navegação. Isso evita listeners, simulações e renderizações órfãs.

## 6. Leitura preserva o contexto

Ao abrir uma nota, o layout atual é salvo. A nota mostra o mesmo grafo em escala de minimapa. “Expandir grafo” retorna à exploração e salva a nota atual; “Voltar à nota” recupera esse conceito. O botão “Voltar” usa o histórico quando a entrada veio do grafo.

## 7. A interface usa a autoridade visual do Nutriwork

Tokens de azul, tipografia Poppins, superfícies translúcidas e o símbolo oficial do Nutriwork vêm do design system e dos assets existentes no ecossistema Nutriwork. O banner social é o asset oficial `nutriwork-banner-pc.webp`; não há ícones ou marca genéricos substituindo a identidade existente.

## 8. Acesso é explicitamente limitado

O gate atual calcula SHA-256 no navegador e guarda apenas o hash configurado no `localStorage`. Ele evita acesso casual a um site estático, mas não protege conteúdo contra inspeção do bundle. Qualquer requisito de autenticação real deve ser uma decisão separada, com backend e política de segurança próprios.

## 9. Conteúdo científico não é código de interface

`content/atlas/*.md` permanece somente leitura. A classificação de áreas e o índice são derivados fora das notas. Links não resolvidos continuam sendo um diagnóstico editorial; não são corrigidos automaticamente nem usados para inventar conceitos.

## 10. Gates atuais

As mudanças devem passar por typecheck, Prettier, testes, build, `npm run vault:check`, auditoria do diff e navegador em desktop/mobile. Publicação, commit e push são etapas separadas e exigem solicitação explícita.
