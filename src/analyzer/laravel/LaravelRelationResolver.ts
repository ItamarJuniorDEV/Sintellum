import { readFile } from 'node:fs/promises';
import type { AnalysisResult, FlowNode, FlowEdge } from '../../core/model.ts';
import type { PhpFact } from '../php/PhpFacts.ts';
import { PhpAnalyzer } from '../php/PhpAnalyzer.ts';
import { NamespaceResolver } from './NamespaceResolver.ts';
import { LogicalBlockExtractor } from './LogicalBlockExtractor.ts';

interface FactWithEvidence extends PhpFact { evidence?: any; }

export class LaravelRelationResolver {
  private readonly workspaceUri: string;
  constructor(workspaceUri: string) { this.workspaceUri = workspaceUri; }

  async resolve(seedUri: string, result: AnalysisResult): Promise<AnalysisResult> {
    const facts = (result.facts ?? []) as FactWithEvidence[];
    const imports = new Map<string, string>();
    for (const fact of facts) if (fact.kind === 'import' && fact.alias && fact.fqcn) imports.set(fact.alias, fact.fqcn);
    const classFact = facts.find(f => f.kind === 'class');
    const requestParam = facts.find(f => f.kind === 'parameter' && !!f.type && /Request$/.test(f.type));
    const serviceProp = facts.find(f => f.kind === 'property' && !!f.type && /Service$/.test(imports.get(f.type) ?? f.type));
    const controllerEvidence = classFact?.evidence ? [classFact.evidence] : facts[0]?.evidence ? [facts[0].evidence] : [];
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];

    let requestNode: FlowNode | undefined;
    if (requestParam?.type) {
      const fqcn = imports.get(requestParam.type) ?? requestParam.type;
      requestNode = { id: `request:${fqcn}`, kind: 'request', actor: requestParam.type, action: 'Autoriza e valida a requisição antes do Controller', input: 'Dados HTTP', output: 'Dados autorizados e validados', confidence: imports.has(requestParam.type) ? 'confirmed' : 'probable', evidence: requestParam.evidence ? [requestParam.evidence] : [] };
      nodes.push(requestNode);
    }

    const controllerName = classFact?.name ?? 'Controller';
    const controllerNode: FlowNode = { id: `controller:${controllerName}`, kind: 'controller', actor: controllerName, action: 'Recebe a requisição e delega o trabalho', confidence: classFact ? 'confirmed' : 'probable', evidence: controllerEvidence };
    nodes.push(controllerNode);
    if (requestNode) edges.push({ id: `${requestNode.id}->${controllerNode.id}`, from: requestNode.id, to: controllerNode.id, type: 'sequence', confidence: requestNode.confidence === 'confirmed' ? 'confirmed' : 'probable', evidence: requestNode.evidence });

    let serviceNode: FlowNode | undefined;
    if (serviceProp?.type) {
      const fqcn = imports.get(serviceProp.type) ?? serviceProp.type;
      serviceNode = { id: `service:${fqcn}`, kind: 'service', actor: fqcn.split('\\').pop() ?? serviceProp.type, action: 'Executa a regra de negócio delegada pelo Controller', confidence: imports.has(serviceProp.type) ? 'confirmed' : 'probable', evidence: serviceProp.evidence ? [serviceProp.evidence] : [] };
      nodes.push(serviceNode);
      edges.push({ id: `${controllerNode.id}->${serviceNode.id}`, from: controllerNode.id, to: serviceNode.id, type: 'call', confidence: serviceNode.confidence, evidence: serviceNode.evidence });

      if (serviceNode.confidence === 'confirmed') {
        const resolver = new NamespaceResolver(this.workspaceUri);
        const serviceUri = await resolver.resolveClass(fqcn, { 'App\\': 'app/' });
        if (serviceUri) {
          try {
            const serviceSource = await readFile(new URL(serviceUri), 'utf8');
            const serviceAnalysis = new PhpAnalyzer().analyze(serviceUri, serviceSource);
            const serviceFacts = (serviceAnalysis.facts ?? []) as FactWithEvidence[];
            const created = serviceFacts.find(f => f.kind === 'new' && f.type);
            if (created?.type) {
              const actor = created.type.split('\\').pop() ?? created.type;
              const modelNode: FlowNode = { id: `model:${created.type}`, kind: 'model', actor, action: 'Representa o dado persistido/retornado pelo serviço', confidence: 'probable', evidence: created.evidence ? [created.evidence] : [] };
              nodes.push(modelNode);
              edges.push({ id: `${serviceNode.id}->${modelNode.id}`, from: serviceNode.id, to: modelNode.id, type: 'data', confidence: 'probable', evidence: modelNode.evidence });
            }
          } catch { /* unresolved related file remains absent */ }
        }
      }
    }

    return { ...result, blocks: new LogicalBlockExtractor().extract(result), nodes, edges };
  }
}
