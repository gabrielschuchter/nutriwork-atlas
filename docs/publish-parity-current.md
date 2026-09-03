# Nutriwork Atlas — escopo e paridade do MVP

**Data:** 3 de setembro de 2026
**Fonte de conteúdo:** `content/atlas/*.md`
**Fonte de relações:** wikilinks resolvidos no índice derivado

## Contrato do MVP

| Área | Entrega | Evidência local |
| --- | --- | --- |
| Acesso | Gate antes da aplicação, erro visível e saída | Senha inválida bloqueia; senha válida libera; saída bloqueia novamente |
| Onboarding | Cinco passos curtos e informativos | Primeiro acesso limpo abre o onboarding e percorre 01/05 a 05/05 |
| Exploração | Canvas global, pan, zoom, hover, clique e filtros | Grafo responsivo em desktop/mobile; filtro vazio e recuperação verificados |
| Preview | Uma preview por interação | Um `#atlas-preview`, um título e uma ação; popover paralelo ausente |
| Leitura | Nota ampla com links internos | Conceitos reais abrem e continuam navegáveis |
| Minimapa | Mesmo grafo e posições da exploração | Clique no minimapa troca de conceito sem abandonar a rede |
| Contexto | Histórico, expansão e retorno à nota | Voltar, expandir grafo e retornar à nota foram exercitados |
| Navbar | Glass UI discreta, tema e ocultação | Navbar esconde/reabre e tema claro/escuro mantém a largura |
| Acessibilidade | Foco visível, lista textual sob demanda e canvas nomeado | Lista alternativa e controles acessíveis no snapshot do navegador |

## O que está fora

Não fazem parte do MVP dashboards, páginas de métricas, biblioteca pessoal, favoritos, revisão espaçada, trilhas, cards, widgets, busca paralela, painéis contextuais, estatísticas ou qualquer fluxo que não leve diretamente à exploração do grafo, à descoberta de conceitos, à leitura ou à navegação.

## Dados e desempenho

- 292 conceitos publicados, 324 termos em desenvolvimento e 3.126 conexões no índice do grafo.
- O índice contém somente dados usados pelo grafo, filtros e previews.
- A renderização usa um canvas por superfície; nós e arestas não são uma árvore DOM individual.
- A lista acessível é lazy e fornece a alternativa textual sem penalizar a exploração visual.
- Posições e câmera são reutilizadas entre exploração e minimapa por sessão.

## Validação executada

- `npm run check`: TypeScript e Prettier aprovados.
- `npm test`: 166 testes em 45 suítes, 0 falhas.
- `npm run vault:check`: 292 hashes aprovados.
- `npm run atlas:index`: 616 nós e 3.126 conexões, incluindo termos em desenvolvimento.
- `npm run build`: 293 rotas de conteúdo e fallback 404.
- Auditoria editorial: 152 notas novas com estrutura obrigatória, sem placeholders de referência e sem padrões anti-IA auditados.
- Navegador: primeiro acesso, onboarding, filtros, clique no canvas, preview único, abertura de nota, minimapa, histórico, expansão, retorno, navbar, tema e viewports 390×844/1280×720.
- `git diff --name-only -- content/atlas`: somente as notas incluídas na revisão editorial conservadora; o gate de paridade continua aprovado.

## Limitações explícitas

O gate é client-side e oferece privacidade casual, não autenticação forte. A validação visual foi local; a execução em hardware físico iPhone/iPad com Safari/WebKit, auditoria automatizada WCAG e teste de zoom nativo de 200% continuam não verificados.
