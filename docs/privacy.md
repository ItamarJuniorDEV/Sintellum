# Privacidade e segurança

## Sem IA

O Sintellum funciona com análise estrutural local e não precisa enviar código a terceiros.

## IA local

Ollama é restrito por padrão a endereços loopback (`127.0.0.1`, `localhost`, `::1`) para reduzir risco de exfiltração acidental/SSRF.

## IA cloud

Antes de construir um payload cloud:

1. entram apenas blocos confirmados pelo usuário;
2. corpos de arquivos não relacionados são excluídos;
3. apenas assinaturas mínimas diretamente necessárias são adicionadas;
4. nomes comuns de segredos (`API_KEY`, `TOKEN`, `PASSWORD`, etc.) são redigidos.

A chave OpenAI usa o identificador `sintellum.openai.apiKey` no `SecretStorage` do VS Code. A extensão fornece um comando de configuração com entrada mascarada e o provider lê a chave apenas em tempo de uso.

## Workspace Trust

Workspace não confiável:

- pode usar leitura estática;
- não pode usar IA local/cloud;
- não pode persistir `.sintellum/` no projeto;
- não executa processos do projeto.

## Execução de código

A extensão não faz `require` em PHP do projeto, não roda `artisan`, Composer scripts, Blade ou comandos do workspace para entender o fluxo.
