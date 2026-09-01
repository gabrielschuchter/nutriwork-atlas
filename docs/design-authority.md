# Nutriwork Atlas — autoridade de design

**Data:** 2026-08-31  
**Status:** autoridade provisória de implementação, baseada em evidências locais.  
**Princípio:** o Atlas reutiliza o ecossistema Nutriwork; não recebe um design genérico novo nem o sistema visual pessoal de outro produto.

## Hierarquia de autoridade

1. Um `design-system` específico do Atlas, se vier a ser aprovado.
2. Código Nutriwork mais recente e explicitamente aprovado, especialmente `nutriwork-plus`.
3. Screenshots/PDFs de identidade visual oficiais e validados.
4. Assets oficiais e recorrência entre páginas Nutriwork.
5. Site publicado atual, quando a URL for confirmada.
6. Inferência técnica mínima documentada; preferência pessoal não substitui evidência.

No momento, o item 1 não existe no checkout Atlas. A referência operacional é a convergência entre `NUTRIWORK_DESIGN_SYSTEM.md`, o código/estilos de `nutriwork-plus`, `D:\ID VISUAL NUTRIWORK.pdf` e os assets auditados.

## Direção aprovada para o Atlas v1

| Área | Decisão | Evidência |
| --- | --- | --- |
| Tipografia da UI | Poppins, com fallbacks do sistema | `nutriwork-plus` e auditoria Nutriwork digital |
| Cor primária | Família azul Nutriwork; usar um token único por contexto e documentar a escolha | Código atual apresenta `#1263FF`, `#0B63F6`, `#29A8FF`, `#8EB9FF`; o sistema auditado também registra `#3068FF` |
| Tema | Claro e escuro, com contraste e preferência persistida | `styles.css`, `App.tsx` e contrato do handoff |
| Superfícies | Cards translúcidos/glass, bordas leves, sombras e gradientes azuis moderados | Classes `.glass-card`, `.site-header`, `.pricing-card` e tokens atuais |
| Forma | Pílulas em controles, cards arredondados e órbitas/curvas como acentos | Header, buttons, hero, footer e PDF de identidade |
| Movimento | Transições discretas, pausa/controle e `prefers-reduced-motion` obrigatório no Atlas | Componentes atuais têm carrosséis/animações; a auditoria identificou falta de redução de movimento |
| Conteúdo científico | Leitura densa, hierarquia clara, largura confortável e foco na rede | Vault e `CODEX_MASTER_PROMPT.md` |
| Marca | Usar símbolo/lockup proveniente dos assets aprovados; não digitar uma marca falsa | PDF de identidade e `favicon-nutriwork.png` |

## O que será reutilizado

- Tokens de cor e contraste derivados do Nutriwork digital, com uma camada própria de variáveis Quartz para não copiar o SPA inteiro.
- Poppins e proporções do site atual, recalibradas para leitura de notas longas.
- Padrões de header flutuante, botão de tema, cards, foco visível, links azuis e superfícies do código atual.
- O conceito visual de rede/órbita no Graph, sem transformar o grafo em decoração ilegível.
- Os assets raster do inventário somente quando a finalidade do Atlas exigir e após validação de direitos.

## O que não é autoridade

`C:\Users\gabsc\Documents\Codex\gabriel-schuchter-design-system` documenta um sistema pessoal Gabriel Schuchter. Seu overview declara que ele não importa o visual Nutriwork; suas fontes Literata/Atkinson Hyperlegible/IBM Plex Mono e paleta pessoal não devem substituir Poppins/azul Nutriwork no Atlas. Ele pode informar método de tokens, acessibilidade e documentação, mas não a aparência do produto.

Campanhas de aniversário, páginas de notícias e ilustrações editoriais também são referências contextuais, não autorização para transportar todo o layout para o Atlas.

## Aplicação técnica

1. Primeiro usar configuração, plugins, componentes e estilos do Quartz.
2. Isolar os tokens Atlas em uma folha de estilo própria e evitar alterações no core.
3. Manter a semântica de conteúdo do Quartz: landmarks, headings, links, botões, foco, skip link e `aria-label`.
4. Recompor o layout em mobile; não simplesmente reduzir o desktop.
5. Verificar 320×568, 390×844, 720×1024, 1280×800, 1440×900, 1920×1080 e zoom de 200%.
6. Aplicar redução de movimento e garantir fallback textual para o Graph.

## Inconsistências a manter visíveis

- `#3068FF` aparece como azul de marca em documentação, enquanto o código atual usa `#1263FF`/`#0B63F6`; a implementação não deve pulverizar esses valores. Um token Atlas e uma validação humana resolverão a escolha.
- O PDF possui um lockup, mas o pacote de código não possui uma fonte única de lockup completo confirmada.
- O material editorial contém textos de placeholder; nenhum placeholder será publicado.
- A auditoria do código atual identificou oportunidades de acessibilidade em menu/controles e redução de movimento; elas são requisitos de QA do Atlas.

## Gate humano

Antes de produção, confirmar: nome/lockup do Atlas, azul canônico, fontes licenciadas/hosteadas, direito de uso dos retratos/eventos/SVGs, título/description/OG e política visual de graph. Até lá, esta autoridade é suficiente para um vertical slice técnico, não para uma aprovação final de marca.

