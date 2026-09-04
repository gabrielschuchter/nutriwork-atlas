# Identificação por e-mail

## Escopo

Quartz, o grafo e o gate por SHA-256 continuam existentes. A identificação não verifica assinatura, propriedade do e-mail ou permissão de acesso. Não é uma nova autenticação. Qualquer e-mail sintaticamente válido pode seguir para a senha global depois da confirmação do registro.

## Fluxo e contagem

- Primeiro acesso: e-mail → POST same-origin `/api/atlas-identify` → Google Sheets → identificação local → senha global.
- `localStorage["nutriwork-atlas-identification-v1"]` guarda somente `{ version: 1, email }`, depois da resposta positiva. Dados ausentes, corrompidos ou inválidos exigem identificação novamente.
- Uma visita é uma abertura/reload completo do Atlas. Ela atualiza `ultimo_acesso` e incrementa `acessos` antes do gate. Navegações SPA entre notas não contam novamente. Não é uma métrica de login autenticado ou validação de assinatura.
- Recorrentes veem diretamente a etapa de senha enquanto o registro acontece. A sessão da senha existente continua válida: se já estiver salva, é restaurada depois da confirmação do registro. Uma identificação nova exige senha novamente.
- Erro de rede, timeout, configuração ou Sheets mantém o gate bloqueado e oferece nova tentativa. Um erro não persiste a identificação inicial.
- “Usar outro e-mail” limpa identificação e sessão de senha. “Sair do Atlas” limpa apenas a sessão de senha. Storage bloqueado permite a sessão atual em memória, mas não promete persistência.

## Código

- `plugins/atlas-ui/components/index.js`: formulários e estilos existentes do Atlas.
- `plugins/atlas-ui/access-runtime.js`: estados, persistência, retry e gate global preservado.
- `plugins/atlas-ui/identification.js`: normalização/validação compartilhada.
- `api/atlas-identify.js` e `server/atlas-identification.js`: função Vercel sem dependências novas.
- `integrations/google-sheets/Code.gs`: Apps Script, executado como proprietário; planilha privada, aba `Acessos`.

## Configuração privada

Vercel/local: `ATLAS_SHEETS_WEBHOOK_URL`, `ATLAS_SHEETS_WEBHOOK_SECRET`.
Apps Script Properties: `ATLAS_SHEET_ID`, `ATLAS_WEBHOOK_SECRET` (mesmo segredo).

Nenhuma dessas configurações é interpolada no HTML ou JavaScript do cliente. O frontend conhece apenas o endpoint same-origin. `.env*` e artefatos locais ficam fora do Git e do deploy. A função não registra payload, senha ou e-mail em logs e nunca devolve mensagens privadas do Google.

Planilha criada: **Atlas — Identificação e acessos**, em `ChatGPT` no Drive. Somente quatro colunas: `email`, `primeiro_acesso`, `ultimo_acesso`, `acessos`. Datas são valores nativos, exibidos no fuso de São Paulo. O e-mail é normalizado em minúsculas, sem espaços externos; aliases `+tag` não são removidos. Textos que possam parecer fórmulas são gravados como literais.

## Concorrência e proteção proporcional

- Apps Script `getScriptLock` serializa busca/inserção/atualização; `flush` ocorre antes de liberar o lock. Isso evita linhas duplicadas e perda de incrementos em execuções concorrentes.
- `visitId` aleatório é reaproveitado no retry. Cache Google de até seis horas evita incremento repetido após resposta perdida; é proteção de melhor esforço, sujeita à expiração/evicção do CacheService, não garantia de exactly-once.
- Payload de até 1 KiB na função (2 KiB no webhook autenticado), JSON e verificação same-origin no navegador; timeout de 15 s no upstream e 20 s no cliente.
- Limite por instância: 30 tentativas por IP em dez minutos, armazenando apenas hash efêmero em mapa limitado. Não é um limitador distribuído nem identificação confiável. Apps Script também limita a 120 gravações por minuto via cache sob lock. Nenhum IP vai para a planilha.
- O Apps Script pede escopo Google Sheets para a conta proprietária; o código acessa somente o ID configurado. Publicar a função não torna a planilha pública. O segredo autentica chamadas Vercel → Google, não usuários.

## Verificação

`npm run build` e `npm run dev` servem o mesmo handler localmente em `127.0.0.1:4321` com `.env.local`, quando configurado. `npm test` cobre validação, payload, origem, limites, erro de upstream, upsert, idempotência, persistência, recorrência e senha por hash com fixture.

Testes com mocks não comprovam Google Sheets. A entrega exige inserir e reler um e-mail de QA claramente identificado, repetir em nova visita e confirmar mesma linha, primeiro acesso preservado, último acesso atualizado e contador incrementado; depois repetir no domínio de produção. Não publicar o gate sem o webhook operacional.

Não foi localizada uma política de privacidade relevante no código/site principal consultado. Foi mantido o aviso conciso solicitado, sem inventar documento ou link jurídico.
