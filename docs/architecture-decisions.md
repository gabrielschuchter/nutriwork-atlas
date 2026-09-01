# Nutriwork Atlas — decisões arquiteturais

**Data:** 2026-08-31  
**Estado:** decisões provisórias/aceitas para permitir avanço seguro; decisões com gate humano estão identificadas.

## ADR-001 — Novo checkout local do Atlas

**Estado:** aceito para implementação local.  
**Decisão:** criar `C:\Users\gabsc\Documents\Codex\nutriwork-atlas` como novo checkout.  
**Motivo:** a auditoria não encontrou um repositório Atlas existente nem remoto GitHub confirmado; o handoff em `D:\nutriwork-atlas-codex-handoff\...` é documentação.  
**Consequência:** nenhum remoto de destino será inventado, criado ou publicado sem solicitação explícita.

## ADR-002 — Quartz 5 upstream como base

**Estado:** aceito.  
**Decisão:** usar a branch/release v5 do Quartz oficial, com template `obsidian`, preservar o remoto como `upstream` e manter o `package-lock.json` versionado. O checkout v5 não possui um `quartz.lock.json` separado.  
**Motivo:** requisito do produto e caminho oficial de criação/plugins.  
**Consequência:** configuração/plugins/componentes/estilos têm precedência sobre alteração do core; upgrades devem ser verificáveis contra upstream.

## ADR-003 — Vault externo como source of truth

**Estado:** aceito.  
**Decisão:** `C:\Users\gabsc\Documents\Obsidian Vault\Nutriwork` é somente leitura; o projeto usa sync determinístico para CI e publicação.  
**Motivo:** evita contaminar o vault e torna o build autossuficiente.  
**Exclusões:** `.obsidian`, `.smart-env`, DOCX, backups, rascunhos, segredos e artefatos locais.

## ADR-004 — Vertical slice antes do import completo

**Estado:** aceito.  
**Decisão:** começar com notas reais pequenas e fixtures técnicos; só depois copiar as 140 notas.  
**Motivo:** detectar incompatibilidades de OFM, links, graph, search, auth e mobile antes de ampliar a superfície.  
**Consequência:** fixtures não científicos não são conteúdo do Atlas e devem ficar separados do vault importado.

## ADR-005 — Conteúdo científico imutável no pipeline

**Estado:** aceito.  
**Decisão:** não reescrever, corrigir, resumir, completar ou gerar notas automaticamente.  
**Motivo:** o vault contém conteúdo científico e links editoriais; os 827 links ausentes são achado auditável.  
**Consequência:** qualquer alias, rename, nova nota ou triagem exige revisão humana e registro.

## ADR-006 — Design authority Nutriwork digital

**Estado:** aceito provisoriamente.  
**Decisão:** Poppins, família azul Nutriwork, temas claro/escuro, superfícies glass, formas orbitais e assets oficiais são a base visual.  
**Motivo:** convergência do código atual, auditoria visual e PDFs de identidade.  
**Fora da autoridade:** o pacote pessoal `gabriel-schuchter-design-system`, campanhas e portal de notícias.  
**Gate:** confirmar azul canônico, lockup e licenças antes de produção.

## ADR-007 — Graph como P0 e sem inferência

**Estado:** aceito.  
**Decisão:** começar com o graph do Quartz/D3/Pixi disponível e adicionar controles Atlas pequenos; relações vêm somente de fontes auditáveis.  
**Requisitos:** local/global, pan/zoom, clique, nó atual, keyboard/mobile e fallback textual; evitar renderizar tudo de uma vez sem proteção.

## ADR-008 — Autenticação estática client-side

**Estado:** aceito com gate de credencial.  
**Decisão:** senha global simples com hash client-side/Web Crypto, sessão em `localStorage`, logout, prevenção de flash quando possível, `noindex` e `robots`; sem backend, Supabase, Firebase, OAuth ou CMS.  
**Limite:** HTML estático pode ser descoberto por alguém com acesso técnico; não é confidencialidade forte.  
**Gate:** a senha/hash de produção não foi fornecida e não será inventada.

## ADR-009 — Publicação GitHub + Vercel sem deploy automático nesta tarefa

