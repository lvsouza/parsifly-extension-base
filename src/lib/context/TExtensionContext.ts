import { CompletionsDescriptor, ICompletionsDescriptorIntent } from '../shared/descriptors/CompletionsDescriptor';
import { TSerializableCompletionViewItem } from '../shared/components/completion-view-item/TCompletionViewItem';
import { TSerializableDiagnosticViewItem } from '../shared/components/diagnostic-view-item/TDiagnosticViewItem';
import { DiagnosticAnalyzer, TAnalyzerMode, TAnalyzerResource } from '../shared/analyzers/DiagnosticAnalyzer';
import { ProjectDescriptor, TSerializableProjectDescriptor } from '../shared/descriptors/ProjectDescriptor';
import { TSerializableFieldViewItem } from '../shared/components/field-view-item/TFieldViewItem';
import { StatusBarItem } from '../shared/components/status-bar-items/StatusBarItems';
import { FieldsDescriptor } from '../shared/descriptors/FieldsDescriptor';
import { TQuery, TQueryResults, TWatchQuery } from '../types/TQuery';
import { Action } from '../shared/components/actions/Actions';
import { Editor } from '../shared/components/editors/Editor';
import { Parser } from '../shared/components/parsers/Parser';
import { View } from '../shared/components/views/View';
import { TFileOrFolder } from '../types/TFileOrFolder';
import { TQuickPick } from '../types/TQuickPick';


