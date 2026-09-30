# Changelog

## 0.0.1-alpha — 2026-09-30

- Núcleo de análise PHP/Laravel e Blade sem executar o projeto.
- FormRequest tratado como etapa própria do fluxo.
- Blocos lógicos selecionáveis e explicações determinísticas em português.
- Fluxo visual baseado em `FlowGraph` comum.
- BPMN 2.0 assistivo em XML, SVG e contrato de rasterização PNG.
- Ollama/OpenAI desacoplados com contexto mínimo e redaction de segredos.
- Workspace Trust, path guard e validação de mensagens de webview.
- Persistência local/projeto, correções humanas e detecção de análise desatualizada.

### Limitações do alpha

- O modelador visual avançado com `bpmn-js` ainda não está integrado ao runtime.
- A chave OpenAI pode ser configurada pela UI do VS Code e é armazenada no `SecretStorage`; o provider lê a chave somente em tempo de uso.
- O analisador Blade usa parser determinístico conservador; gramática completa fica para a próxima etapa.