**Estado:** aceito.  
**Decisão:** preparar configuração para `npm ci`, Node 22+, `npx quartz build` e output `public`; não criar remoto, commit, push ou deploy sem pedido explícito.  
**Motivo:** preservar controle humano sobre publicação, domínio e credenciais.

## ADR-010 — Core Quartz somente com justificativa

**Estado:** aceito.  
**Decisão:** não modificar core por conveniência visual.  
**Ordem de intervenção:** config → plugin → component → styles/tokens → wrapper/adaptor → patch pequeno → core.  
**Gate:** qualquer exceção terá motivo, arquivo afetado, impacto upstream, teste e plano de manutenção neste documento.

## ADR-011 — Resolução relativa para o vault importado

**Estado:** aceito após o vertical slice e o import completo.  
**Decisão:** usar `markdownLinkResolution: relative` no transformer `crawl-links`.  
**Motivo:** o vault não possui taxonomia de pastas para conteúdo e foi isolado em `content/atlas/`. A estratégia `shortest` do template Obsidian deixou links para notas existentes sem o prefixo `atlas/` em parte do build quando os alvos não eram unicamente identificados pelo conjunto de slugs. A resolução relativa preserva `[[Nota]]` dentro da pasta importada e não altera os Markdown fonte.  
**Consequência:** o build mantém os alvos ausentes como diagnóstico rastreável; no navegador, a camada de estudo leva o estudante ao diagnóstico filtrado da lacuna, sem criar, corrigir ou aliasar conceitos automaticamente. O scanner e o QA de rotas devem permanecer no pipeline.

## ADR-012 — Um único modelo de acesso no site estático

**Estado:** aceito.  
**Decisão:** manter somente o componente `@nutriwork/atlas-access` como gate global client-side e desabilitar o transformer `encrypted-pages` do Quartz.  
**Motivo:** o requisito do Atlas é uma senha global simples, sem backend; a combinação com senhas por página criaria dois modelos de sessão e uma superfície de configuração sem uso no vault atual.  
**Consequência:** a barreira oferece privacidade casual, não confidencialidade forte; o `robots.txt` bloqueia rastreadores, e a senha/hash de produção continua sendo um gate humano antes da publicação.

O `noindex, nofollow, noarchive` é injetado no `<head>` pelo hook de recursos do plugin local, sem alteração do componente Head do core Quartz.

## ADR-013 — `robots.txt` na raiz via pós-build

**Estado:** aceito.  
**Decisão:** manter a fonte em `quartz/static/robots.txt` e copiar esse arquivo para `public/robots.txt` por `scripts/emit-root-static.mjs` após o build do Quartz.  
**Motivo:** o emissor padrão do Quartz publica arquivos estáticos em `/static`, enquanto o contrato de publicação exige `robots.txt` na raiz do site.  
**Consequência:** não é necessário modificar o core; o build valida a origem e o destino e a auditoria HTTP verifica status 200 e `Disallow: /`.

## ADR-014 — Correção mobile e tokens dark auditados

**Estado:** aceito.  
**Decisão:** aplicar em `quartz/styles/custom.scss` um override responsivo mínimo para que a sidebar, o conteúdo central e o rodapé usem uma única coluna em telas estreitas; ajustar no `quartz.config.yaml` os tokens do tema dark para uma superfície realmente escura e contraste legível.  
**Motivo:** a QA inicial em 390 px encontrou overflow de min-content na grid mobile e a primeira combinação de tokens dark tinha baixo contraste.  
**Consequência:** o core Quartz permanece intacto; a validação final mediu `scrollWidth === clientWidth` em 390/1280 e contrastes acima de 4,5:1 para texto e links.

## ADR-015 — Dependências de build alinhadas ao audit de segurança

**Estado:** aceito.  
**Decisão:** atualizar `sharp` para `^0.35.4` e `esbuild` para `^0.28.2`, regenerar o `package-lock.json` com as correções transitivas de `brace-expansion` e validar a instalação com `npm ci`.  
**Motivo:** a instalação limpa inicial identificou vulnerabilidades transitivas em dependências usadas no build/preview; as atualizações foram feitas sem `npm audit fix --force` e sem alterar o core Quartz.  
**Consequência:** `npm audit` e `npm audit --omit=dev` retornam 0 vulnerabilidades, e o build final continua emitindo 339 arquivos. Atualizações futuras devem repetir a auditoria e o build antes de publicação.

