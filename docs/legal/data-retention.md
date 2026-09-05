# Retenção de dados

- A planilha privada `Acessos` mantém e-mail normalizado, primeiro acesso, último acesso e contador. Não existe expiração automática no código atual.
- A planilha privada `Sugestões` mantém timestamp, título, descrição e `submission_id`. Não existe expiração automática no código atual.
- O navegador mantém dados locais de identificação, sessão do gate, preferências, tarefas e fila de sugestões até remoção local ou pelos fluxos existentes.
- O rate limit usa hashes de endereço em mapas efêmeros da função e caches temporários do Apps Script; esses valores não são persistidos como cadastro nem enviados à planilha.
- Logs, caches e cópias técnicas de Vercel, Google e Google Fonts seguem as configurações e prazos desses fornecedores; o Atlas não configura um prazo próprio para eles.

Pedidos de eliminação ou informação devem ser encaminhados para `equipenutriwork@gmail.com` para avaliação e execução nos sistemas sob controle do Nutriwork.
