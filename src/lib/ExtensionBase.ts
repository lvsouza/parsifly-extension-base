import { CompletionsDescriptor, ICompletionsDescriptorIntent } from './shared/descriptors/CompletionsDescriptor';
import { TSerializableCompletionViewItem } from './shared/components/completion-view-item/TCompletionViewItem';
import { FieldViewItem } from './shared/components/field-view-item/FieldViewItem';
import { FieldsDescriptor } from './shared/descriptors/FieldsDescriptor';
import { PlatformAction } from './shared/components/PlatformActions';
import { Editor } from './shared/components/editors/Editor';
import { EventLink } from './shared/services/EventLink';
import { createDataProviders } from './data-providers';
import { View } from './shared/components/views/View';
import { TFileOrFolder } from './types/TFileOrFolder';
import { Parser } from './shared/components/Parser';
import { TApplication } from './types/TApplication';
import { TQuickPick } from './types/TQuickPick';


export abstract class ExtensionBase {
  private _eventLink: EventLink = new EventLink();

  private _platformActions: Set<PlatformAction> = new Set([]);
  private _parsers: Set<Parser> = new Set([]);
  private _editors: Set<Editor> = new Set([]);
  private _views: Set<View> = new Set([]);

  private _selection: Set<((key: string[]) => void)> = new Set([]);
  private _edition: Set<((key: string | undefined) => void)> = new Set([]);
  private _fields: Map<string, Set<((fields: FieldViewItem[]) => void)>> = new Map();

  private _fieldsDescriptors: Set<FieldsDescriptor> = new Set([]);
  private _completionsDescriptors: Set<CompletionsDescriptor> = new Set([]);


  constructor() {
    this._eventLink.setExtensionEvent('activate', this.activate.bind(this));
    this._eventLink.setExtensionEvent('deactivate', this.deactivate.bind(this));

    this._eventLink.setExtensionEvent('selection:subscription', async keys => this._selection.forEach(listener => listener(keys as string[])));
    this._eventLink.setExtensionEvent('edition:subscription', async key => this._edition.forEach(listener => listener(key as string | undefined)));
    this._eventLink.setExtensionEvent('fields:subscription', async (key, fields) => this._fields.get(key as string)?.forEach(listener => listener(fields as FieldViewItem[])));

    this._eventLink.setExtensionEvent('parsers:load', async () => Array.from(this._parsers).map(parser => ({
      key: parser.key,
      icon: parser.internalValue.icon,
      label: parser.internalValue.label,
      description: parser.internalValue.description,
    })));
    this._eventLink.setExtensionEvent('platformActions:load', async () => Array.from(this._platformActions).map(platformAction => ({
      key: platformAction.key,
      icon: platformAction.internalValue.icon,
      label: platformAction.internalValue.label,
      children: platformAction.internalValue.children,
      description: platformAction.internalValue.description,
    })));
    this._eventLink.setExtensionEvent('views:load', async () => Array.from(this._views).map(view => ({
      key: view.key,
      icon: view.internalValue.icon,
      type: view.internalValue.type,
      title: view.internalValue.title,
      position: view.internalValue.position,
      description: view.internalValue.description,
      dataProvider: {
        key: view.internalValue.dataProvider?.key,
        type: view.internalValue.dataProvider?.type,
      }
    })));
    this._eventLink.setExtensionEvent('editors:load', async () => Array.from(this._editors).map(editor => ({
      key: editor.key,
      icon: editor.internalValue.icon,
      type: editor.internalValue.type,
      title: editor.internalValue.title,
      position: editor.internalValue.position,
      selector: editor.internalValue.selector,
      description: editor.internalValue.description,
      entryPoint: {
        basePath: editor.internalValue.entryPoint?.basePath,
        file: editor.internalValue.entryPoint?.file,
      },
    })));
    this._eventLink.setExtensionEvent('fields:get', async (key: string) => {
      return await Promise
        .all(
          Array
            .from(this._fieldsDescriptors)
            .map(async fieldsDescriptor => {
              const fields = await fieldsDescriptor.onGetFields(key);
              return fields;
            }),
        )
        .then(results => results.flatMap(result => result || []) || [])
    });
    this._eventLink.setExtensionEvent('completions:get', async (intent: ICompletionsDescriptorIntent) => {
      return await Promise
        .all(
          Array
            .from(this._completionsDescriptors)
            .map(async completionsDescriptor => {
              const completions = await completionsDescriptor.onGetCompletions(intent);
              return completions;
            }),
        )
        .then(results => results.flatMap(result => result || []) || [])
    });
  }


