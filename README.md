# Sintellum

**Sintellum** é uma extensão open source para VS Code que ajuda a entender código **Laravel/PHP + Blade** em português e transforma relações do código em um fluxo visual compreensível.

> **Status:** `0.0.1-alpha`. O núcleo está funcional e testado; a interface visual avançada ainda está em evolução.

## Ideia

```text
Route → FormRequest → Controller → Service → Model → Redirect
```

O `FormRequest` é tratado como etapa própria: autoriza/valida antes do Controller. A análise determinística é a fonte de verdade; IA é opcional para melhorar a linguagem e nunca transforma inferência em fato confirmado.

## Modos de confiança

- `confirmed`: evidência direta no código
- `probable`: forte evidência, sem confirmação total
- `inferred`: interpretação da IA
- `user_corrected`: corrigido pelo usuário

## Segurança

- não executa PHP, Artisan, Composer scripts ou Blade do projeto;
- OpenAI recebe apenas contexto mínimo de blocos confirmados pelo usuário;
- credenciais óbvias são redigidas antes de payload cloud;
- chaves cloud ficam no `SecretStorage` do VS Code;
- Workspace Trust bloqueia IA e persistência no projeto quando não confiável;
- webviews usam CSP e mensagens allow-listed;
- sem telemetria no V1.

Leia também `SECURITY.md` e `docs/privacy.md`.

## IA opcional

- nenhuma IA: análise estrutural local;
- Ollama local: restrito a loopback no alpha;
- OpenAI: chave configurada via comando e guardada no SecretStorage.

## Fluxo e exportação

O mesmo `FlowGraph` alimenta explicações, fluxo simples e BPMN assistivo. O alpha exporta SVG, PNG e `.bpmn`. O BPMN automático é editável/assistivo e não é apresentado como reconstrução perfeita do processo de negócio.

## Desenvolvimento

Requer Node.js 22+ e TypeScript 5.7.2.

```bash
npm install
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run package
```

## Licença

MIT.
