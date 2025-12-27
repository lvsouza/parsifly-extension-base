import { CompletionsDescriptor, ICompletionsDescriptorIntent } from '../shared/descriptors/CompletionsDescriptor';
import { TSerializableCompletionViewItem } from '../shared/components/completion-view-item/TCompletionViewItem';
import { FieldsDescriptor } from '../shared/descriptors/FieldsDescriptor';
import { FieldViewItem } from '../shared/components/field-view-item/FieldViewItem';
import { PlatformAction } from '../shared/components/PlatformActions';
import { TAllTypes } from '../data-providers/interfaces/TAllTypes';
import { IProject } from '../data-providers/interfaces/IProject';
import { Editor } from '../shared/components/editors/Editor';
import { View } from '../shared/components/views/View';
import { Parser } from '../shared/components/Parser';
import { TFileOrFolder } from './TFileOrFolder';
import { TQuickPick } from './TQuickPick';
import { IDoc } from '../data-providers';


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
    readonly select: (key: string) => Promise<void>;
    readonly unselect: (key: string) => Promise<void>;
    readonly get: () => Promise<string[]>;
    readonly subscribe: (listener: (key: string[]) => Promise<void>) => () => void;
  }
  edition: {
    readonly open: (key: string) => Promise<void>;
    readonly close: (key: string) => Promise<void>;
    readonly get: () => Promise<string>;
    readonly subscribe: (listener: (key: string | undefined) => Promise<void>) => () => void;
  }
  fields: {
    readonly get: (key: string) => Promise<FieldViewItem[]>;
    readonly refresh: (key: string) => Promise<void>;
    readonly subscribe: (key: string, listener: ((fields: FieldViewItem[]) => Promise<void>)) => (() => void);
    readonly register: (fieldsDescriptor: FieldsDescriptor) => void;
    readonly unregister: (fieldsDescriptor: FieldsDescriptor) => void;
  }
  completions: {
    /**
     * Returns a list of completions
     * 
     * @param intent The intent of what need to suggest completions
     * @returns {Promise<TSerializableCompletionViewItem[]>} List of completions
     */
    readonly get: (intent: ICompletionsDescriptorIntent) => Promise<TSerializableCompletionViewItem[]>;
    /**
     * Register a completions descriptor to platform.
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
  }
  editors: {
    readonly reload: () => Promise<unknown>;
    readonly register: (editor: Editor) => void;
    readonly unregister: (editor: Editor) => void;
  }
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
  },
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
  },
  dataProviders: {
    project: () => IDoc<IProject>;
    findAnyResourceByKey<GResult extends TAllTypes>(key: string): Promise<[GResult, IDoc<GResult> | null]>;
  };
}
