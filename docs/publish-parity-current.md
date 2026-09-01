# Nutriwork Atlas — matriz de paridade atual

**Data:** 2026-08-31  
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
| Tema claro/escuro | P0 | Ecossistema Nutriwork usa ambos | Implementado com tokens auditados | Persistência e contraste medidos nos dois temas |
| Mobile/desktop reading | P0 | Conteúdo científico denso | Validado localmente em 390x844, proxy CSS 640x800 para zoom de 200% e 1280x800, sem overflow horizontal | Zoom nativo 200% e matriz completa de produção ainda abertos |
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
| Stacked panes | P1 | Não medido no vault | Só após leitura/links/graph | Navegação reversível |
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
2. **Concluído localmente:** build com 140 notas do vault; 141 Markdown processados, 339 arquivos emitidos e scanner SHA-256 aprovado.
3. **Concluído localmente:** Search, backlinks, Graph, tema, auth, navegação, console e responsividade em 390x844/1280x800.
4. **Concluído com pendência editorial:** 827 ocorrências referentes a 381 alvos não resolvidos foram preservadas e não receberam autofix.
5. **Aberto:** comparação visual/funcional com uma sessão real do Obsidian Publish, auditoria automatizada WCAG, zoom nativo de 200% e verificação em produção. O proxy de viewport CSS em 640 px passou sem overflow.

## Evidência da execução atual

- `npm run check`: TypeScript e Prettier aprovados.
- `npm test`: 163 testes em 45 suites, 0 falhas.
- `npm run vault:check`: 140 hashes conferidos.
- Build: 141 Markdown processados e 339 arquivos emitidos; `/robots.txt` respondeu HTTP 200 com `Disallow: /`.
- Saída estática: 143 páginas de conteúdo com gate e `noindex`; a página `404.html` é a única exceção técnica.
- QA headless: senha errada bloqueia, senha local de QA libera, logout bloqueia novamente; Search navega de ATP para ADP; Explorer mobile abre/fecha; Graph local/global e fallback textual estão presentes; tema claro/escuro persiste; `scrollWidth` e `clientWidth` coincidem em 390x844, no proxy CSS 640x800 e em 1280x800.
- Console: 0 erros e 2 avisos padrão de preload do Quartz.

## Atualização corretiva da camada pública — 2026-08-31

- O painel visual de propriedades foi ocultado sem remover o parser de frontmatter; assim, campos como `description` não aparecem para o visitante e continuam disponíveis para metadados da página.
- A interface pública não exibe mais a frase técnica sobre conteúdo científico, cópia byte a byte, manifesto SHA-256 ou detalhes equivalentes de produção. O rodapé padrão e rótulos de interface em inglês foram substituídos por texto público em português.
- O Explorer foi validado aberto e fechado em 320 px e 390 px, com nomes longos quebrando dentro da largura disponível; não há regra customizada de `prefers-reduced-motion`.
- `vercel.json` usa `cleanUrls: true`; a execução local confirmou que `/atlas/metabolismo` abre a página real e não somente `/atlas/metabolismo.html`. O HTTP da implantação Vercel ainda deve ser confirmado depois do push e da integração do projeto.
