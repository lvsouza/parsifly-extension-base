import { TPlatformAction } from './types/TPlatformAction';
import { TabsView } from './shared/components/TabsView';
import { TFileOrFolder } from './types/TFileOrFolder';
import { TQuickPick } from './types/TQuickPick';
import { View } from './shared/components/View';
import { TParser } from './types/TParser';
export declare abstract class ExtensionBase {
    private _eventLink;
    platformActions: TPlatformAction[];
    parsers: TParser[];
    views: View[];
    constructor();
    /**
     * Automatically called when the extension start.
     */
    activate(): Promise<void>;
    /**
     * Automatically called when the extension stop.
     */
    deactivate(): Promise<void>;
    private _platformActions;
    private _parsers;
    readonly application: {
        readonly views: {
            readonly register: (view: View | TabsView) => Promise<void>;
            readonly unregister: (view: View | TabsView) => Promise<void>;
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
            /**
             * Allow you to call a custom command from application
             *
             * @param key Name of the command
             * @param args List of arguments to be forwarded to the command call
             */
            readonly callCustomDataProvider: <GParam = unknown, GReturn = unknown>(key: string, ...args: GParam[]) => Promise<GReturn>;
            /**
             * Allow you to get the entire project object or get parts with ...project.pages(), .services(), .components() and more.
             */
            readonly project: (() => Promise<any>) & {
                pages: (index?: number) => Promise<any | any[]>;
                services: (index?: number) => Promise<any | any[]>;
                components: (index?: number) => Promise<any | any[]>;
            };
        };
    };
}
