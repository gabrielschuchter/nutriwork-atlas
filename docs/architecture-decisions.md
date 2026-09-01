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
**Consequência:** links para conceitos ausentes continuam sendo links quebrados rastreáveis; não são convertidos em notas, aliases ou redirects automaticamente. O scanner e o QA de rotas devem permanecer no pipeline.

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
**Decisão:** favoritos, histórico e retomada ficam em `localStorage` sob a chave versionada `nutriwork-atlas-study-v1`.
**Motivo:** atender o uso pessoal sem backend, autenticação nova, banco ou sincronização remota.
**Consequência:** o estado é por navegador/dispositivo e pode ser perdido quando o usuário limpar os dados; nenhuma informação pessoal é enviada ao site.

## ADR-021 — Experiência de estudo como camada de componentes

**Estado:** aceito.
**Decisão:** integrar as 20 frentes por wrappers de plugin e um runtime client-side pequeno, mantendo Quartz Search, Explorer, TOC, auth, temas e SPA. O grafo visual customizado usa somente o índice derivado, com fallback textual preservado.
**Motivo:** corrigir a experiência sem forkar o core e sem criar uma segunda arquitetura de conteúdo.
**Consequência:** Stacked Pages permanece uma integração opcional do plugin comunitário; abaixo do breakpoint mobile, a navegação normal é preferida. Relações estruturais só são exibidas quando têm base em wikilinks diretos ou vizinhança comum já presente na rede.

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

## ADR-024 — Movimento único sem preferência condicional

**Estado:** aceito.
**Decisão:** o Atlas não possui CSS, JavaScript, TypeScript, hook, classe ou media query que altere animações conforme uma preferência de movimento do sistema. Transições e animações têm um único comportamento previsível.
**Origem removida:** a auditoria global confirmou que não havia implementação ativa em `quartz/`, `plugins/`, `scripts/` ou `content/`; referências residuais de contrato foram removidas de `AGENTS.md`, `docs/asset-inventory.md`, `docs/design-authority.md`, `docs/publish-parity-current.md` e `implementation_plan.md`.
**Consequência:** nenhuma API de consulta de mídia é usada para movimento; usos genéricos de `reduce` em agregações e pontuação permanecem porque não controlam animação. A busca global no código, documentação, CSS/SCSS, saída pública e artefatos de QA deve continuar retornando zero correspondências específicas. A instalação local ainda pode conter nomes estáticos dessa funcionalidade em gramáticas do realçador de sintaxe e declarações de tipo do `lightningcss`; eles não são código do Atlas, não são emitidos como comportamento e reaparecem apenas quando as dependências são instaladas. A consulta de mídia restante na saída pública é exclusivamente a preferência de esquema claro/escuro já necessária ao tema.

## Decisões ainda abertas

- integração do repositório `https://github.com/gabrielschuchter/nutriwork-atlas` com um projeto Vercel;
- domínio/base URL de produção;
- senha/hash final e política de rotação;
- lockup e azul institucional definitivos do Atlas;
- destino editorial dos DOCX e eventual política de rascunho;
- tratamento humano dos 381 alvos de link não resolvido;
- necessidade real de Canvas/stacked panes além do contrato de compatibilidade.
