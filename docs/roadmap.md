# Roadmap público do Atlas

## Conteúdo

Os itens publicados vivem em [`roadmap.ts`](../roadmap.ts), na lista `roadmapItems`. Ela começa vazia de propósito: sugestões recebidas nunca são inseridas automaticamente nessa lista. Quando um item real e curado for adicionado, seu campo `column` o posicionará em `planned`, `in-progress` ou `completed`, e a página voltará automaticamente às três colunas tradicionais.

Enquanto `roadmapItems` estiver vazia, `/roadmap` exibe o estado de abertura do roadmap e o convite para enviar sugestões; não exibe colunas ou contadores zerados.

## Sugestões

O formulário da rota `/roadmap` envia JSON para `/api/atlas-suggestions`. A função reutiliza as mesmas variáveis server-side e o mesmo Apps Script usados pela identificação por e-mail:

- Planilha: **Atlas — Identificação e acessos**
- Aba: **Sugestões**
- Cabeçalho: `timestamp`, `titulo`, `descricao`, `submission_id`

O `submission_id` existe apenas para tornar retries idempotentes. O Apps Script grava uma linha por sugestão, usa lock de script, limita o volume por minuto e mantém a planilha privada. O endpoint valida origem, tamanho, campos, rate limit por IP efêmero e configuração antes de encaminhar o payload.
