import { CompletionsDescriptor, ICompletionsDescriptorIntent } from '../shared/descriptors/CompletionsDescriptor';
import { TSerializableCompletionViewItem } from '../shared/components/completion-view-item/TCompletionViewItem';
import { ProjectDescriptor, TSerializableProjectDescriptor } from '../shared/descriptors/ProjectDescriptor';
import { TSerializableFieldViewItem } from '../shared/components/field-view-item/TFieldViewItem';
import { FieldsDescriptor } from '../shared/descriptors/FieldsDescriptor';
import { PlatformAction } from '../shared/components/PlatformActions';
import { TQuery, TQueryResults, TWatchQuery } from './TQuery';
import { Editor } from '../shared/components/editors/Editor';
import { View } from '../shared/components/views/View';
import { Parser } from '../shared/components/Parser';
import { TFileOrFolder } from './TFileOrFolder';
import { TQuickPick } from './TQuickPick';


export type TApplication = {
  quickPick: {
    readonly show: <T = unknown>(props: TQuickPick) => Promise<T>;
  };
  platformActions: {
    readonly reload: () => Promise<unknown>;
    readonly register: (platformAction: PlatformAction) => void;
    readonly unregister: (platformAction: PlatformAction) => void;
  };
  parsers: {
    readonly reload: () => Promise<unknown>;
    readonly register: (parser: Parser) => void;
    readonly unregister: (parser: Parser) => void;
  };
  views: {
    readonly reload: () => Promise<unknown>;
    readonly register: (view: View) => void;
    readonly unregister: (view: View) => void;
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
  }
  selection: {
    /**
     * Allow you to select a item
     * 
     * @param key Identifier of a item to be selected
     */
    readonly select: (key: string) => Promise<void>;
    /**
     * Allow you to unselect a item
     * 
     * @param key Identifier of a item to be unselected
     */
    readonly unselect: (key: string) => Promise<void>;
    /**
     * Returns a list of selected items in the platform
     * 
     * @returns {Promise<string[]>} List of selected items
     */
    readonly get: () => Promise<string[]>;
    /**
     * Subscribe to selection item key change
     * 
     * @returns {() => void} Unsubscribe function
     */
    readonly subscribe: (listener: (key: string[]) => Promise<void>) => () => void;
  };
  edition: {
    /**
     * Allow you to open a item in a editor based on the item type
     * 
     * @param type Type of the editor to be used to open this content
     * @param key Identifier of a item to be opened for some editor
     */
    readonly open: (type: string, key: string) => Promise<void>;
    /**
     * Allow you to close a item if it is opened in the editor
     * 
     * @param key Identifier of a item to be closed
     */
    readonly close: (key: string) => Promise<void>;
    /**
     * Returns a edited item id in the platform
     * 
     * @returns {Promise<string>} Edited item id
     */
    readonly get: () => Promise<string>;
    /**
     * Subscribe to edition item key change
     * 
     * @returns {() => void} Unsubscribe function
     */
    readonly subscribe: (listener: (key: string | undefined) => Promise<void>) => () => void;
  };
  fields: {
    /**
     * Returns a list of fields
     * 
     * @param key Resource key to be refreshed
     * @returns {Promise<TSerializableFieldViewItem[]>} List of fields
     */
    readonly get: (key: string) => Promise<TSerializableFieldViewItem[]>;
    /**
     * Request the platform to get again all fields for this resource
     * 
     * @param key Resource key to be refreshed
     */
    readonly refresh: (key: string) => Promise<void>;
    /**
     * Subscribe to form fields
     * 
     * @returns {() => void} Unsubscribe function
     */
    readonly subscribe: (key: string, listener: ((fields: TSerializableFieldViewItem[]) => Promise<void>)) => (() => void);
    /**
     * Register a fields descriptor to platform.
     * 
     * @param fieldsDescriptor Descriptor to be registered
     */
    readonly register: (fieldsDescriptor: FieldsDescriptor) => void;
    /**
     * Unregister the descriptor
     * 
     * @param fieldsDescriptor Descriptor to be unregistered
     */
    readonly unregister: (fieldsDescriptor: FieldsDescriptor) => void;
  };
  completions: {
    /**
     * Returns a list of completions
     * 
     * @param intent The intent of what need to suggest completions
     * @returns {Promise<TSerializableCompletionViewItem[]>} List of completions
     */
    readonly get: (intent: ICompletionsDescriptorIntent) => Promise<TSerializableCompletionViewItem[]>;
    /**
     * Register a completions descriptor to the platform.
     * 
     * @param completionsDescriptor Descriptor to be registered
     */
    readonly register: (completionsDescriptor: CompletionsDescriptor) => void;
    /**
     * Unregister the descriptor
     * 
     * @param completionsDescriptor Descriptor to be unregistered
     */
    readonly unregister: (completionsDescriptor: CompletionsDescriptor) => void;
  };
  projects: {
    /**
     * Returns a list of projects
     * 
     * @returns {Promise<TSerializableCompletionViewItem[]>} List of projects
     */
    readonly get: () => Promise<TSerializableProjectDescriptor[]>;
    /**
     * Register a project descriptor to the platform.
     * 
     * @param projectDescriptor Descriptor to be registered
     */
    readonly register: (projectDescriptor: ProjectDescriptor) => void;
    /**
     * Unregister the descriptor
     * 
     * @param projectDescriptor Descriptor to be unregistered
     */
    readonly unregister: (projectDescriptor: ProjectDescriptor) => void;
  };
  editors: {
    readonly reload: () => Promise<unknown>;
    readonly register: (editor: Editor) => void;
    readonly unregister: (editor: Editor) => void;
  };
  download: {
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
  };
  /**
   * Allow to show some feedback to the platform user
   * 
   * - `info` information feedback
   * - `warning` warning feedback
   * - `success` success feedback
   * - `error` error feedback
   * 
   * @param message Message of the feedback
   */
  feedback: {
    readonly info: (message: string) => Promise<void>;
    readonly warning: (message: string) => Promise<void>;
    readonly success: (message: string) => Promise<void>;
    readonly error: (message: string) => Promise<void>;
  };
  data: {
    execute(query: TQuery): Promise<TQueryResults>;
    subscribe(props: TWatchQuery): Promise<() => Promise<void>>;
  };
}
