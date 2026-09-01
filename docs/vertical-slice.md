# Vertical slice — Fase 2 (promovido)

**Fonte:** `C:\Users\gabsc\Documents\Obsidian Vault\Nutriwork`  
**Destino do import completo:** `content/atlas/`
**Regra:** as seis notas abaixo foram copiadas sem alteração científica.

| Nota | Bytes | SHA-256 |
| --- | ---: | --- |
| `Adaptação metabólica.md` | 3.572 | `876764c1bfd6cbe2786b8dcb151cbca583f44851b56284a6797e7e3b8f60c9dc` |
| `ATP.md` | 3.061 | `63d94709f825f3c5a4b1e569262746e7a9411ee017e2f821170ea2046533171a` |
| `Ciclo de Krebs.md` | 2.653 | `7ab1912e19b55c49b40b7f8cdae065425a3f22dd269f4420d8872e199667a375` |
| `Glicólise.md` | 3.661 | `76adb49b3819e39e754f2c628a69573c44370d4274c436032f97c2a02d99cec2` |
| `Homeostase.md` | 2.529 | `7ff74de8f5bebabb655e4422cc0dc7efc4d364c38ab2fd1226e9e9bdc864a7c3` |
| `Metabolismo.md` | 2.683 | `21dfe4ea097db506ae7b12c9eba99c1b62fa54cbbecafe6c4a0544c0249c7a65` |

## Verificações do recorte

- Entrada real do vault e página de índice técnica.
- Links de notas preservados em formato Obsidian.
- Links de entrada do índice usam os títulos reais e devem alimentar backlinks/Graph.
- Não há imagens, frontmatter científico, aliases YAML, tags ou Canvas reais neste recorte.
- Compatibilidade de callout, tabela, LaTeX, Mermaid, footnote, block reference e Canvas foi exercitada em fixtures técnicos separados; a fixture permanece fora do conteúdo publicável.

## Promoção

O recorte foi promovido após build real, inspeção das páginas geradas, Search, backlinks, Graph local/global, tema e QA responsivo. Os hashes acima continuam sendo a prova de que o sync não alterou essas notas.

## Evidência de promoção e importação completa

- O build final processou 141 Markdown (140 notas sincronizadas do vault mais o índice técnico) e emitiu 339 arquivos estáticos.
- `npm run vault:check` confirmou os 140 arquivos do vault por SHA-256; as seis notas do recorte continuam com os hashes acima.
- Search foi exercitado com `ATP`, com navegação para `ADP`; backlinks, TOC, Explorer, propriedades e aliases renderizaram em páginas reais.
- O Graph local e o overlay global foram ativados em navegador headless; o fallback textual permaneceu disponível para teclado e falha do gráfico.
- O gate client-side rejeitou senha inválida, aceitou a senha local de QA e voltou a bloquear após logout. A senha/hash definitivo de produção continua um gate humano.
- Em 390x844 e 1280x800, a saída final não apresentou overflow horizontal; os temas claro e escuro foram verificados com contraste medido.

O import completo foi feito por cópia determinística para `content/atlas/`, sem edição científica. As 827 ocorrências de links não resolvidos foram preservadas para triagem editorial posterior; nenhuma nota ou alias foi inventado para corrigi-las.
