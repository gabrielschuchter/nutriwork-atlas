# AGENTS.md — Contrato permanente do Nutriwork Atlas

Este arquivo contém regras de execução permanentes. Leia antes de qualquer alteração.

## 1. Missão

Construir e manter o **Nutriwork Atlas**, uma plataforma web de conhecimento e estudo alimentada por um vault do Obsidian, com Quartz 5 como motor de publicação e Vercel como hospedagem.

O Atlas deve preservar a riqueza de navegação do Obsidian/Publish e evoluir para uma experiência de aprendizagem baseada em relações entre conceitos.

## 2. Fonte da verdade

### Conteúdo

O vault do Obsidian é a fonte da verdade do conteúdo.

Nunca:

- reescrever conteúdo científico para “facilitar o build”;
- corrigir conceitos científicos sem instrução explícita;
- apagar notas problemáticas;
- converter o vault para um CMS;
- mover conteúdo científico para arquivos TS/JSON sem necessidade;
- criar uma segunda base de conteúdo manual.

Pode:

- criar adaptadores;
- criar índices derivados;
- criar manifestos gerados;
- criar caches;
- criar metadados derivados;
- criar arquivos de auditoria;
- adicionar frontmatter apenas quando explicitamente aprovado ou quando o campo for técnico e não alterar significado.

### Design

O design deve ser extraído das fontes reais do ecossistema Nutriwork.

Não inventar:

- fonte;
- paleta;
- logo;
- ícone;
- ilustração;
- glow;
- radius;
- sombra;
- breakpoint;
- tom visual.

Auditar primeiro.

## 3. Hierarquia de autoridade visual

Na ausência de uma hierarquia mais recente encontrada no próprio workspace, usar:

1. documentação nova em `/design-system`;
2. código local mais recente explicitamente aprovado;
3. screenshots marcados como referência final;
4. assets oficiais;
5. site atualmente publicado;
6. componentes recorrentes;
7. material histórico;
8. inferência;
9. preferência estética do agente.

Uma implementação antiga não se torna normativa apenas por existir.

## 4. Regra do Quartz

Preferência de intervenção:

1. configuração;
2. plugin Quartz;
3. componente próprio;
4. stylesheet/tokens;
5. wrapper/adaptador;
6. patch pequeno documentado;
7. alteração de core apenas como último recurso.

Antes de alterar core:

- explicar por que plugin/configuração não resolve;
- registrar arquivo e motivo em `docs/architecture-decisions.md`;
- preservar possibilidade de merge com upstream;
- adicionar teste para o comportamento alterado.

Nunca substituir Quartz inteiro por Next/Astro/Vite por preferência pessoal.

## 5. Upstream

Manter o projeto apto a receber atualizações do Quartz.

- preservar `upstream` quando possível;
- preservar `quartz.lock.json`;
- instalar plugins de forma reproduzível;
- evitar edição manual de `.quartz/plugins/` se a mudança puder viver em plugin próprio;
- registrar patches locais;
- não atualizar Quartz/plugins no meio de uma tarefa não relacionada.

## 6. Segurança e autenticação

A v1 usa **senha global simples client-side**.

Objetivo: impedir acesso casual, não fornecer confidencialidade forte.

Regras:

- não apresentar o mecanismo como “seguro”;
- preferir hash da senha em vez de plaintext legível;
- usar Web Crypto (`crypto.subtle.digest`) quando adequado;
- persistir sessão simples em `localStorage`;
- oferecer logout;
- bloquear visualmente a aplicação antes de revelar a UI;
- adicionar `noindex,nofollow`;
- manter `robots.txt` bloqueando crawlers;
- não adicionar backend sem requisito.

A existência de conteúdo no HTML/build estático é aceita nesta versão.

## 7. Conteúdo e privacidade

O site é privado-ish, não secreto.

Não incluir em builds:

