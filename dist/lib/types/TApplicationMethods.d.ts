import { TFileOrFolder } from './TFileOrFolder';
export type TApplicationMethods = {
    /**
     * Allow you to download a lot of files and folders as zip
     *
     * @param downloadName Name of the download as zip
     * @param files List of files or folders to download
     */
    readonly downloadFiles: (downloadName: string, files: TFileOrFolder) => Promise<void>;
    /**
     * Allow you to download some content in a file
     *
     * @param fileName Name of the generated file
     * @param fileType extension of the file
     * @param fileContent file content in string
     */
    readonly downloadFile: (fileName: string, fileType: string, fileContent: string) => Promise<void>;
    /**
     * Allow to show some feedback to the platform user
     *
     * @param message Message of the feedback
     * @param type type of the feedback
     */
    readonly feedback: (message: string, type: "warning" | "success" | "error" | "info") => Promise<void>;
};