## ADR-016 — Camada pública sem metadados internos de produção

**Estado:** aceito.
**Decisão:** manter o parser de frontmatter necessário ao Quartz, mas ocultar o painel visual de propriedades; remover da página pública textos de sincronização, validação, manifesto e termos internos; substituir o rodapé e os rótulos de interface expostos em inglês por componentes/rótulos públicos em português.
**Motivo:** `description`, `Properties`, `Backlinks`, `Global Graph` e detalhes de pipeline são vocabulário de implementação, não conteúdo para visitantes. O parser continua necessário para que o título e os metadados das notas sejam interpretados corretamente.
**Consequência:** o SEO permanece alimentado pelos metadados sem vazar o contrato de produção no corpo visível; o conteúdo científico e os arquivos do vault não são reescritos.

## ADR-017 — Rotas limpas na publicação estática

**Estado:** aceito.
**Decisão:** manter os arquivos `.html` gerados pelo Quartz e declarar `cleanUrls: true` no `vercel.json`, tratando `/atlas/metabolismo` como contrato público equivalente a `atlas/metabolismo.html`.
**Motivo:** os links internos do Quartz e do Explorer usam rotas limpas; sem essa configuração, a hospedagem estática pode responder 404 para o caminho sem extensão embora o arquivo exista.
**Consequência:** nenhuma alteração no core do Quartz é necessária. A rota limpa foi exercitada localmente e, após o push, confirmada na Vercel com HTTP 200 e conteúdo real em `/atlas/metabolismo`.

## ADR-018 — Índice derivado determinístico do Atlas

**Estado:** aceito.
**Decisão:** gerar `quartz/static/atlas-index.json` em `prebuild` a partir de `content/atlas/*.md`, com métricas e relações derivadas de wikilinks. O arquivo é emitido para `public/static/` por um emitter local e permanece ignorado pelo Git.
**Motivo:** Home, busca avançada, grafo, backlinks e diagnósticos precisam de uma visão comum da rede; calcular o corpus inteiro em cada navegador seria mais lento e menos determinístico.
**Consequência:** o índice não é fonte científica nem substitui as notas. Alterações de conteúdo só aparecem após o build; o script falha de forma explícita quando uma entrada externa não pode ser lida.

## ADR-019 — Classificação externa por sidecar

**Estado:** aceito.
**Decisão:** manter áreas em `data/atlas-areas.json`, fora das notas científicas, com classificação determinística por slug e fallback explícito.
**Motivo:** entregar navegação por área sem inserir frontmatter, tags ou qualquer texto editorial no vault.
**Consequência:** mudanças de taxonomia são alterações de produto auditáveis no sidecar; o conteúdo Markdown permanece byte a byte intacto.

## ADR-020 — Estado de estudo local-first

**Estado:** aceito.
**Decisão:** preferências simples ficam em `localStorage`; favoritos, histórico, retomada, sessões, reviews, destaques, cartões, listas e controles do grafo ficam em IndexedDB no banco `nutriwork-atlas-study`, com uma cópia de recuperação em `localStorage`.
**Motivo:** separar preferências pequenas de entidades de estudo e permitir crescimento local-first sem backend, autenticação nova, banco remoto ou sincronização.
**Consequência:** o estado é por navegador/dispositivo e pode ser perdido quando o usuário limpar os dados; nenhuma informação pessoal é enviada ao site. A leitura e escrita passam por um contrato versionado e tolerante a dados antigos.

## ADR-021 — Experiência de estudo como camada de componentes

**Estado:** aceito.
**Decisão:** integrar a experiência por `AtlasFrame`, componentes de produto e módulos client-side em `plugins/atlas-study-engine/client/`, mantendo Quartz Search, Explorer, TOC, auth, temas, SPA e Stacked Pages como infraestrutura. A camada de interface não precisa preservar a composição visual padrão do Quartz.
**Motivo:** entregar identidade própria, separação de responsabilidades e evolução segura sem migrar de framework nem duplicar a arquitetura de conteúdo.
**Consequência:** a navegação normal continua preferida abaixo do breakpoint mobile; sessões, revisão, paths, comparação, biblioteca e graph recall consomem o mesmo estado local. Relações estruturais só são exibidas quando têm base em wikilinks diretos ou vizinhança comum já presente na rede.