export type TExtensionContext = {
  quickPick: {
    /**
     * Displays a Quick Pick interface to the user, allowing them to select an option or enter text.
     * * @template T The expected type of the returned value.
     * @param props Configuration properties for the Quick Pick.
     * @returns A promise that resolves to the selected item or value.
     */
    readonly show: <T = unknown>(props: TQuickPick) => Promise<T>;
  };

  platformActions: {
    /**
     * Reloads the platform actions configuration.
     */
    readonly reload: () => Promise<void>;
    /**
     * Registers a new action to the platform.
     * * @param platformAction The action definition to register.
     */
    readonly register: (platformAction: Action) => Promise<void>;
    /**
     * Unregisters an existing action from the platform.
     * * @param platformAction The action definition to unregister.
     */
    readonly unregister: (platformAction: Action) => Promise<void>;
  };

  statusBarItems: {
    /**
     * Reloads the status bar items configuration.
     */
    readonly reload: () => Promise<void>;
    /**
     * Registers a new item to the status bar.
     * * @param statusBarItem The status bar item to register.
     */
    readonly register: (statusBarItem: StatusBarItem) => Promise<void>;
    /**
     * Unregisters an existing item from the status bar.
     * * @param statusBarItem The status bar item to unregister.
     */
    readonly unregister: (statusBarItem: StatusBarItem) => Promise<void>;
  };

  parsers: {
    /**
     * Reloads the parsers registry.
     */
    readonly reload: () => Promise<void>;
    /**
     * Registers a new parser.
     * * @param parser The parser instance to register.
     */
    readonly register: (parser: Parser) => Promise<void>;
    /**
     * Unregisters an existing parser.
     * * @param parser The parser instance to unregister.
     */
    readonly unregister: (parser: Parser) => Promise<void>;
  };

  views: {
    /**
     * Reloads the views registry.
     */
    readonly reload: () => Promise<void>;
    /**
     * Registers a new view to the platform.
     * * @param view The view definition to register.
     */
    readonly register: (view: View) => Promise<void>;
    /**
     * Unregisters an existing view from the platform.
     * * @param view The view definition to unregister.
     */
    readonly unregister: (view: View) => Promise<void>;
    /**
     * Activates and displays a specific view in the primary side bar.
     * * @param key The unique key identifying the view to show.
     */
    readonly showPrimarySideBarByKey: (key: string) => Promise<void>;
    /**
     * Activates and displays a specific view in the secondary side bar.
     * * @param key The unique key identifying the view to show.
     */
    readonly showSecondarySideBarByKey: (key: string) => Promise<void>;
  }

  selection: {
    /**
     * Selects an item in the platform using its identifier.
     * * @param key The identifier of the item to be selected.
     */
    readonly select: (key: string) => Promise<void>;
    /**
     * Deselects an item in the platform using its identifier.
     * * @param key The identifier of the item to be unselected.
     */
    readonly unselect: (key: string) => Promise<void>;
    /**
     * Retrieves the list of currently selected items in the platform.
     * * @returns {Promise<string[]>} A promise resolving to an array of selected item keys.
     */
    readonly get: () => Promise<string[]>;
    /**
     * Subscribes to changes in the selection state.
     * * @param listener A function to be called when the selection changes, receiving the new list of keys.
     * @returns {() => void} A function to unsubscribe the listener.
     */
    readonly subscribe: (listener: (key: string[]) => Promise<void>) => () => void;
  };

  edition: {
    /**
     * Opens an item in an editor appropriate for its type.
     * * @param type The type of editor to use (e.g., 'text', 'graph').
     * @param key The unique identifier of the content/item to open.
     */
    readonly open: (type: string, key: string) => Promise<void>;
    /**
     * Closes an item if it is currently open in an editor.
     * * @param key The unique identifier of the item to close.
     */
    readonly close: (key: string) => Promise<void>;
    /**
     * Retrieves the identifier of the item currently active/being edited.
     * * @returns {Promise<string>} A promise resolving to the active item's ID.
     */
    readonly get: () => Promise<string>;
    /**
     * Subscribes to changes in the active edition item.
     * * @param listener A function called when the active item changes. Receives the key or undefined if nothing is open.
     * @returns {() => void} A function to unsubscribe the listener.
     */
    readonly subscribe: (listener: (key: string | undefined) => Promise<void>) => () => void;
  };

  fields: {
    /**
     * Retrieves a list of fields for a specific resource.
     * * @param key The resource key used to fetch the fields.
     * @returns {Promise<TSerializableFieldViewItem[]>} A promise resolving to the list of serializable fields.
     */
    readonly get: (key: string) => Promise<TSerializableFieldViewItem[]>;
    /**
     * Requests the platform to refresh all fields associated with the resource.
     * * @param key The resource key to be refreshed.
     */
    readonly refresh: (key: string) => Promise<void>;
    /**
     * Subscribes to updates on form fields for a specific resource.
     * * @param key The resource key to watch.
     * @param listener Callback function triggered when fields are updated.
     * @returns {() => void} A function to unsubscribe the listener.
     */
    readonly subscribe: (key: string, listener: ((fields: TSerializableFieldViewItem[]) => Promise<void>)) => (() => void);
    /**
     * Registers a fields descriptor to the platform.
     * * @param fieldsDescriptor The descriptor object containing field definitions.
     */
    readonly register: (fieldsDescriptor: FieldsDescriptor) => void;
    /**
     * Unregisters a fields descriptor from the platform.
     * * @param fieldsDescriptor The descriptor object to unregister.
     */
    readonly unregister: (fieldsDescriptor: FieldsDescriptor) => void;
  };

  completions: {
    /**
     * Retrieves a list of code completion suggestions based on user intent.
     * * @param intent Contextual information about what needs completion (cursor position, file type, etc.).
     * @returns {Promise<TSerializableCompletionViewItem[]>} A promise resolving to the list of completion items.
     */
    readonly get: (intent: ICompletionsDescriptorIntent) => Promise<TSerializableCompletionViewItem[]>;
    /**
     * Registers a completions descriptor to the platform provider.
     * * @param completionsDescriptor The descriptor defining how completions are generated.
     */
    readonly register: (completionsDescriptor: CompletionsDescriptor) => void;
    /**
     * Unregisters a completions descriptor.
     * * @param completionsDescriptor The descriptor to remove.
     */
    readonly unregister: (completionsDescriptor: CompletionsDescriptor) => void;
  };

  projects: {
    /**
     * Retrieves the list of available projects.
     * * @returns {Promise<TSerializableProjectDescriptor[]>} A promise resolving to the list of project descriptors.
     */
    readonly get: () => Promise<TSerializableProjectDescriptor[]>;
    /**
     * Registers a project descriptor to the platform.
     * * @param projectDescriptor The project configuration to register.
     */
    readonly register: (projectDescriptor: ProjectDescriptor) => void;
    /**
     * Unregisters a project descriptor.
     * * @param projectDescriptor The project configuration to remove.
     */
    readonly unregister: (projectDescriptor: ProjectDescriptor) => void;
  };

  editors: {
    /**
     * Reloads the editor configuration/registry.
     */
    readonly reload: () => Promise<unknown>;
    /**
     * Registers a new editor type to the platform.
     * * @param editor The editor definition to register.
     */
    readonly register: (editor: Editor) => Promise<void>;
    /**
     * Unregisters an existing editor type.
     * * @param editor The editor definition to unregister.
     */
    readonly unregister: (editor: Editor) => Promise<void>;
  };

  download: {
    /**
     * Triggers the download of a single file with specific content.
     * * @param fileName The name of the file to be generated.
     * @param fileType The extension/type of the file.
     * @param fileContent The string content to be written to the file.
     */
    readonly downloadFile: (fileName: string, fileType: string, fileContent: string) => Promise<void>;
    /**
     * Triggers the download of multiple files and folders compressed into a ZIP archive.
     * * @param downloadName The name of the resulting ZIP file.
     * @param files An array of file or folder objects to be included in the download.
     */
    readonly downloadFiles: (downloadName: string, files: TFileOrFolder[]) => Promise<void>;
  };

  feedback: {
    /**
     * Displays an informational message.
     * @param message The text content of the message.
     */
    readonly info: (message: string) => Promise<void>;
    /**
     * Displays a warning message.
     * @param message The text content of the message.
     */
    readonly warning: (message: string) => Promise<void>;
    /**
     * Displays a success message.
     * @param message The text content of the message.
     */
    readonly success: (message: string) => Promise<void>;
    /**
     * Displays an error message.
     * @param message The text content of the message.
     */
    readonly error: (message: string) => Promise<void>;
  };

  data: {
    /**
     * Executes a query against the platform's data layer.
     * * @param query The query object to be executed.
     * @returns {Promise<TQueryResults>} A promise resolving to the query results.
     */
    execute(query: TQuery): Promise<TQueryResults>;
    /**
     * Subscribes to a live data query, watching for real-time updates.
     * * @template T The expected structure of the data being watched.
     * @param props The watch query configuration.
     * @returns {Promise<() => Promise<void>>} A promise resolving to an unsubscribe function.
     */
    subscribe<T extends Record<string, any>>(props: TWatchQuery<T>): Promise<() => Promise<void>>;
  };

  diagnostics: {
    /**
     * Retrieves the current list of diagnostics (errors, warnings) grouped by resource key.
     * * @returns {Promise<Record<string, TSerializableDiagnosticViewItem[]>>} A map of diagnostic items.
     */
    readonly get: () => Promise<Record<string, TSerializableDiagnosticViewItem[]>>;
    /**
     * Subscribes to diagnostic updates.
     * * @param listener Function called when diagnostics change.
     * @returns {() => void} A function to unsubscribe the listener.
     */
    readonly subscribe: (listener: (diagnostic: Record<string, TSerializableDiagnosticViewItem[]>) => Promise<void>) => (() => void);
    /**
     * Registers a diagnostic analyzer for a specific mode and resource.
     * * @template GMode The analyzer mode.
     * @template GResource The resource type being analyzed.
     * @param analyzer The analyzer instance to register.
     */
    readonly register: <GMode extends TAnalyzerMode, GResource extends TAnalyzerResource>(analyzer: DiagnosticAnalyzer<GMode, GResource>) => void;
    /**
     * Unregisters a diagnostic analyzer.
     * * @template GMode The analyzer mode.
     * @template GResource The resource type being analyzed.
     * @param analyzer The analyzer instance to unregister.
     */
    readonly unregister: <GMode extends TAnalyzerMode, GResource extends TAnalyzerResource>(analyzer: DiagnosticAnalyzer<GMode, GResource>) => void;
  };
};
