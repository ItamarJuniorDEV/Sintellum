import * as vscode from 'vscode';
import type { AnalysisResult, FlowGraph } from './core/model.ts';
import { stableHash } from './core/hashing.ts';
import type { BlockExplanation } from './explanation/schemas.ts';
import { AiContextBuilder } from './ai/AiContextBuilder.ts';
import type { AiProvider } from './ai/AiProvider.ts';
import { OllamaProvider } from './ai/providers/OllamaProvider.ts';
import { OpenAiProvider } from './ai/providers/OpenAiProvider.ts';
import { BpmnMapper } from './flow/bpmn/BpmnMapper.ts';
import { SvgExporter } from './flow/export/SvgExporter.ts';
import { PngExporter } from './flow/export/PngExporter.ts';
import { SintellumOrchestrator } from './orchestration/SintellumOrchestrator.ts';
import { BlockSelectionStore } from './selection/BlockSelectionStore.ts';
import { AnalysisStore } from './storage/AnalysisStore.ts';
import { BlockCodeLensProvider } from './ui/BlockCodeLensProvider.ts';
import { ExplanationViewProvider } from './ui/ExplanationViewProvider.ts';
import { FlowViewProvider } from './ui/FlowViewProvider.ts';
import { InlineExplanationController } from './ui/InlineExplanationController.ts';
import { WorkspaceSecurityPolicy } from './security/WorkspaceSecurityPolicy.ts';
import { isSafeWebviewMessage } from './security/WebviewMessageGuard.ts';

let extensionContext: vscode.ExtensionContext | undefined;
let orchestrator: SintellumOrchestrator | undefined;
let currentDocumentUri: string | undefined;
let currentAnalysisId: string | undefined;
let currentAnalysis: AnalysisResult | undefined;
let currentGraph: FlowGraph | undefined;
let currentExplanations: BlockExplanation[] = [];
let currentStale = false;
const selections = new BlockSelectionStore();
const lensDtos = new BlockCodeLensProvider(selections);
const explanationRenderer = new ExplanationViewProvider();
const flowRenderer = new FlowViewProvider();
const aiContextBuilder = new AiContextBuilder();
const svgExporter = new SvgExporter();
const bpmnMapper = new BpmnMapper();
const inlineController = new InlineExplanationController();
let lensEmitter: vscode.EventEmitter<void> | undefined;
let explanationView: vscode.WebviewView | undefined;
let flowView: vscode.WebviewView | undefined;
let inlineDecorationType: vscode.TextEditorDecorationType | undefined;

function supportedDocument(uri: string): boolean {
  return /\.(php|blade\.php)$/i.test(uri);
}

function getWorkspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.toString();
}