  /**
   * Automatically called when the extension start.
   */
  async activate(): Promise<void> {
    console.log('Extension activated (base implementation).');
  }

  /**
   * Automatically called when the extension stop.
   */
  async deactivate(): Promise<void> {
    console.log('Extension deactivated (base implementation).');
  }

  public readonly application: TApplication = {
    platformActions: {
      reload: async () => {
        return await this._eventLink.callStudioEvent(
          `platformActions:change`,
          Array.from(this._platformActions).map(platformAction => ({
            key: platformAction.key,
            icon: platformAction.internalValue.icon,
            label: platformAction.internalValue.label,
            children: platformAction.internalValue.children,
            description: platformAction.internalValue.description,
          })),
        );
      },
      register: (platformAction: PlatformAction) => {
        platformAction.register();
        this._platformActions.add(platformAction);
        this._eventLink.callStudioEvent(
          `platformActions:change`,
          Array.from(this._platformActions).map(platformActions => ({
            key: platformActions.key,
            icon: platformActions.internalValue.icon,
            label: platformActions.internalValue.label,
            children: platformAction.internalValue.children,
            description: platformActions.internalValue.description,
          })),
        );
      },
      unregister: (platformAction: PlatformAction) => {
        platformAction.unregister();
        this._platformActions.delete(platformAction);
        this._eventLink.callStudioEvent(
          `platformActions:change`,
          Array.from(this._platformActions).map(platformAction => ({
            key: platformAction.key,
            icon: platformAction.internalValue.icon,
            label: platformAction.internalValue.label,
            children: platformAction.internalValue.children,
            description: platformAction.internalValue.description,
          })),
        );
      },
    },
    parsers: {
      reload: async () => {
        return await this._eventLink.callStudioEvent(
          `parsers:change`,
          Array.from(this._parsers).map(parser => ({
            key: parser.key,
            icon: parser.internalValue.icon,
            label: parser.internalValue.label,
            description: parser.internalValue.description,
          })),
        );
      },
      register: (parser: Parser) => {
        parser.register();
        this._parsers.add(parser);
        this._eventLink.callStudioEvent(
          `parsers:change`,
          Array.from(this._parsers).map(parser => ({
            key: parser.key,
            icon: parser.internalValue.icon,
            label: parser.internalValue.label,
            description: parser.internalValue.description,
          })),
        );
      },
      unregister: (parser: Parser) => {
        parser.unregister();
        this._parsers.delete(parser);
        this._eventLink.callStudioEvent(
          `parsers:change`,
          Array.from(this._parsers).map(parser => ({
            key: parser.key,
            icon: parser.internalValue.icon,
            label: parser.internalValue.label,
            description: parser.internalValue.description,
          })),
        );
      },
    },
    views: {
      reload: async () => {
        return await this._eventLink.callStudioEvent(
          `views:change`,
          Array.from(this._views).map(view => ({
            key: view.key,
            icon: view.internalValue.icon,
            type: view.internalValue.type,
            title: view.internalValue.title,
            position: view.internalValue.position,
            description: view.internalValue.description,
            dataProvider: {
              key: view.internalValue.dataProvider?.key,
              type: view.internalValue.dataProvider?.type,
            }
          })),
        );
      },
      register: (view: View) => {
        view.register();
        this._views.add(view);
        this._eventLink.callStudioEvent(
          `views:change`,
          Array.from(this._views).map(view => ({
            key: view.key,
            icon: view.internalValue.icon,
            type: view.internalValue.type,
            title: view.internalValue.title,
            position: view.internalValue.position,
            description: view.internalValue.description,
            dataProvider: {
              key: view.internalValue.dataProvider?.key,
              type: view.internalValue.dataProvider?.type,
            }
          })),
        );
      },
      unregister: (view: View) => {
        view.unregister();
        this._views.delete(view);
        this._eventLink.callStudioEvent(
          `views:change`,
          Array.from(this._views).map(view => ({
            key: view.key,
            icon: view.internalValue.icon,
            type: view.internalValue.type,
            title: view.internalValue.title,
            position: view.internalValue.position,
            description: view.internalValue.description,
            dataProvider: {
              key: view.internalValue.dataProvider?.key,
              type: view.internalValue.dataProvider?.type,
            }
          })),
        );
      },
    },
    selection: {
      /**
       * Allow you to select a item
       * 
       * @param key Identifier of a item to be selected
       */
      select: async (key: string) => {
        await this._eventLink.callStudioEvent(`selection:select`, key);
      },
      /**
       * Allow you to unselect a item
       * 
       * @param key Identifier of a item to be unselected
       */
      unselect: async (key: string) => {
        await this._eventLink.callStudioEvent(`selection:unselect`, key);
      },
      /**
       * Returns a list of selected items in the platform
       * 
       * @returns {Promise<string[]>} List of selected items
       */
      get: async (): Promise<string[]> => {
        return await this._eventLink.callStudioEvent(`selection:get`);
      },
      /**
       * Subscribe to selection item key change
       * 
       * @returns {() => void} Unsubscribe function
       */
      subscribe: (listener: ((key: string[]) => Promise<void>)): (() => void) => {
        this._selection.add(listener);
        return () => this._selection.delete(listener);
      },
    },
    edition: {
      /**
       * Allow you to open a item in a editor based on the item type
       * 
       * @param key Identifier of a item to be opened for some editor
       */
      open: async (key: string) => {
        await this._eventLink.callStudioEvent(`edition:open`, key);
      },
      /**
       * Allow you to close a item if it is opened in the editor
       * 
       * @param key Identifier of a item to be closed
       */
      close: async (key: string) => {
        await this._eventLink.callStudioEvent(`edition:close`, key);
      },
      /**
       * Returns a edited item id in the platform
       * 
       * @returns {Promise<string>} Edited item id
       */
      get: async (): Promise<string> => {
        return await this._eventLink.callStudioEvent(`edition:get`);
      },
      /**
       * Subscribe to edition item key change
       * 
       * @returns {() => void} Unsubscribe function
       */
      subscribe: (listener: ((key: string | undefined) => Promise<void>)): (() => void) => {
        this._edition.add(listener);
        return () => this._edition.delete(listener);
      },
    },
    fields: {
      /**
       * Returns a list of fields
       * 
       * @param key Resource key to be refreshed
       * @returns {Promise<FieldViewItem[]>} List of fields
       */
      get: async (key: string): Promise<FieldViewItem[]> => {
        return await this._eventLink.callStudioEvent(`fields:get`, key);
      },
      /**
       * Request the platform to get again all fields for this resource
       * 
       * @param key Resource key to be refreshed
       */
      refresh: async (key: string) => {
        await this._eventLink.callStudioEvent(`fields:refresh`, key);
      },
      /**
       * Subscribe to form fields
       * 
       * @returns {() => void} Unsubscribe function
       */
      subscribe: (key: string, listener: ((fields: FieldViewItem[]) => Promise<void>)): (() => void) => {
        const listeners = this._fields.get(key)

        if (listeners) {
          listeners.add(listener);
        } else {
          this._fields.set(key, new Set([listener]))
        }

        return () => this._fields.get(key)?.delete(listener);
      },
      /**
       * Register a fields descriptor to platform.
       * 
       * @param fieldsDescriptor Descriptor to be registered
       */
      register: (fieldsDescriptor: FieldsDescriptor) => {
        this._fieldsDescriptors.add(fieldsDescriptor);
      },
      /**
       * Unregister the descriptor
       * 
       * @param fieldsDescriptor Descriptor to be unregistered
       */
      unregister: (fieldsDescriptor: FieldsDescriptor) => {
        fieldsDescriptor.unregister();
        this._fieldsDescriptors.delete(fieldsDescriptor);
      },
    },
    completions: {
      get: async (intent): Promise<TSerializableCompletionViewItem[]> => {
        return await this._eventLink.callStudioEvent(`completions:get`, intent);
      },
      register: (completionsDescriptor) => {
        this._completionsDescriptors.add(completionsDescriptor);
      },
      unregister: (completionsDescriptor) => {
        completionsDescriptor.unregister();
        this._completionsDescriptors.delete(completionsDescriptor);
      },
    },
    editors: {
      reload: async () => {
        return await this._eventLink.callStudioEvent(
          `editors:change`,
          Array.from(this._editors).map(editor => ({
            key: editor.key,
            icon: editor.internalValue.icon,
            type: editor.internalValue.type,
            title: editor.internalValue.title,
            position: editor.internalValue.position,
            selector: editor.internalValue.selector,
            description: editor.internalValue.description,
            entryPoint: {
              basePath: editor.internalValue.entryPoint?.basePath,
              file: editor.internalValue.entryPoint?.file,
            },
          })),
        );
      },
      register: (editor: Editor) => {
        editor.register();
        this._editors.add(editor);
        this._eventLink.callStudioEvent(
          `editors:change`,
          Array.from(this._editors).map(editor => ({
            key: editor.key,
            icon: editor.internalValue.icon,
            type: editor.internalValue.type,
            title: editor.internalValue.title,
            position: editor.internalValue.position,
            selector: editor.internalValue.selector,
            description: editor.internalValue.description,
            entryPoint: {
              basePath: editor.internalValue.entryPoint?.basePath,
              file: editor.internalValue.entryPoint?.file,
            },
          })),
        );
      },
      unregister: (editor: Editor) => {
        editor.unregister();
        this._editors.delete(editor);
        this._eventLink.callStudioEvent(
          `editors:change`,
          Array.from(this._editors).map(editor => ({
            key: editor.key,
            icon: editor.internalValue.icon,
            type: editor.internalValue.type,
            title: editor.internalValue.title,
            position: editor.internalValue.position,
            selector: editor.internalValue.selector,
            description: editor.internalValue.description,
            entryPoint: {
              basePath: editor.internalValue.entryPoint?.basePath,
              file: editor.internalValue.entryPoint?.file,
            },
          })),
        );
      },
    },
    commands: {
      /**
       * Allow you to call a custom command from application
       * 
       * @param key Name of the command
       * @param args List of arguments to be forwarded to the command call
       */
      callCustomCommand: async <GParam = unknown, GReturn = unknown>(key: string, ...args: GParam[]): Promise<GReturn> => {
        return await this._eventLink.callStudioEvent(key, ...args);
      },
      /**
       * Allow you to download some content in a file
       * 
       * @param fileName Name of the generated file
       * @param fileType extension of the file
       * @param fileContent file content in string
       */
      downloadFile: async (fileName: string, fileType: string, fileContent: string): Promise<void> => {
        return await this._eventLink.callStudioEvent<string, void>('download:file', fileName, fileType, fileContent);
      },
      /**
       * Allow you to download a lot of files and folders as zip
       * 
       * @param downloadName Name of the download as zip
       * @param files List of files or folders to download
       */
      downloadFiles: async (downloadName: string, files: TFileOrFolder[]): Promise<void> => {
        return await this._eventLink.callStudioEvent<string | TFileOrFolder[], void>('download:files', downloadName, files);
      },
      /**
       * Grouped methods to editor configuration
       */
      editor: {
        /**
         * Allow to show some feedback to the platform user
         * 
         * @param message Message of the feedback
         * @param type type of the feedback
         */
        feedback: async (message: string, type: "warning" | "success" | "error" | "info"): Promise<void> => {
          return await this._eventLink.callStudioEvent<string, void>('editor:feedback', message, type);
        },
        /**
         * Allow to capture user freeform text input
         * 
         * @param props Props to configure the quick pick
         */
        showQuickPick: async (props: TQuickPick): Promise<string | void> => {
          return await this._eventLink.callStudioEvent<TQuickPick, string | void>('editor:quickPick:show', props);
        },
        /**
         * Allow to set primary side bar view by key
         * 
         * @param key Key to identify the view to show in the side bar
         */
        showPrimarySideBarByKey: async (key: string): Promise<void> => {
          return await this._eventLink.callStudioEvent<string, void>('editor:primarySideBar:showByKey', key);
        },
        /**
         * Allow to set secondary side bar view by key
         * 
         * @param key Key to identify the view to show in the side bar
         */
        showSecondarySideBarByKey: async (key: string): Promise<void> => {
          return await this._eventLink.callStudioEvent<string, void>('editor:secondarySideBar:showByKey', key);
        },
      }
    },
    dataProviders: createDataProviders(this._eventLink),
  } as const;
}
