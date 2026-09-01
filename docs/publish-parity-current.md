# Nutriwork Atlas — matriz de paridade atual

**Data:** 2026-09-01
**Escopo:** matriz de paridade com funções relevantes do Obsidian/Obsidian Publish.  
**Importante:** a matriz foi atualizada após o bootstrap, importação completa, build e QA headless desta execução. O que foi validado localmente está separado do que depende de conteúdo/produção ou de uma comparação real com o Obsidian Publish.

## Estado de referência

Não foi localizada uma publicação atual do Atlas nem um repositório existente. O `nutriwork-plus-noticias-mvp` é um portal editorial separado e não é evidência de paridade do Atlas. O vault é a fonte de verdade do conteúdo; o Obsidian local é a referência de autoria e relacionamento.

## Matriz

| Capacidade | Prioridade | Uso observado no vault | Baseline/decisão | Evidência de aceite |
| --- | --- | --- | --- | --- |
| Markdown/GFM e headings | P0 | Sim | Implementado via Quartz | Build + nota real |
| Wikilinks | P0 | 2.485 | Implementado; 827 ocorrências continuam ausentes no source | Links clicáveis e links ausentes auditáveis |
| Aliases de display em wikilink | P0 | 347 | Implementado | Alias renderiza sem alterar título |
| Backlinks | P0 | Derivados da rede | Implementado | Lista correta na nota real |
| Search | P0 | Necessário para 140 notas | Implementado | Busca por título e corpo, teclado |
| Explorer/folders | P0 | Notas na raiz; `Sobre` vazio | Implementado sem inventar taxonomia | Navegação e estado vazio |
| Graph local/global | P0 | Rede densa, links ausentes | Base Quartz + canvas global/local e fallback textual implementados | Overlay global ativo, canvas local/global, nó atual e fallback sem erros |
| Breadcrumbs | P0 | Plugin Breadcrumbs instalado | Implementado; hierarquia `atlas` é técnica | Página real sem breadcrumb científico falso |
| TOC e heading anchors | P0 | Headings em todas as notas | Implementado | Navegação por teclado e deep-link |
| Tema claro/escuro | P0 | Ecossistema Nutriwork usa ambos | Implementado com tokens auditados e controle visual alinhado ao site oficial | Persistência, transição e contraste medidos nos dois temas |
| Mobile/tablet/desktop reading | P0 | Conteúdo científico denso | Validado localmente em 390x844, 768x1024, 1024x768 e viewports desktop, sem overflow horizontal | Zoom nativo 200% e matriz completa de produção ainda abertos |
| Tags | P0 de contrato, uso atual 0 | Nenhuma tag | Suporte pronto; não criar tags | Fixture + estado vazio |
| YAML properties | P0 de contrato, uso atual 0 | Nenhum frontmatter | Suportar sem injetar conteúdo | Fixture e scanner |
| Callouts | P0 de compatibilidade | 0 no vault | Verificado na fixture técnica | Render ou fallback explícito |
| Code highlighting | P0 de compatibilidade | 0 no vault | Verificado na fixture técnica | Build e leitura |
| Tabelas | P0 de compatibilidade | 0 no vault | Verificado na fixture técnica | Render responsivo |
| Footnotes | P0 de compatibilidade | 0 no vault | Verificado na fixture técnica | Links ida/volta |
| Math/LaTeX | P0 de compatibilidade | 0 no vault | Verificado na fixture técnica | Render ou fallback documentado |
| Mermaid | P0 de compatibilidade | 0 no vault | Verificado na fixture técnica | Render seguro ou fallback |
| Imagens/attachments | P0 de compatibilidade | 0 no vault | Verificado com SVG sintético; sem media científica inventada | Fixture/asset real |
| Embeds/transclusions | P1 | 0 | Verificado na fixture técnica; sem uso real no vault | Build da fixture e fallback/limite documentado |
| Block references | P1 | 0 | Verificado na fixture técnica; sem uso real no vault | Build da fixture e limite documentado |
| Canvas | P1 | 0 arquivos | Compatibilidade coberta por fixture/contrato; nenhum Canvas científico inventado | Uso real no vault e comparação Publish ainda não aplicáveis |
| Previews/hover | P1 | Hover Editor instalado | UX útil, sem depender de plugin Obsidian | Keyboard/mobile/sem flash |
| Stacked panes | P1 | Não medido no vault | Integrado para leitura de conceitos; binder visual oculto nas superfícies de produto | Navegação reversível e fallback mobile |
| Aliases YAML/redirects | P1 | Frontmatter ausente | Testado na fixture; nenhum alias científico inventado | Rota/alias sem duplicar conteúdo |
| Dataview/DataviewJS | P2 | Plugins instalados, uso 0 | Fora do runtime v1 | Exclusão documentada |
| Smart Connections/IA | P2 | Plugin instalado | Fora do runtime; sem edges inventadas | Grafo somente wikilinks |
| Edição/administração | P2 | Obsidian local | Fora do site estático | Sem CMS/backend |
| Login com backend | Não escopo | Não aplicável | Proibido no contrato | Apenas gate client-side |

