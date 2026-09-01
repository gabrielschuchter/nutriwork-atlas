# Nutriwork Atlas — auditoria do vault

**Data:** 2026-08-31  
**Source of truth:** `C:\Users\gabsc\Documents\Obsidian Vault\Nutriwork`  
**Regra de segurança:** o vault original não será editado pelo pipeline de publicação.

## Inventário físico

| Item | Quantidade/medida | Resultado |
| --- | ---: | --- |
| Arquivos totais, incluindo administração | 245 | `.obsidian` e `.smart-env` presentes |
| Arquivos de conteúdo | 142 | Exclui `.obsidian` e `.smart-env` |
| Notas Markdown | 140 | Todas na raiz do vault |
| DOCX | 2 | Documentação de apoio; não publicar como nota |
| Canvas | 0 | Nenhum arquivo `.canvas` encontrado |
| Imagens/attachments no conteúdo | 0 | Não há mídia vinculada no vault |
| CSS/JS/JSON no conteúdo | 0 | Arquivos encontrados são administrativos |
| Tamanho Markdown | 629.072 bytes | Conteúdo científico pequeno o suficiente para sync simples |
| Pastas de conteúdo | `Sobre` sem arquivos | Não representa uma taxonomia utilizável ainda |

Todas as 140 notas foram inspecionadas quanto a frontmatter, headings, links e sintaxes relevantes. Todas possuem headings de segundo nível e não possuem YAML frontmatter. O padrão editorial observado inclui seções técnicas e wikilinks; `Adaptação metabólica.md`, `Metabolismo.md` e `Ciclo de Krebs.md` foram usados como amostras reais.

## Sintaxes observadas

| Sintaxe | Resultado do vault | Implicação Quartz/Atlas |
| --- | ---: | --- |
| Wikilinks | 2.485 ocorrências em 140 notas | P0; manter resolução/display text |
| Wikilinks com alias | 347 ocorrências em 119 notas | P0; testar `[[alvo\|texto]]` |
| Wikilinks embutidos/transclusion | 0 | Requisito de compatibilidade deve ser testado em fixture, não inventado no conteúdo |
| Frontmatter YAML | 0 | Não inserir metadata científico; decidir apenas metadata técnica mínima se necessário |
| Tags | 0 | Implementar suporte/filtro, mas não inventar taxonomia |
| Callouts | 0 | Fixture técnico para contrato; não alterar notas para criar exemplos |
| Imagens/embeds | 0 | Fixture técnico e documentação de fallback |
| Mermaid | 0 | Fixture técnico se o Quartz suportar |
| LaTeX | 0 | Fixture técnico para validação de math |
| Tabelas | 0 | Fixture técnico para GFM/Markdown |
| Footnotes | 0 | Fixture técnico |
| Task lists | 0 | Não observadas |
| Block references | 0 | Não observadas |
| HTML inline | 0 | Não observado |
| Dataview/DataviewJS | 0 | Plugins instalados, mas nenhum uso publicável detectado |

## Plugins Obsidian instalados

| ID | Plugin | Versão |
| --- | --- | --- |
| `obsidian-style-settings` | Style Settings | 1.0.9 |
| `obsidian-excalidraw-plugin` | Excalidraw | 2.23.8 |
| `table-editor-obsidian` | Advanced Tables | 0.23.2 |
| `obsidian-icon-folder` | Iconize | 2.14.7 |
| `dataview` | Dataview | 0.5.68 |
| `excalibrain` | ExcaliBrain | 0.2.18 |
| `breadcrumbs` | Breadcrumbs | 4.14.2 |
| `better-word-count` | Better Word Count | 0.10.1 |
| `homepage` | Homepage | 4.4.4 |
| `obsidian-hover-editor` | Hover Editor | 0.11.29 |
| `quickadd` | QuickAdd | 2.12.3 |
| `smart-connections` | Smart Connections | 4.5.3 |
| `tag-wrangler` | Tag Wrangler | 0.6.4 |
| `templater-obsidian` | Templater | 2.20.5 |

Esses plugins são evidência de uso no Obsidian, não dependências a serem transplantadas para o site. O Atlas implementará apenas comportamentos publicados relevantes: leitura, links, busca, backlinks, graph, breadcrumbs, tags/propriedades quando existirem e compatibilidade explícita. Dataview, Smart Connections, QuickAdd, Templater, Hover Editor e funções de edição permanecem fora do runtime estático v1.

## Grafo e links

Uma resolução heurística por título identificou 1.658 ocorrências resolvidas e 827 ocorrências não resolvidas em 381 alvos distintos. Os alvos ausentes incluem termos científicos como `Absorção` e `Acetil-CoA`. Esses dados representam lacunas existentes na rede, não autorização para gerar notas ou renomear conceitos.

O grafo P0 deve:

- renderizar somente edges derivadas de wikilinks reais;
- indicar links ausentes sem ocultar o problema;
- permitir visão local/global, pan, zoom, clique e nó atual;
- não congelar o browser ao tentar carregar o vault completo;
- fornecer fallback textual/keyboard/mobile.

## Estratégia de importação

- O vault é somente leitura.
- Um script determinístico copiará apenas `.md` permitidos para `content/` durante desenvolvimento/CI.
- `.obsidian`, `.smart-env`, DOCX, backups, rascunhos, arquivos com segredos e artefatos locais serão excluídos.
- O texto das notas será byte-a-byte preservado no primeiro sync; nenhum frontmatter será adicionado sem necessidade técnica documentada.
- O build será autossuficiente no CI; symlink pode ser usado apenas no desenvolvimento se o ambiente o suportar e nunca será pressuposto na publicação.
- O import completo ocorrerá somente após o vertical slice e o scanner de privacidade.

## Privacidade e conteúdo

Não foram encontrados anexos publicáveis ou segredos no conteúdo auditado. Os diretórios administrativos ficam explicitamente fora do publish. Os dois DOCX são documentação de trabalho do Atlas e não notas científicas publicáveis. Qualquer futuro arquivo com pessoa identificável, informação interna, rascunho ou credencial exigirá exclusão explícita do sync.

## Pendências não automáticas

1. Classificar os 827 links ausentes: conceito intencionalmente futuro, sinônimo, erro de nome, ou link que deve ficar quebrado.
2. Confirmar se alguma nota deve receber aliases/folder metadata técnicos sem tocar no sentido científico.
3. Confirmar a política de notas novas, rascunhos e revisão humana.
4. Validar quais plugins do Obsidian correspondem a requisito de paridade real, em vez de apenas presença no vault.

