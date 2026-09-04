# Roadmap público do Atlas

## Conteúdo

Os itens publicados vivem em [`roadmap.ts`](../roadmap.ts). O agrupamento em `planned`, `in-progress` e `completed` define as três colunas; cada item tem somente título, descrição e categoria opcional. Sugestões recebidas nunca são inseridas automaticamente nessa lista.

## Sugestões

O formulário da rota `/roadmap` envia JSON para `/api/atlas-suggestions`. A função reutiliza as mesmas variáveis server-side e o mesmo Apps Script usados pela identificação por e-mail:

- Planilha: **Atlas — Identificação e acessos**
- Aba: **Sugestões**
- Cabeçalho: `timestamp`, `titulo`, `descricao`, `submission_id`

O `submission_id` existe apenas para tornar retries idempotentes. O Apps Script grava uma linha por sugestão, usa lock de script, limita o volume por minuto e mantém a planilha privada. O endpoint valida origem, tamanho, campos, rate limit por IP efêmero e configuração antes de encaminhar o payload.