## Regras de interpretação

- “Uso observado 0” não elimina a exigência de compatibilidade se o contrato a classifica como P0; exige fixture técnico separado.
- A ausência de Canvas e embeds no vault não autoriza fingir que paridade foi entregue.
- Plugins do Obsidian não são automaticamente plugins web. O Atlas deve reproduzir funções publicadas relevantes, não a implementação interna do Obsidian.
- O grafo nunca deve inferir relações sem wikilink, metadata aprovada ou outra fonte auditável.

## Gates de verificação

1. **Concluído localmente:** vertical slice com seis notas reais, fixtures de compatibilidade e promoção para o import completo.
2. **Concluído localmente:** build com 140 notas do vault; 153 Markdown processados, 356 arquivos emitidos pelo Quartz e scanner SHA-256 aprovado.
3. **Concluído localmente:** Search, backlinks, Graph, tema, auth, navegação, console e responsividade em mobile, tablet e desktop.
4. **Concluído com pendência editorial:** 827 ocorrências referentes a 381 alvos não resolvidos foram preservadas e não receberam autofix.
5. **Aberto:** comparação visual/funcional com uma sessão real do Obsidian Publish, auditoria automatizada WCAG e zoom nativo de 200%. A verificação pública do deployment atual foi concluída; o proxy de viewport CSS em 640 px passou sem overflow.

## Evidência da execução atual

- `npm run check`: TypeScript e Prettier aprovados.
- `npm test`: 163 testes em 45 suites, 0 falhas.
- `npm run vault:check`: 140 hashes conferidos.
- Build: 153 Markdown processados, 356 arquivos emitidos pelo Quartz, `robots.txt` copiado na raiz e 156 HTML presentes (155 rotas funcionais + 404); `/robots.txt` respondeu HTTP 200 com `Disallow: /`.
- Saída estática: todas as 155 rotas funcionais responderam 200; uma rota inexistente respondeu 404; a Home em `/atlas/` contém a composição de estudo e não a listagem de arquivos.
- QA headless: senha errada bloqueia, senha local de QA libera, logout bloqueia novamente; onboarding abre na primeira utilização e persiste conclusão; Search navega de ATP para ADP; Explorer mobile abre/fecha; Graph local/global, filtros, sliders, arraste, pinning, fullscreen e Graph Recall estão presentes; tema claro/escuro persiste; `scrollWidth` e `clientWidth` coincidem nos viewports verificados.
- Console: 0 erros e 0 avisos em dez logs de navegação normal da sessão limpa.

## Atualização corretiva da camada pública — 2026-08-31

- O painel visual de propriedades foi ocultado sem remover o parser de frontmatter; assim, campos como `description` não aparecem para o visitante e continuam disponíveis para metadados da página.
- A interface pública não exibe mais a frase técnica sobre conteúdo científico, cópia byte a byte, manifesto SHA-256 ou detalhes equivalentes de produção. O rodapé padrão e rótulos de interface em inglês foram substituídos por texto público em português.
- O Explorer foi validado aberto e fechado em 320 px e 390 px, com nomes longos quebrando dentro da largura disponível.
- `vercel.json` usa `cleanUrls: true`; a execução local e a implantação em `https://nutriwork-atlas.vercel.app/` confirmaram HTTP 200 em `/atlas/metabolismo`, que abre a página real e não somente `/atlas/metabolismo.html`.

## Evolução da experiência de estudo — 2026-09-01

