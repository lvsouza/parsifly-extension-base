import { TPlatformAction } from './types/TPlatformAction';
import { TParser } from './types/TParser';
import { TView } from './types/TView';
export declare abstract class ExtensionBase {
    private _mainThread;
    platformActions: TPlatformAction[];
    parsers: TParser[];
    views: TView[];
    constructor();
    /**
     * Método chamado automaticamente ao ativar a extensão.
     * Pode ser sobrescrito pelas classes derivadas.
     */
    activate(): void | Promise<void>;
    /**
     * Método chamado automaticamente ao desativar a extensão.
     * Pode ser sobrescrito pelas classes derivadas.
     */
    deactivate(): void | Promise<void>;
    private _platformActions;
    private _parsers;
    private _views;
    readonly application: {
        readonly commands: {
            callCustomCommand: (key: string, ...args: any[]) => Promise<unknown>;
            downloadFile: (fileName: string, fileType: string, fileContent: string) => Promise<void>;
            downloadFiles: (downloadName: string, files: import('..').TFileOrFolder[]) => Promise<void>;
            editor: {
                feedback: (message: string, type: "warning" | "success" | "error" | "info") => Promise<void>;
                showQuickPick: (props: import('./types/TQuickPick').TQuickPick) => Promise<string | void>;
                showPrimarySideBarByKey: (key: string) => Promise<void>;
                showSecondarySideBarByKey: (key: string) => Promise<void>;
                setSideBarItems: (key: string, items: import('..').TListViewItem[]) => Promise<void>;
            };
        };
        readonly dataProviders: {
            callCustomDataProvider: (key: string, ...args: any[]) => Promise<unknown>;
            project: (() => Promise<any>) & {
                pages: (index?: number) => Promise<any>;
                services: (index?: number) => Promise<any>;
                components: (index?: number) => Promise<any>;
            };
        };
    };
}