- arquivos explicitamente pessoais;
- notas internas operacionais;
- drafts proibidos;
- arquivos com marcação de exclusão;
- credenciais;
- chaves;
- `.env`;
- backups;
- lixo de editor;
- pastas administrativas não destinadas ao Atlas.

Criar política de `ignorePatterns`.

## 8. Graph é função central

Não tratar o graph como efeito visual.

Ele deve:

- abrir rapidamente;
- suportar graph local e global;
- permitir pan/zoom;
- permitir click;
- identificar nó atual;
- funcionar com teclado ou alternativa equivalente;
- ter fallback/lista textual quando necessário;
- funcionar em mobile de maneira deliberada;
- evitar travar com o vault completo.

Qualquer customização do graph deve preservar as funções base antes de adicionar funções educacionais.

## 9. Compatibilidade Obsidian

Não quebrar silenciosamente:

- `[[wikilinks]]`;
- aliases;
- embeds/transclusions;
- headings;
- block references quando existentes;
- callouts;
- tags;
- frontmatter/properties;
- footnotes;
- tabelas GFM;
- task lists;
- Mermaid;
- Math/LaTeX;
- attachments;
- `.canvas` quando presente.

Se uma sintaxe não for suportada, registrar no relatório e criar fallback claro.

## 10. Acessibilidade

Piso: WCAG 2.2 AA quando aplicável.

- navegação por teclado;
- foco visível;
- alvo recomendado 44×44px para controles importantes;
- sem conteúdo essencial dependente apenas de hover;
- graph/canvas com nome e alternativa textual;
- contraste validado;
- zoom 200%;
- comportamento de animação único e previsível para todos os usuários;
- landmarks semânticos;
- labels reais.

## 11. Mobile

Mobile não é desktop comprimido.

Recompor:

- sidebars;
- graph;
- stacked pages;
- modais;
- search;
- explorer;
- outline;
- ações de página.

Não aceitar overflow horizontal estrutural.

## 12. Qualidade de código

- TypeScript quando a base usar TS;
- funções pequenas;
- nomes explícitos;
- componentes isolados;
- CSS por tokens semânticos;
- evitar magic numbers repetidos;
- nenhuma dependência grande sem justificativa;
- nenhum package duplicando função já presente no Quartz;
- nenhuma feature sem estado vazio/erro quando aplicável.

## 13. Processo obrigatório

Para uma nova implantação:

1. auditar repo;
2. auditar vault;
3. auditar design system;
4. criar/atualizar `implementation_plan.md`;
5. criar snapshot/branch;
6. implementar vertical slice;
7. testar;
8. só então escalar para o vault completo;
9. executar QA;
10. atualizar docs.

Não parar na criação do plano se a tarefa solicitar execução.

## 14. Sem perguntas desnecessárias

Quando a resposta estiver no workspace, procurar.

Perguntar ao usuário apenas quando:

- há duas decisões de produto genuinamente incompatíveis;
- uma credencial externa é indispensável;
- uma ação destrutiva exige autorização;
- o domínio/segredo final não pode ser inferido;
- a decisão altera conteúdo científico.

Fora disso, escolher a opção reversível mais conservadora e documentar.

## 15. Git

Antes de mudança grande:

- verificar `git status`;
- preservar trabalho não commitado do usuário;
- não resetar arquivos do usuário;
- criar branch/snapshot quando apropriado.

Commits devem ser coerentes, por exemplo:

- `chore: bootstrap quartz v5`
- `feat: add atlas access gate`
- `feat: implement nutriwork atlas shell`
- `feat: add graph study controls`
- `test: add obsidian compatibility fixtures`

## 16. Definição de pronto

Uma feature não está pronta apenas porque “renderiza”.

Ela precisa:

- funcionar no build;
- funcionar local;
- não quebrar SPA navigation;
- funcionar em light/dark quando relevante;
- funcionar em mobile;
- funcionar por teclado ou ter alternativa;
- não gerar erros no console;
- não quebrar links;
- estar coberta pelo checklist correspondente;
- estar documentada.
