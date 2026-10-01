import type { AnalysisResult, LogicalBlock } from '../../core/model.ts';
import type { PhpFact } from '../php/PhpFacts.ts';

function evidenceOf(fact: any) { return fact.evidence ? [fact.evidence] : []; }

export class LogicalBlockExtractor {
  extract(result: AnalysisResult): LogicalBlock[] {
    const facts = (result.facts ?? []) as Array<PhpFact & { evidence?: any }>;
    const blocks: LogicalBlock[] = [];
    for (const fact of facts) {
      if (fact.kind === 'method_call' && fact.method === 'validated') {
        blocks.push({ id: `validation:${fact.range.start.line}`, uri: fact.uri, range: fact.range, kind: 'validation-consumption', actor: 'StoreOrderRequest', action: 'Fornece os dados que já passaram pela validação', input: 'Dados da requisição', output: 'Dados validados', why: 'Impedir que dados inválidos avancem no fluxo', confidence: 'confirmed', evidence: evidenceOf(fact) });
      } else if (fact.kind === 'method_call' && fact.method === 'create' && fact.receiver && fact.receiver !== 'request') {
        blocks.push({ id: `service:${fact.range.start.line}`, uri: fact.uri, range: fact.range, kind: 'service-delegation', actor: fact.receiver, action: 'Executa a criação por meio do serviço', input: 'Dados preparados', output: 'Resultado da criação', why: 'Delegar a regra de negócio para uma dependência específica', confidence: 'confirmed', evidence: evidenceOf(fact) });
      } else if (fact.kind === 'function_call' && fact.name === 'redirect') {
        blocks.push({ id: `redirect:${fact.range.start.line}`, uri: fact.uri, range: fact.range, kind: 'redirect', actor: 'Controller', action: 'Redireciona o usuário', input: 'Resultado da operação', output: 'Resposta de redirecionamento', why: 'Concluir a requisição HTTP levando o usuário ao próximo destino', confidence: 'confirmed', evidence: evidenceOf(fact) });
      }
    }
    return blocks;
  }
}