function nonce(): string {
  return `cf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function emptyGraph(): FlowGraph {
  return { schemaVersion: 1, id: 'empty', rootUri: '', nodes: [], edges: [], sourceHashes: {} };
}

function refreshInline(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor || !inlineDecorationType) return;
  if (editor.document.uri.toString() !== currentDocumentUri || currentStale) {
    editor.setDecorations(inlineDecorationType, []);
    return;
  }
  const decorations = inlineController.toDecorations(currentExplanations).map(dto => {
    const lineLength = editor.document.lineAt(dto.line).text.length;
    return {
      range: new vscode.Range(dto.line, lineLength, dto.line, lineLength),
      hoverMessage: dto.hover,
      renderOptions: { after: { contentText: dto.text } }
    };
  });
  editor.setDecorations(inlineDecorationType, decorations);
}

function refreshViews(): void {
  refreshInline();
  if (explanationView) {
    explanationView.webview.options = { enableScripts: false };
    explanationView.webview.html = explanationRenderer.renderHtml(currentExplanations, nonce());
  }
  if (flowView) {
    flowView.webview.options = { enableScripts: true };
    flowView.webview.html = flowRenderer.renderHtml(currentGraph ?? emptyGraph(), nonce());
  }
}

async function configuredProvider(): Promise<AiProvider | undefined> {
  if (!extensionContext) return undefined;
  const config = vscode.workspace.getConfiguration('sintellum');
  const selected = config.get<'none' | 'ollama' | 'openai'>('provider', 'none');
  const policy = new WorkspaceSecurityPolicy(vscode.workspace.isTrusted);
  if (selected === 'ollama') {
    if (!policy.canUseLocalAi(true)) return undefined;
    const endpoint = config.get<string>('ollama.endpoint', 'http://127.0.0.1:11434');
    const model = config.get<string>('ollama.model', 'qwen2.5-coder');
    return new OllamaProvider(endpoint, model);
  }
  if (selected === 'openai') {
    const key = await extensionContext.secrets.get('sintellum.openai.apiKey');
    if (!key || !policy.canUseCloudAi(true)) return undefined;
    return new OpenAiProvider(async () => extensionContext?.secrets.get('sintellum.openai.apiKey'), 'gpt-5-mini');
  }
  return undefined;
}

async function rebuildSelected(): Promise<void> {
  if (!orchestrator || !currentDocumentUri || !currentAnalysisId || !currentAnalysis || currentStale) return;
  const selectedIds = selections.selectedIds(currentDocumentUri, currentAnalysisId);
  const mode = vscode.workspace.getConfiguration('sintellum').get<'simple' | 'normal' | 'technical'>('explanationMode', 'normal');
  const provider = await configuredProvider();
  let ai: { provider: AiProvider; context: ReturnType<AiContextBuilder['build']> } | undefined;
  if (provider && selectedIds.length > 0) {
    const editor = vscode.window.activeTextEditor;
    if (editor?.document.uri.toString() === currentDocumentUri) {
      const selectedBlocks = currentAnalysis.blocks.filter(block => selectedIds.includes(block.id));
      const context = aiContextBuilder.build({ blocks: selectedBlocks, sources: { [currentDocumentUri]: editor.document.getText() }, signatures: [] });
      ai = { provider, context };
    }
  }
  const built = await orchestrator.build(selectedIds, mode, ai);
  currentGraph = built.graph;
  currentExplanations = built.explanations;
  refreshViews();
}

async function analyzeActiveFile(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  const root = getWorkspaceRoot();
  if (!editor || !root) {
    await vscode.window.showWarningMessage('Sintellum: abra um arquivo dentro de um workspace Laravel.');
    return;
  }
  const uri = editor.document.uri.toString();
  if (!supportedDocument(uri)) {
    await vscode.window.showWarningMessage('Sintellum: o V1 analisa PHP/Laravel + Blade.');
    return;
  }

  const policy = new WorkspaceSecurityPolicy(vscode.workspace.isTrusted);
  if (!policy.canReadWorkspaceForStaticAnalysis()) return;
  orchestrator = new SintellumOrchestrator(root);
  const prepared = await orchestrator.prepare(uri);
  currentAnalysis = prepared.analysis;
  currentDocumentUri = uri;
  currentAnalysisId = `${uri}:${prepared.analysis.sourceHashes[uri] ?? 'analysis'}`;
  currentGraph = undefined;
  currentExplanations = [];
  currentStale = false;
  selections.prepare(uri, currentAnalysisId);
  lensEmitter?.fire();
  refreshViews();
  await vscode.window.showInformationMessage(`Sintellum: ${prepared.analysis.blocks.length} blocos lógicos sugeridos. Nenhum código foi executado.`);
}

async function handleFlowMessage(message: unknown): Promise<void> {
  if (!isSafeWebviewMessage(message) || !currentGraph || !extensionContext) return;
  const safe = message as Record<string, unknown>;
  if (safe.type === 'node:edit-request' && typeof safe.id === 'string') {
    const node = currentGraph.nodes.find(candidate => candidate.id === safe.id);
    if (!node) return;
    const action = await vscode.window.showInputBox({ prompt: `Ação de ${node.actor}`, value: node.action, ignoreFocusOut: true });
    if (action === undefined || !action.trim()) return;
    const previousAction = node.action;
    node.action = action.trim();
    node.confidence = 'user_corrected';
    currentExplanations = currentExplanations.map(explanation => explanation.actor === node.actor && explanation.action === previousAction ? { ...explanation, action: node.action, summary: `${node.actor} → ${node.action}.`, confidence: 'user_corrected' } : explanation);
    refreshViews();
    return;
  }
  if (safe.type === 'flow:save') {
    const root = getWorkspaceRoot();
    if (!root) return;
    const target = vscode.workspace.getConfiguration('sintellum').get<'workspaceState' | 'project'>('persistence', 'workspaceState');
    const policy = new WorkspaceSecurityPolicy(vscode.workspace.isTrusted);
    if (target === 'project' && !policy.canPersistToProject()) {
      await vscode.window.showWarningMessage('Sintellum: workspace não confiável; salvamento no projeto bloqueado.');
      return;
    }
    const store = new AnalysisStore(root, extensionContext.workspaceState);
    await store.save(currentGraph, target);
    await vscode.window.showInformationMessage(`Sintellum: fluxo salvo em ${target === 'project' ? '.sintellum/' : 'armazenamento local do VS Code'}.`);
  }
}

class ExplanationWebviewAdapter implements vscode.WebviewViewProvider {
  resolveWebviewView(view: vscode.WebviewView): void {
    explanationView = view;
    refreshViews();
  }
}

class FlowWebviewAdapter implements vscode.WebviewViewProvider {
  resolveWebviewView(view: vscode.WebviewView): void {
    flowView = view;
    view.webview.onDidReceiveMessage(handleFlowMessage);
    refreshViews();
  }
}

async function exportText(kind: 'svg' | 'bpmn'): Promise<void> {
  if (!currentGraph) {
    await vscode.window.showWarningMessage('Sintellum: gere um fluxo antes de exportar.');
    return;
  }
  const content = kind === 'svg' ? await svgExporter.export(currentGraph) : await bpmnMapper.toXml(currentGraph);
  const uri = await vscode.window.showSaveDialog({ filters: kind === 'svg' ? { SVG: ['svg'] } : { BPMN: ['bpmn'] }, saveLabel: `Exportar ${kind.toUpperCase()}` });
  if (!uri) return;
  await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content));
}

async function exportPng(): Promise<void> {
  if (!currentGraph) {
    await vscode.window.showWarningMessage('Sintellum: gere um fluxo antes de exportar.');
    return;
  }
  const uri = await vscode.window.showSaveDialog({ filters: { PNG: ['png'] }, saveLabel: 'Exportar PNG' });
  if (!uri) return;
  const svg = await svgExporter.export(currentGraph);
  const panel = vscode.window.createWebviewPanel('sintellum.pngRenderer', 'Sintellum — Exportando PNG', vscode.ViewColumn.Beside, { enableScripts: true });
  panel.webview.html = flowRenderer.renderPngRendererHtml(svg, nonce());
  try {
    const bytes = await new Promise<Uint8Array>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Tempo limite ao gerar PNG')), 15_000);
      const disposable = panel.webview.onDidReceiveMessage(message => {
        if (!isSafeWebviewMessage(message)) return;
        const safe = message as Record<string, unknown>;
        if (safe.type !== 'png:render-result' || typeof safe.data !== 'string') return;
        clearTimeout(timeout);
        disposable.dispose();
        const binary = atob(safe.data);
        resolve(Uint8Array.from(binary, char => char.charCodeAt(0)));
      });
    });
    const validated = await new PngExporter(async () => bytes).export(svg);
    await vscode.workspace.fs.writeFile(uri, validated);
  } finally {
    panel.dispose();
  }
}

export function activate(context: vscode.ExtensionContext): void {
  extensionContext = context;
  lensEmitter = new vscode.EventEmitter<void>();
  inlineDecorationType = vscode.window.createTextEditorDecorationType({ after: { margin: '0 0 0 1rem', color: 'var(--vscode-descriptionForeground)' } });

  const analyze = vscode.commands.registerCommand('sintellum.analyzeCurrentFile', analyzeActiveFile);
  const refresh = vscode.commands.registerCommand('sintellum.refreshAnalysis', analyzeActiveFile);
  const toggle = vscode.commands.registerCommand('sintellum.toggleBlock', async (...args: unknown[]) => {
    const [documentUri, blockId, analysisId] = args;
    if (typeof documentUri !== 'string' || typeof blockId !== 'string' || typeof analysisId !== 'string') return;
    if (documentUri !== currentDocumentUri || analysisId !== currentAnalysisId || currentStale) return;
    selections.toggle(documentUri, blockId, analysisId);
    await rebuildSelected();
    lensEmitter?.fire();
  });
  const configureOpenAiKey = vscode.commands.registerCommand('sintellum.configureOpenAiKey', async () => {
    const value = await vscode.window.showInputBox({ prompt: 'Chave da OpenAI', password: true, ignoreFocusOut: true });
    if (!value) return;
    await context.secrets.store('sintellum.openai.apiKey', value);
    await vscode.window.showInformationMessage('Sintellum: chave OpenAI salva com segurança no SecretStorage.');
  });
  const exportSvg = vscode.commands.registerCommand('sintellum.exportSvg', () => exportText('svg'));
  const exportPngCommand = vscode.commands.registerCommand('sintellum.exportPng', exportPng);
  const exportBpmn = vscode.commands.registerCommand('sintellum.exportBpmn', () => exportText('bpmn'));
  const openFlow = vscode.commands.registerCommand('sintellum.openFlowEditor', () => {
    const panel = vscode.window.createWebviewPanel('sintellum.flowEditor', 'Sintellum — Fluxo', vscode.ViewColumn.Beside, { enableScripts: true });
    panel.webview.html = flowRenderer.renderEditorHtml(currentGraph ?? emptyGraph(), nonce());
    panel.webview.onDidReceiveMessage(handleFlowMessage);
  });

  const codeLensProvider: vscode.CodeLensProvider = {
    onDidChangeCodeLenses: lensEmitter.event,
    provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
      const uri = document.uri.toString();
      if (!currentAnalysis || uri !== currentDocumentUri || !currentAnalysisId || currentStale) return [];
      return lensDtos.toLensDtos(uri, currentAnalysisId, currentAnalysis.blocks).map(dto => {
        const range = new vscode.Range(dto.range.start.line, dto.range.start.character, dto.range.end.line, dto.range.end.character);
        return new vscode.CodeLens(range, { title: dto.title, command: dto.command, arguments: dto.arguments });
      });
    }
  };
  const lensRegistration = vscode.languages.registerCodeLensProvider([{ language: 'php', scheme: 'file' }, { pattern: '**/*.blade.php', scheme: 'file' }], codeLensProvider);
  const explanationRegistration = vscode.window.registerWebviewViewProvider('sintellum.explanations', new ExplanationWebviewAdapter());
  const flowRegistration = vscode.window.registerWebviewViewProvider('sintellum.flow', new FlowWebviewAdapter());

  const editorChange = vscode.window.onDidChangeActiveTextEditor(async editor => {
    const mode = vscode.workspace.getConfiguration('sintellum').get<string>('analysisMode', 'manual');
    if (mode !== 'automatic' || !editor || !supportedDocument(editor.document.uri.toString())) return;
    await analyzeActiveFile();
  });
  const documentChange = vscode.workspace.onDidChangeTextDocument(async event => {
    const uri = event.document.uri.toString();
    if (!currentAnalysis || uri !== currentDocumentUri || currentStale) return;
    const expected = currentAnalysis.sourceHashes[uri];
    if (expected && stableHash(event.document.getText()) !== expected) {
      currentStale = true;
      lensEmitter?.fire();
      await vscode.window.showWarningMessage('Sintellum: Análise desatualizada. Use “Atualizar análise” antes de continuar.');
    }
  });

  context.subscriptions.push(analyze, refresh, toggle, configureOpenAiKey, exportSvg, exportPngCommand, exportBpmn, openFlow, lensRegistration, explanationRegistration, flowRegistration, editorChange, documentChange, lensEmitter, inlineDecorationType);
}

export function deactivate(): void {
  extensionContext = undefined;
  orchestrator = undefined;
  currentDocumentUri = undefined;
  currentAnalysisId = undefined;
  currentAnalysis = undefined;
  currentGraph = undefined;
  currentExplanations = [];
  currentStale = false;
  explanationView = undefined;
  flowView = undefined;
  lensEmitter = undefined;
  inlineDecorationType = undefined;
}
