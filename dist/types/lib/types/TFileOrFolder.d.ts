type TFile = {
    /** Type of the file */
    type: string;
    /** File content */
    content: string;
};
type TFolder = {
    /** Type of the file */
    type?: undefined;
    /** List of files or folders */
    content: TFileOrFolder[];
};
/**
 * Basic structure os a file to download
 */
export type TFileOrFolder = (TFile | TFolder) & {
    /** Name of the folder or file */
    name: string;
};
export {};