## ADR-022 — Emissão do índice ignorado sem patch no Quartz

**Estado:** aceito.
**Decisão:** usar `@nutriwork/atlas-index-emitter` para copiar o artefato gerado ao output, porque o emissor estático padrão respeita o `.gitignore` e não publica o JSON ignorado.
**Motivo:** o índice deve ser derivado no build, não commitado, e ainda assim estar disponível ao runtime público.
**Consequência:** o emitter local é pequeno e substituível; se o contrato do emissor do Quartz mudar, há um único ponto de adaptação documentado.

## ADR-023 — Termos internos fora da superfície pública

**Estado:** aceito.
**Decisão:** manter nomes técnicos apenas em código, metadados e documentação de engenharia; o texto visível usa português de produto, sem painel de propriedades ou frases de pipeline.
**Motivo:** `description`, `Properties`, preferências internas e mensagens de sincronização não são parte da experiência do estudante.
**Consequência:** metadados continuam disponíveis para SEO e build, mas não aparecem no corpo público; a verificação deve usar o texto visível renderizado, não uma busca ingênua nos atributos HTML.

## ADR-025 — Hardening de navegação e fallback visual

**Estado:** aceito após a rodada de QA de 1º de setembro de 2026.
**Decisão:** corrigir a superfície de navegação na camada Atlas: links ausentes apontam para o diagnóstico filtrado, o grafo denso reduz rótulos secundários, o Explorador acompanha a troca de viewport e o 404 usa uma composição Nutriwork própria. Remover preloads duplicados do `<head>` e manter apenas o canonical correto da Home.
**Motivo:** a auditoria encontrou 404s acionáveis, sobreposição de rótulos, estado mobile preso, ruído de preload na navegação SPA e um 404 visualmente desconectado do produto.
**Consequência:** o Quartz Search, Explorer, SPA, Stacked Pages, gate e o índice derivado permanecem as bases do produto; a auditoria de rotas, console, responsividade e hashes deve ser repetida antes de cada publicação.

## ADR-026 — Frame própria do Atlas

**Estado:** aceito para implementação local.
**Decisão:** usar `quartz/components/frames/AtlasFrame.tsx` como frame visual e estrutural das páginas, com sidebar própria, topbar, rail contextual, navegação orientada às ações e regras responsivas próprias.
**Motivo:** o Quartz é a base técnica, mas sua composição padrão não comunica o Atlas como uma experiência de estudo premium. A frame permite evoluir hierarquia, navegação e superfícies sem reescrever o parser ou o gerador de páginas.
**Consequência:** componentes upstream são reaproveitados como slots e contratos, não como limite visual. Alterações de frame precisam preservar rotas, slots de conteúdo, acessibilidade e build do Quartz 5.

## ADR-027 — Grafo Atlas com física D3 e renderer SVG semântico

**Estado:** aceito para implementação local.
**Decisão:** separar física e apresentação: `d3-force` local ao bundle cuida de `forceSimulation`, `forceManyBody`, `forceLink`, `forceCollide`, `forceCenter` e gravidade suave; SVG continua como renderer semântico para os 140 conceitos atuais, preservando labels, foco, ARIA, previews e fallback textual. O seed determinístico serve apenas para iniciar a simulação; não define o layout final.
**Motivo:** a implementação anterior substituiu as forças do Graph Community por posições hash/BFS em anéis, um loop heurístico de 75 frames e mutações diretas de `x/y`. Isso removia repulsão, molas, colisão robusta, settling contínuo, reação após drag e reheat. A separação atual recupera o comportamento físico do Quartz sem sacrificar as interações de estudo do Atlas. SVG foi mantido por ser apropriado ao tamanho atual da rede e permitir uma camada de interação acessível e inspecionável; Pixi/WebGL permanece uma opção futura caso a escala real exija.
**Consequência:** local e global usam a mesma engine e preservam posições durante filtros; sliders atualizam forças e reaqueçem a simulação; drag usa `fx/fy` temporários, collision acompanha o raio do nó e release devolve o nó à física, salvo pin explícito. O índice derivado continua sendo a única fonte de relações.

