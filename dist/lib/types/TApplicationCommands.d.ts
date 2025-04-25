import { TFileOrFolder } from './TFileOrFolder';
import { TQuickPick } from './TQuickPick';
export type TApplicationCommands = {
    /**
     * Allow you to call a custom command from application
     *
     * @param key Name of the command
     * @param args List of arguments to be forwarded to the command call
     */
    readonly callCustomCommand: (key: string, ...args: unknown[]) => Promise<unknown>;
    /**
     * Allow you to download a lot of files and folders as zip
     *
     * @param downloadName Name of the download as zip
     * @param files List of files or folders to download
     */
    readonly downloadFiles: (downloadName: string, files: TFileOrFolder[]) => Promise<void>;
    /**
     * Allow you to download some content in a file
     *
     * @param fileName Name of the generated file
     * @param fileType extension of the file
     * @param fileContent file content in string
     */
    readonly downloadFile: (fileName: string, fileType: string, fileContent: string) => Promise<void>;
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
        readonly setPrimarySideBar: (key: string) => Promise<void>;
        /**
         * Allow to set secondary side bar view by key
         *
         * @param key Key to identify the view to show in the side bar
         */
        readonly setSecondarySideBar: (key: string) => Promise<void>;
    };
};
