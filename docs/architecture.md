# Arquitetura

```text
arquivo Laravel/Blade
        ↓
analisador determinístico
        ↓
fatos + evidências
        ↓
blocos lógicos
        ↓
FlowGraph comum
   ↙       ↓       ↘
texto    fluxo     BPMN
        ↘
      IA opcional
```

## Regra central

A IA não é fonte de verdade estrutural. O código e suas evidências são processados primeiro. IA pode melhorar linguagem e propor relações `inferred`, mas não pode elevar uma inferência para `confirmed`.

## Principais módulos

- `analyzer/php`: lexer e fatos PHP.
- `analyzer/laravel`: relações específicas do Laravel, incluindo FormRequest.
- `analyzer/blade`: referências Blade estáticas e incerteza explícita para nomes dinâmicos.
- `explanation`: explicação simples/normal/técnica.
- `ai`: limite de privacidade e providers.
- `flow`: grafo comum, BPMN e exportação.
- `storage`: análises, correções e staleness.
- `security`: trust, path guard e mensagens de webview.