### Comparação auditada com `@quartz-community/graph`

O runtime instalado em `node_modules/@quartz-community/graph` foi lido pelo source map do pacote. O Graph Community carrega D3 e PixiJS, inicializa `forceSimulation` com `forceManyBody`, `forceCenter`, `forceLink` e `forceCollide`, mantém um render loop contínuo, reaquece em `dragstart`, fixa `fx/fy` durante o arraste, libera esses campos no `dragend`, usa zoom com limites e destrói simulation/renderer na navegação. O Atlas anterior tinha SVG recriado por render, seed radial/hash/BFS em uma área fixa, repulsão e links implementados como uma aproximação finita sem collision force, arraste que mantinha nós presos e nenhum settling depois do loop curto. Essa diferença explica a sensação de diagrama estático.

## ADR-028 — Onboarding e revisão como contratos locais substituíveis

**Estado:** aceito para implementação local.
**Decisão:** onboarding, sessões, active recall e revisão usam contratos de estado explícitos; o scheduler atual é um adaptador determinístico (`deterministic-review-adapter-v1`) e não está misturado à UI. Trilhas vivem em `data/learning-paths.json`, e cartões, highlights e anotações nunca escrevem no vault.
**Motivo:** permitir validar a experiência agora e integrar FSRS futuramente sem migrar dados pessoais nem reimplementar as telas.
**Consequência:** estados de conceito são `new`, `learning`, `scheduled`, `due` e `mastered`; qualquer integração FSRS futura deve preservar proveniência, migração versionada e revisão humana do contrato.

## ADR-029 — Home do produto na rota `/atlas/`

**Estado:** aceito para implementação local.
**Decisão:** tratar `atlas/index` como um page type virtual emitido por `@nutriwork/atlas-index-emitter`. A página mantém a rota pública `/atlas/`, usa a frame própria e monta a Home orientada a estudo; a lista de arquivos deixa de ser a superfície principal dessa rota.
**Motivo:** a entrada do Atlas precisa começar por ações, retomada, revisão, trilhas e exploração, sem alterar ou duplicar o conteúdo científico do vault.
**Consequência:** o índice continua derivado do corpus, o build segue estático e a Home não depende de um Markdown científico adicional. O canonical remove o sufixo técnico `/index` sem mudar a rota das notas.

## ADR-030 — Chrome contextual do Atlas

**Estado:** aceito para implementação local.
**Decisão:** manter Stacked Pages disponível para leitura de conceitos, mas ocultar o binder visual nas superfícies de produto (Home, estudo, revisão, trilhas, biblioteca e grafo). A frame do Atlas controla a hierarquia de navegação, enquanto overlays têm uma camada própria acima do conteúdo e do rail contextual.
**Motivo:** a navegação contextual é útil durante a leitura, mas o chrome padrão competia com as experiências principais e podia interceptar ações de modais em larguras intermediárias.
**Consequência:** conceitos preservam a navegação empilhada; dashboards e experiências de estudo têm uma composição limpa, com foco, toque e modais previsíveis.

## ADR-031 — Publicação da engine física do grafo

**Estado:** concluído em 1º de setembro de 2026.
**Decisão:** publicar o commit `a0129d6` pela integração GitHub/Vercel no projeto `nutriwork-atlas`, mantendo o domínio `https://nutriwork-atlas.vercel.app/` e a senha de desenvolvimento por autorização explícita. O deployment `dpl_GESgxGwzCSoYgq3Lm5UQQFkjkenu` foi conferido como `READY`.
**Motivo:** a camada física D3 passou pelos gates automatizados, QA de interação em desktop/tablet/mobile e smoke test público, sem alterar o vault.
**Consequência:** a produção agora usa `forceSimulation` local, drag/reheat/collision, zoom/pan, filtros e cleanup da nova implementação. Rotação futura da senha continua sendo um gate humano separado.

## Decisões ainda abertas

- senha/hash definitivo e política de rotação;
- lockup e azul institucional definitivos do Atlas;
- destino editorial dos DOCX e eventual política de rascunho;
- tratamento humano dos 381 alvos de link não resolvido;
- necessidade real de Canvas além do contrato de compatibilidade;
- integração futura do adaptador local com FSRS, sem inventar parâmetros científicos antes da decisão técnica.
