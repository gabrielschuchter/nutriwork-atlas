# Mapa de dados do Atlas

Documento operacional baseado na arquitetura publicada em 4 de setembro de 2026. Não descreve dados que o código não coleta.

| Dado | Entrada | Armazenamento | Finalidade |
| --- | --- | --- | --- |
| E-mail normalizado | Formulário de acesso | Planilha privada `Acessos` via Apps Script/Google Sheets; cópia local em `localStorage` | Identificação e controle de acesso casual |
| Primeiro/último acesso e contador | Endpoint `/api/atlas-identify` | Planilha privada `Acessos` | Registro operacional do acesso |
| Título, descrição e `submissionId` | Formulário de sugestão do roadmap | Planilha privada `Sugestões` via Apps Script/Google Sheets; fila local enquanto pendente | Receber sugestões |
| Hash da senha do gate | Configuração pública + validação Web Crypto no navegador | Apenas sessão/localStorage como estado de acesso | Barreira de privacidade casual; não é autenticação forte |
| Preferências e progresso | Interações no navegador | `localStorage` do navegador | Persistir tema, tarefas e contexto local |
| IP para rate limit | Requisição aos endpoints | Hash efêmero em memória da função Vercel; não enviado à planilha | Limitar abuso |

O Atlas não possui analytics configurado, cookies próprios, banco adicional ou coleta de dados clínicos.
