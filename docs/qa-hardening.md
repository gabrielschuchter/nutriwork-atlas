# QA, hardening e polish do Atlas

**Data:** 1º de setembro de 2026
**Escopo:** auditoria pós-implementação do Quartz 5, sem alteração dos arquivos científicos em `content/atlas/*.md`.

## Resultado executivo

O Atlas foi revisado como produto navegável, com build limpo e validação em navegador. A superfície principal agora é uma Home de estudo em `/atlas/`, emitida como page type virtual e montada pela frame própria do Atlas. Também foram corrigidos problemas de navegação interna que levavam a 404, fechamento do Explorador em mudanças de viewport, rótulos técnicos expostos na interface, sobreposição de rótulos em grafos densos, foco/teclado de overlays, limites de popovers, estado local de estudo e metadados/caches da navegação SPA.

Quartz 5 continua sendo a base. Não foram adicionados serviços, banco, autenticação nova, IA, dependências ou framework. O índice derivado permanece determinístico e é gerado no prebuild.

## Evidência do corpus

- 140 conceitos em `content/atlas`.
- 1.106 conexões resolvidas.
- 381 alvos de lacuna e 827 ocorrências não resolvidas.
- 7 áreas, 4 componentes desconectados, 2 notas isoladas, 5 periféricas, 3 com uma conexão e 1 ponte.
- Build local atual: 153 arquivos Markdown processados e 156 arquivos HTML emitidos, sendo 155 rotas funcionais e o fallback `404.html`.
- Auditoria estática atual: 155 rotas geradas, todas respondendo 200; rota inexistente respondendo 404; nenhum asset local ausente; nenhum link interno resolvido quebrado.

## Correções e refinamentos

### Navegação e links

- Links resolvidos agora usam o slug canônico mesmo quando a URL contém caracteres codificados.
- Links não resolvidos deixam de apontar para uma página inexistente e abrem o diagnóstico filtrado da lacuna correspondente.
- O diagnóstico de lacunas aceita a consulta de um conceito específico e mantém a visão geral quando nenhum filtro é informado.
- A origem e o destino continuam compatíveis com a navegação SPA, histórico do navegador e deep links.
- `/atlas/` é a Home real do produto: a rota mostra retomada, revisão, recomendação, trilhas, áreas e entrada para o grafo, sem expor a listagem bruta de arquivos.
- A Home, as páginas analíticas e a frame de estudo mantêm navegação direta para conceitos reais.

### Onboarding e estudo

- O onboarding é progressivo, possui cinco etapas, indicador de progresso, avanço/volta, pulo, fechamento, foco contido e reabertura por Preferências.
- A primeira utilização abre a apresentação após o acesso; a conclusão fica em preferência local e um fechamento sem conclusão permite retomar depois.
- Sessões, active recall, ratings, retomada de leitura, trilhas e recomendações explicáveis usam contratos locais explícitos; o conteúdo científico nunca é reescrito.
- Destaques, anotações, listas e cartões básicos/cloze são criados pela seleção de trechos e persistem localmente com vínculo ao conceito de origem.

### Explorador, overlays e estado local

- O Explorador é fechado no mobile e reaberto corretamente ao retornar para desktop, sem preservar um estado visual inadequado da viewport anterior.
- Command palette, busca avançada, painel contextual e fullscreen do grafo receberam foco inicial, fechamento por Escape, retorno ao elemento acionador e contenção de foco.
- Overlays travam o scroll da página apenas enquanto estão abertos.
- Favoritos e recentes tratam dados inválidos do armazenamento local defensivamente.
- A lista de favoritos permite remoção direta e atualiza o estado sem backend.
- Previews de links são limitados à viewport e incluem ação explícita para abrir o painel contextual.

### Grafo e leitura

- O grafo SVG ganhou composição espaçada, assentamento determinístico, pan/zoom, pinch, arraste de nó, pinning, recenter, fit, fullscreen nativo com fallback, busca e foco de nó.
- O painel oferece filtros de âmbito, área e profundidade, além de sliders de distância, repulsão, força das conexões, escala de nós, escala de rótulos e opacidade de arestas.
- Hover/foco destaca a vizinhança, reduz distrações e abre preview contextual; Graph Recall revela as conexões reais do índice após a tentativa do estudante.
- Em grafos densos, rótulos secundários são ocultados até busca, foco ou hover; o nó atual e hubs permanecem visualmente identificáveis.
- O fallback do grafo usa títulos legíveis em vez de expor o caminho técnico do arquivo.
- Abas contextuais têm semântica ARIA e navegação por setas.
- Stacked Pages foi preservado para leitura de conceitos, com limite configurado de oito painéis; o binder visual não compete com Home, dashboards ou grafo.

### Interface e metadados

- Rótulos internos de produção não aparecem como texto de interface.
- A página 404 deixou o template visual mínimo do Quartz e agora usa uma composição Nutriwork responsiva, com retorno claro para a Home.
- O canonical e o endereço social da Home apontam para a raiz pública correta, sem o sufixo técnico de índice.
- O controle de tema segue a geometria e a troca de thumb do controle oficial do Nutriwork, com preferência persistente e transição entre superfícies claro/escuro.
- Preloads duplicados de CSS e JavaScript foram removidos do `<head>`: os recursos definitivos já são descobertos no carregamento inicial e a duplicação gerava avisos durante a navegação SPA.
- O sitemap/RSS continua desativado por decisão de privacidade; `robots.txt`, favicon, canonical, Open Graph e `noindex` foram conferidos.

## Arquitetura das mudanças

