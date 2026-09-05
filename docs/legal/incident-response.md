# Resposta básica a incidentes

1. Receber o relato pelo e-mail `equipenutriwork@gmail.com` e preservar a evidência sem ampliar a exposição.
2. Classificar o evento: conteúdo público, endpoint, credencial/segredo, navegador, Vercel ou planilha privada.
3. Conter o risco proporcionalmente: desabilitar a configuração afetada, revogar/rotacionar segredo, limitar endpoint, corrigir código ou suspender integração.
4. Verificar escopo e impacto nos logs e serviços sob controle do Nutriwork, sem registrar ou compartilhar dados desnecessários.
5. Corrigir, testar e publicar a correção com revisão do responsável pelo Atlas.
6. Avaliar comunicação às pessoas afetadas, à ANPD ou a outras autoridades quando houver obrigação legal e risco ou dano relevante.
7. Registrar causa, decisões, evidências, correção e ações preventivas no repositório ou canal operacional apropriado.

O `security.txt` aponta para o canal de reporte e para `/seguranca`. Este fluxo não cria banco ou sistema de incidentes adicional.
