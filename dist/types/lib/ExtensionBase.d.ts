import { PlatformAction } from './shared/components/PlatformActions';
import { TabsView } from './shared/components/TabsView';
import { TFileOrFolder } from './types/TFileOrFolder';
import { Parser } from './shared/components/Parser';
import { Editor } from './shared/components/Editor';
import { TQuickPick } from './types/TQuickPick';
import { View } from './shared/components/View';
export declare abstract class ExtensionBase {
    private _eventLink;
    constructor();
    /**
     * Automatically called when the extension start.
     */
    activate(): Promise<void>;
    /**
     * Automatically called when the extension stop.
     */
    deactivate(): Promise<void>;
    readonly application: {
        readonly platformActions: {
            readonly register: (platformAction: PlatformAction) => void;
            readonly unregister: (platformAction: PlatformAction) => void;
        };
        readonly parsers: {
            readonly register: (parser: Parser) => void;
            readonly unregister: (parser: Parser) => void;
        };
        readonly views: {
            readonly refresh: (view: View | TabsView) => Promise<void>;
            readonly register: (view: View | TabsView) => void;
            readonly unregister: (view: View | TabsView) => void;
        };
        readonly editors: {
            /**
             * Allow you to open a item in a editor based on the item type
             *
             * @param key Identifier of a item to be opened for some editor
             */
            readonly open: (key: string) => Promise<void>;
            readonly register: (view: Editor) => void;
            readonly unregister: (view: Editor) => void;
        };
        readonly commands: {
            /**
             * Allow you to call a custom command from application
             *
             * @param key Name of the command
             * @param args List of arguments to be forwarded to the command call
             */
            readonly callCustomCommand: <GParam = unknown, GReturn = unknown>(key: string, ...args: GParam[]) => Promise<GReturn>;
            /**
             * Allow you to download some content in a file
             *
             * @param fileName Name of the generated file
             * @param fileType extension of the file
             * @param fileContent file content in string
             */
            readonly downloadFile: (fileName: string, fileType: string, fileContent: string) => Promise<void>;
            /**
             * Allow you to download a lot of files and folders as zip
             *
             * @param downloadName Name of the download as zip
             * @param files List of files or folders to download
             */
            readonly downloadFiles: (downloadName: string, files: TFileOrFolder[]) => Promise<void>;
            /**
             * Grouped methods to editor configuration
             */
            readonly editor: {
                /**
                 * Allow to show some feedback to the platform user
                 *
                 * @param message Message of the feedback
                 * @param type type of the feedback
                 */
                readonly feedback: (message: string, type: "warning" | "success" | "error" | "info") => Promise<void>;
                /**
                 * Allow to capture user freeform text input
                 *
                 * @param props Props to configure the quick pick
                 */
                readonly showQuickPick: (props: TQuickPick) => Promise<string | void>;
                /**
                 * Allow to set primary side bar view by key
                 *
                 * @param key Key to identify the view to show in the side bar
                 */
                readonly showPrimarySideBarByKey: (key: string) => Promise<void>;
                /**
                 * Allow to set secondary side bar view by key
                 *
                 * @param key Key to identify the view to show in the side bar
                 */
                readonly showSecondarySideBarByKey: (key: string) => Promise<void>;
            };
        };
        readonly dataProviders: {
            readonly callCustomDataProvider: <GParam = unknown, GReturn = unknown>(key: string, ...args: GParam[]) => Promise<GReturn>;
            readonly project: (() => Promise<import('..').IProject<"application" | "package">>) & {
                set: (project: import('..').IProject<"application" | "package">) => Promise<void>;
                pages: (() => Promise<import('..').IPage[]>) & ((index: number) => Promise<import('..').IPage>) & {
                    set: (page: import('..').IPage, index: number) => Promise<void>;
                    add: ((page: import('..').IPage) => Promise<void>) & ((page: import('..').IPage, index: number) => Promise<void>);
                    del: (() => Promise<void>) & ((index: number) => Promise<void>);
                };
                components: (() => Promise<import('..').IComponent[]>) & ((index: number) => Promise<import('..').IComponent>) & {
                    set: (component: import('..').IComponent, index: number) => Promise<void>;
                    add: ((component: import('..').IComponent) => Promise<void>) & ((component: import('..').IComponent, index: number) => Promise<void>);
                    del: (() => Promise<void>) & ((index: number) => Promise<void>);
                };
                services: (() => Promise<import('..').IService[]>) & ((index: number) => Promise<import('..').IService>) & {
                    set: (service: import('..').IService, index: number) => Promise<void>;
                    add: ((service: import('..').IService) => Promise<void>) & ((service: import('..').IService, index: number) => Promise<void>);
                    del: (() => Promise<void>) & ((index: number) => Promise<void>);
                };
            };
        };
    };
}
