import * as vscode from 'vscode';
import { GltfPreview } from './gltfPreview';
import { GltfInspectData } from './gltfInspectData';
import { GltfOutline } from './gltfOutline';

export class GltfWindow {
    private _vtoolPreview: GltfPreview;
    private _vtoolInspectData: GltfInspectData;
    private _vtoolOutline: GltfOutline;
    private _activeTextEditor: vscode.TextEditor;
    private _onDidChangeActiveTextEditor: vscode.EventEmitter<vscode.TextEditor | undefined> = new vscode.EventEmitter<vscode.TextEditor | undefined>();

    constructor(context: vscode.ExtensionContext) {
        this._vtoolPreview = new GltfPreview(context);

        this._vtoolOutline = new GltfOutline(context, this);
        vscode.window.registerTreeDataProvider('vtoolOutline', this._vtoolOutline);

        this._vtoolInspectData = new GltfInspectData(context, this);
        this._vtoolInspectData.setTreeView(vscode.window.createTreeView('vtoolInspectData', { treeDataProvider: this._vtoolInspectData }));

        vscode.window.onDidChangeActiveTextEditor(() => {
            // Wait a frame before updating to ensure all window states are updated.
            setImmediate(() => this.update());
        });

        this._vtoolPreview.onDidChangeActivePanel(() => {
            // Wait a frame before updating to ensure all window states are updated.
            setImmediate(() => this.update());
        });

        this.update();
    }

    /**
     * The active text editor of the vscode window editing a glTF or the text editor of the active glTF preview panel.
     */
    public get activeTextEditor(): vscode.TextEditor | undefined {
        return this._activeTextEditor;
    }

    public get preview(): GltfPreview {
        return this._vtoolPreview;
    }

    public get inspectData(): GltfInspectData {
        return this._vtoolInspectData;
    }

    public get outline(): GltfOutline {
        return this._vtoolOutline;
    }

    /**
     * Event that is fired when the active glTF editor has changed.
     */
    public readonly onDidChangeActiveTextEditor = this._onDidChangeActiveTextEditor.event;

    private update() {
        let vToolPreviewActive = false;
        let vToolFileActive = false;

        let activeTextEditor = this._vtoolPreview.activePanel && this._vtoolPreview.activePanel.textEditor;
        if (activeTextEditor) {
            vToolPreviewActive = true;
        }
        else if (this.isGltfFile(vscode.window.activeTextEditor)) {
            activeTextEditor = vscode.window.activeTextEditor;
            vToolFileActive = true;
        }

        vscode.commands.executeCommand('setContext', 'vToolPreviewActive', vToolPreviewActive);
        vscode.commands.executeCommand('setContext', 'vToolFileActive', vToolFileActive);
        vscode.commands.executeCommand('setContext', 'vToolActive', vToolPreviewActive || vToolFileActive);

        if (this._activeTextEditor !== activeTextEditor) {
            this._activeTextEditor = activeTextEditor;
            this._onDidChangeActiveTextEditor.fire(activeTextEditor);
        }
    }

    private isGltfFile(editor: vscode.TextEditor | undefined): boolean {
        return editor && (editor.document.fileName.toLowerCase().endsWith('.vrmgltf') || editor.document.fileName.toLowerCase().endsWith('.vcigltf'));
    }
}