- `quartz/components/frames/AtlasFrame.tsx`: shell próprio, sidebar, topbar, rail contextual e composição responsiva do produto.
- `plugins/atlas-study-engine/client/`: módulos separados para dados, estado, grafo, views, onboarding e aplicação client-side.
- `plugins/atlas-ui/runtime.js`: ponto de entrada compatível que reexporta o runtime modular do Study Engine.
- `plugins/atlas-ui/components/index.js`: rótulos públicos, page shells, CSS de integração, acessibilidade visual e estados dos componentes.
- `plugins/atlas-index-emitter/index.js`: índice derivado, learning paths e page type virtual da Home em `/atlas/`.
- `data/learning-paths.json`: trilhas externas ao vault, sem alteração das notas científicas.
- `scripts/build-atlas-index.mjs` e `public/static/atlas-index.json`: índice derivado determinístico do corpus.
- Estado de estudo: IndexedDB `nutriwork-atlas-study`, com backup local; preferências simples usam `nutriwork-atlas-preferences-v2`.
- `quartz.config.yaml`: integração preservando os plugins existentes e a configuração de produção.
- `quartz/components/Head.tsx`: mudança técnica pequena e justificada para canonical/OG corretos da Home; os preloads duplicados também foram removidos para manter o console limpo na SPA.
- `quartz/components/pages/404.tsx`: exceção técnica necessária para retirar o 404 do template mínimo upstream e aplicar a identidade do Atlas sem alterar conteúdo científico.

## Validação executada

- `npm run check` — passou: TypeScript sem erros e Prettier sem divergências.
- `npm test` — passou: 163 testes, 45 suítes, 0 falhas.
- `npm run vault:check` — passou: 140 arquivos conferidos por SHA-256.
- `npm run build` — passou em build limpo, com 156 arquivos HTML emitidos (155 funcionais e `404.html`).
- `npm audit --audit-level=high` — passou: 0 vulnerabilidades; nenhuma dependência nova foi adicionada nesta rodada.
- Auditoria estática de rotas, links e assets — passou conforme os números acima.
- Inventário completo das rotas geradas: [`docs/route-inventory.md`](route-inventory.md).
- Navegador real via Playwright CLI: gate, onboarding limpo, reabertura por Preferências, deep links, SPA, reload, busca, command palette, Explorer, favoritos, recentes, sessão, active recall, review, trilhas, biblioteca, comparação, highlights, anotações, cartões, grafo local/global/fullscreen, Graph Recall, previews, Stacked Pages, gaps e 404.
- Viewports CSS verificados: 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×800, 1366×768, 1440×900 e 1920×1080. Não houve overflow horizontal; a alternância mobile/desktop preservou o layout e os controles móveis ficaram dentro da viewport.
- Teclado verificado: avanço/volta e Escape no onboarding, foco contido, Ctrl/Cmd+K, Escape na palette e Enter em nó do grafo.
- Touch/pointer verificado: fechamento do drawer por toque fora, SVG do grafo com área de interação própria e suporte de pointer para arraste/pan/pinch.
- Console do fluxo limpo: 0 erros e 0 avisos relevantes em navegação normal após a correção de preloads; logs informativos upstream do Explorador não foram mascarados.
- As imagens finais de QA foram geradas em `output/playwright` e permanecem artefatos locais ignorados pelo Git.

## Integridade e segurança editorial

- Comparação byte a byte do vault: 0 divergências; o agregado SHA-256 antes/depois foi `f57e56264b48b7f6d736be3b73453373e071065075de578c7ee9b555476515b9`.
- Nenhum arquivo em `content/atlas/*.md` foi alterado.
- O gate mantém, por autorização explícita do responsável em 1º de setembro de 2026, o hash da senha compartilhada de desenvolvimento `nutriwork-atlas-dev`; a barreira é client-side e oferece privacidade casual, não autenticação forte.
- A varredura de marcadores de pendência nas áreas alteradas não encontrou itens abertos.
- A revisão de segredos não encontrou credenciais reais no código alterado.

## Limitações remanescentes

- A sessão local não conseguiu baixar Poppins do Google Fonts; o gerador de imagem social usou Arial apenas nesse ambiente offline. A entrega pública deve ser conferida com rede disponível.
- O profiler `0x` não está instalado; foi feita análise de tamanho de bundles/assets, mas não perfil de CPU.
- O Chromium headless não aplicou os atalhos de zoom do navegador; a matriz de viewports cobre responsividade CSS, não substitui uma conferência manual de zoom real em 200%.
- Não foi instalado um auditor automatizado WCAG; contraste foi verificado por tokens/computed style, inspeção visual e teclado.
- O conector Browser embutido falhou ao iniciar nesta máquina; a validação foi executada pelo Playwright CLI local.
- O gate continua usando, por autorização explícita, o hash client-side da senha compartilhada de desenvolvimento; qualquer uso além de privacidade casual requer uma camada de autenticação apropriada.
- O deployment de produção `dpl_EdvX1fFKCPy8eb4Ptg2rVvmzYUZ2` foi publicado em `https://nutriwork-atlas.vercel.app/` com estado `READY`. A verificação pública confirmou `/`, `/atlas/`, `/hoje`, `/revisar`, `/trilhas`, `/biblioteca`, `/grafo`, `/atlas/atp`, `/mapa-do-atlas`, os dois assets derivados e `robots.txt` com HTTP 200; uma rota inexistente respondeu 404. O snapshot público não apresenta mais `page-listing` em `/atlas/`, e os canonicals/OG apontam para as rotas limpas.
