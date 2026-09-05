# Fornecedores e operadores

## Vercel

Hospeda os arquivos estáticos e executa as funções `/api/atlas-identify` e `/api/atlas-suggestions`. Os segredos `ATLAS_SHEETS_WEBHOOK_URL` e `ATLAS_SHEETS_WEBHOOK_SECRET` permanecem server-side.

## Google Apps Script e Google Sheets

Recebem chamadas autenticadas da função Vercel. A planilha privada `Acessos` guarda o cadastro de e-mail e acessos; `Sugestões` guarda as sugestões. A planilha não é publicada pelo aplicativo.

## Google Fonts

O Quartz está configurado para carregar Poppins e IBM Plex Mono por Google Fonts quando o CDN está habilitado. Isso pode gerar requisições do navegador ao fornecedor.

Não há provedor de analytics, publicidade ou ferramenta de rastreamento configurado no `quartz.config.yaml` atual.
