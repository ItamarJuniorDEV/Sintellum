declare module 'vscode' {
  export interface Disposable { dispose(): void }
  export interface TextEditorDecorationType extends Disposable {}
  export interface DecorationOptions { range: Range; hoverMessage?: string; renderOptions?: { after?: { contentText?: string } } }
  export interface Uri { toString(): string }
  export interface TextDocument { uri: Uri; getText(): string; lineAt(line: number): { text: string } }
  export interface TextEditor { document: TextDocument; setDecorations(decorationType: TextEditorDecorationType, rangesOrOptions: readonly DecorationOptions[]): void }
  export interface WorkspaceFolder { uri: Uri }
  export interface SecretStorage { get(key: string): Thenable<string | undefined>; store(key: string, value: string): Thenable<void>; delete(key: string): Thenable<void> }
  export interface Memento { get<T>(key: string): T | undefined; update(key: string, value: unknown): Thenable<void> }
  export interface ExtensionContext { subscriptions: Disposable[]; secrets: SecretStorage; workspaceState: Memento; }
  export interface Command { title: string; command: string; arguments?: unknown[] }
  export class Range { constructor(startLine: number, startCharacter: number, endLine: number, endCharacter: number) }
  export class CodeLens { constructor(range: Range, command?: Command) }
  export interface CodeLensProvider { onDidChangeCodeLenses?: Event<void>; provideCodeLenses(document: TextDocument): CodeLens[] | Thenable<CodeLens[]>; }
  export type Event<T> = (listener: (event: T) => unknown) => Disposable;
  export class EventEmitter<T> implements Disposable { readonly event: Event<T>; fire(data?: T): void; dispose(): void; }
  export interface Webview { html: string; options: { enableScripts?: boolean }; onDidReceiveMessage(listener: (message: unknown) => unknown): Disposable; }
  export interface WebviewView { webview: Webview }
  export interface WebviewViewProvider { resolveWebviewView(view: WebviewView): void | Thenable<void> }
  export interface WebviewPanel extends Disposable { webview: Webview }
  export interface TextDocumentChangeEvent { document: TextDocument }
  export const ViewColumn: { Beside: number };
  export const commands: { registerCommand(command: string, callback: (...args: unknown[]) => unknown): Disposable; };
  export const languages: { registerCodeLensProvider(selector: unknown, provider: CodeLensProvider): Disposable; };
  export const window: {
    activeTextEditor: TextEditor | undefined;
    showInformationMessage(message: string): Thenable<string | undefined>;
    showWarningMessage(message: string): Thenable<string | undefined>;
    showInputBox(options: { prompt?: string; value?: string; password?: boolean; ignoreFocusOut?: boolean }): Thenable<string | undefined>;
    showSaveDialog(options?: { filters?: Record<string, string[]>; saveLabel?: string }): Thenable<Uri | undefined>;
    onDidChangeActiveTextEditor(listener: (editor: TextEditor | undefined) => unknown): Disposable;
    registerWebviewViewProvider(viewId: string, provider: WebviewViewProvider): Disposable;
    createWebviewPanel(viewType: string, title: string, showOptions: number, options: { enableScripts?: boolean }): WebviewPanel;
    createTextEditorDecorationType(options: { after?: { margin?: string; color?: string } }): TextEditorDecorationType;
  };
  export const workspace: {
    isTrusted: boolean;
    workspaceFolders: readonly WorkspaceFolder[] | undefined;
    fs: { writeFile(uri: Uri, content: Uint8Array): Thenable<void> };
    getConfiguration(section: string): { get<T>(key: string, defaultValue: T): T };
    onDidChangeTextDocument(listener: (event: TextDocumentChangeEvent) => unknown): Disposable;
  };
}
