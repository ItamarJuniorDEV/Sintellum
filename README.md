# Sintellum

**Sintellum** é uma extensão open source para VS Code focada em explicar código **Laravel/PHP + Blade** em português e transformar relações do código em um fluxo visual compreensível.

> **Status:** `0.0.1-alpha`. O núcleo está funcional e testado; algumas integrações visuais do produto final ainda estão em evolução.

## Ideia

```text
Route → FormRequest → Controller → Service → Model → Redirect
```

O Sintellum trata `FormRequest` como etapa própria. Exemplo:

```php
public function store(StoreOrderRequest $request)
{
    $dados = $request->validated();
    $order = $this->orderService->create($dados);
    return redirect()->route('orders.show', $order);
}
```

Pode ser entendido como:

```text
StoreOrderRequest
  → autoriza e valida
OrderController
  → recebe dados já validados
OrderService
  → executa a regra de criação
Order
  → representa o resultado
Redirect
  → conclui a requisição
```

## Confiança

- `confirmed`: evidência direta no código;
- `probable`: forte evidência, sem confirmação total;
- `inferred`: interpretação da IA;
- `user_corrected`: corrigido pelo usuário.

Nunca usamos “93% de confiança” inventado.

## Sem IA

O Sintellum continua útil sem provider configurado. IA é enriquecimento de linguagem, não a fonte principal das relações técnicas.

## IA opcional

- Ollama local;
- OpenAI cloud;
- arquitetura preparada para outros providers.

Consulte [Privacidade](docs/privacy.md) e [Providers](docs/providers.md).

## Segurança

- não executa PHP/Artisan/Blade do projeto;
- cloud recebe contexto mínimo;
- segredos óbvios são redigidos;
- Workspace Trust restringe recursos sensíveis;
- webviews usam CSP;
- mensagens da webview passam por allow-list;
- sem telemetria no V1.

## Fluxo visual e BPMN

O mesmo `FlowGraph` alimenta explicações, fluxo simples e BPMN. O BPMN é **assistivo e editável**; não é apresentado como reconstrução perfeita do processo de negócio.

![Mockup conceitual do Sintellum](docs/assets/concept-mockup.png)

> A imagem é um mockup conceitual, não uma captura da versão alpha atual.

## Desenvolvimento

Requer Node.js 22+ e TypeScript 5.7+.

```bash
npm install
npm run typecheck
npm run test:unit
npm run test:integration
npm run package
```

## Licença

MIT.