| Capacidade | Implementação atual | Evidência local |
| --- | --- | --- |
| Home de estudo | Dashboard derivado com retomada, hubs, atualização, áreas, aleatório, mapa e estrutura | Home renderizada com índice real de 140 conceitos |
| Onboarding | Cinco etapas, progresso, navegação por teclado, pulo, fechamento e reabertura por Preferências | Sessão limpa confirmou primeira abertura, Escape, reabertura e persistência |
| Sessões e active recall | Duração, área/trilha/misto, progresso, prompt de recordação, rating e retomada | Sessão local concluiu conceitos e persistiu histórico/reviews em IndexedDB |
| Revisão | Estados new/learning/scheduled/due/mastered e adaptador determinístico isolado | `/revisar` exibiu agenda após ratings e sobreviveu ao reload |
| Trilhas | Sequência externa em `data/learning-paths.json`, progresso e continuação | `/trilhas` e CTA da Home renderizados sem alterar o vault |
| Biblioteca pessoal | Destaques, anotações, listas e cartões básicos/cloze associados ao conceito | Seleção de trecho criou e recarregou itens em `/biblioteca` |
| Comparação | Dois ou três conceitos com headings equivalentes alinhados | ATP e conceito relacionado renderizaram linhas e células lado a lado |
| Áreas | Sidecar externo `data/atlas-areas.json` | 7 áreas e filtro compartilhado em Home, Explorer, busca e grafo |
| Grafo | SVG local/global, profundidade 1–3, busca, área, nó atual, hubs, fullscreen, recentralização e legenda | `/grafo` e nota real exercitados em desktop e mobile |
| Mais conectados | Grau total, entradas e saídas | `/mais-conectados` com ranking derivado |
| Lacunas | Alvo, ocorrências, notas de origem e contexto | `/lacunas-da-rede` com 381 alvos e 827 ocorrências |
| Busca avançada | Texto, campo, área, grau mínimo, data e ordenação | combinação `homeostase` + título + área + grau validada |
| Palette/atalhos | Ctrl/Cmd+K, `/`, `G`, `B`, `F`, `R`, `Esc` | palette abre e fecha; ações de navegação e foco testadas |
| Favoritos/recentes | Estado de estudo em IndexedDB e páginas próprias | favorito e histórico sobreviveram ao reload |
| Relações/previews | relações diretas e vizinhança comum; preview com trecho, grau e ações | hover de wikilink real exibiu dados e abertura de painel; nó do grafo abre conceito |
| Stacked Pages | plugin comunitário integrado no desktop, com labels corretos; fallback normal no mobile | navegação `Metabolismo` → `Catabolismo` formou cadeia lateral |
| Estrutura da rede | órfãs, uma conexão, periféricas, pontes e componentes | `/estrutura-da-rede` renderizou métricas derivadas |
| Mapa do Atlas | conceitos, conexões, áreas, componentes, lacunas, órfãs/periféricas e hubs | `/mapa-do-atlas` renderizou as seções e métricas |
| Superfície pública | labels em português; metadados internos fora do corpo | inspeção de `body.innerText` sem rótulos técnicos internos |

O índice atual tem 140 conceitos, 1.106 conexões, 381 alvos não resolvidos, 7 áreas e 4 componentes. Os links não resolvidos seguem sendo diagnóstico editorial e não recebem autofix. A auditoria formal contra Obsidian Publish real e WCAG automatizada continuam fora da evidência local; a produção pública atual foi verificada separadamente.

## Publicação verificada — 2026-09-01

- Commit publicado: `52b2c447dfe93ec2f63fb414cbec8b8f5a8745fa` em `origin/main`.
- Deployment Vercel: `dpl_EdvX1fFKCPy8eb4Ptg2rVvmzYUZ2`, estado `READY`, com alias em `https://nutriwork-atlas.vercel.app/`.
- O `/atlas/` público agora é a Home virtual de estudo e não contém o `page-listing` legado; canonical e `og:url` foram conferidos nas rotas limpas.
- Rotas principais, assets derivados (`atlas-index.json` e `learning-paths.json`) e `robots.txt` responderam HTTP 200; rota inexistente de controle respondeu 404.
- Playwright em produção confirmou gate, onboarding, sessão Active Recall, avaliação, reload, tema persistente, busca Ctrl/Cmd+K, Graph Recall, grafo com 140 nós e seis sliders; o console permaneceu sem erros.
