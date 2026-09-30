# Providers de IA

## Nenhum

Modo padrão e recomendado para análise estrutural. Não há rede.

## Ollama

- endpoint padrão: `http://127.0.0.1:11434`;
- somente loopback no alpha;
- recebe apenas `AiContextPackage` mínimo.

## OpenAI

- adapter desacoplado do núcleo;
- usa endpoint Responses;
- chave deve vir do `SecretStorage`, nunca de `settings.json` ou `.sintellum/`;
- saída é validada antes de ser aplicada;
- IA só altera redação/`why` e cria relações separadas como `inferred`.
