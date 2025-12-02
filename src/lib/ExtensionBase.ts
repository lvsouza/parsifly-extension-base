import { FieldsDescriptor } from './shared/descriptors/FieldsDescriptor';
import { FieldDescriptor } from './shared/descriptors/FieldDescriptor';
import { PlatformAction } from './shared/components/PlatformActions';
import { TDataProvider } from './shared/providers/TDataProvider';
import { FormProvider } from './shared/providers/FormProvider';
import { ListProvider } from './shared/providers/ListProvider';
import { TabsView } from './shared/components/TabsView';
import { EventLink } from './shared/services/EventLink';
import { createDataProviders } from './data-providers';
import { TFileOrFolder } from './types/TFileOrFolder';
import { Parser } from './shared/components/Parser';
import { Editor } from './shared/components/Editor';
import { TQuickPick } from './types/TQuickPick';
import { View } from './shared/components/View';


export abstract class ExtensionBase {
  private _eventLink: EventLink = new EventLink();

  private _selection: Set<((key: string[]) => void)> = new Set([]);
  private _edition: Set<((key: string | undefined) => void)> = new Set([]);
  private _fields: Map<string, Set<((fields: FieldDescriptor[]) => void)>> = new Map();


  constructor() {
    this._eventLink.setExtensionEvent('activate', this.activate.bind(this));
    this._eventLink.setExtensionEvent('deactivate', this.deactivate.bind(this));

    this._eventLink.setExtensionEvent('selection:subscription', async keys => this._selection.forEach(listener => listener(keys as string[])));
    this._eventLink.setExtensionEvent('edition:subscription', async key => this._edition.forEach(listener => listener(key as string | undefined)));
    this._eventLink.setExtensionEvent('fields:subscription', async (key, fields) => this._fields.get(key as string)?.forEach(listener => listener(fields as FieldDescriptor[])));
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

  public readonly application = {
    platformActions: {
      register: (platformAction: PlatformAction) => {
        if (platformAction.action) {
          this._eventLink.setExtensionEvent(`platformActions:${platformAction.key}`, platformAction.action);
        } else if (platformAction.actions) {
          platformAction.actions.forEach(action => {
            this._eventLink.setExtensionEvent(`platformActions:${platformAction.key}:actions:${action.key}`, action.action);
          });
        }
      },
      unregister: (platformAction: PlatformAction) => {
        if (platformAction.action) {
          this._eventLink.removeExtensionEvent(`platformActions:${platformAction.key}`);
        } else if (platformAction.actions) {
          platformAction.actions.forEach(action => {
            this._eventLink.removeExtensionEvent(`platformActions:${platformAction.key}:actions:${action.key}`);
          });
        }
      },
    },
    parsers: {
      register: (parser: Parser) => {
        this._eventLink.setExtensionEvent(`parsers:${parser.key}`, parser.parser);
      },
      unregister: (parser: Parser) => {
        this._eventLink.removeExtensionEvent(`parsers:${parser.key}`);
      },
    },
    views: {
      refresh: async (view: View | TabsView) => {
        await this._eventLink.callStudioEvent(`views:${view.key}:refresh`);
      },
      register: (view: View | TabsView) => {
        if (view instanceof TabsView) {
          view.tabs.forEach(tabView => this._registerViewDataProvider(`views:${view.key}:tabsView:${tabView.key}`, tabView.dataProvider))
          view.actions?.forEach(action => {
            this._eventLink.setExtensionEvent(`views:${view.key}:actions:${action.key}`, action.action);
          });
        } else {
          this._registerViewDataProvider(`views:${view.key}`, view.dataProvider);
          view.actions?.forEach(action => {
            this._eventLink.setExtensionEvent(`views:${view.key}:actions:${action.key}`, action.action);
          });
        }
      },
      unregister: (view: View | TabsView) => {
        if (view instanceof TabsView) {
          view.tabs.forEach(tabView => this._unregisterViewDataProvider(`views:${view.key}:tabsView:${tabView.key}`, tabView.dataProvider))
          view.actions?.forEach(action => {
            this._eventLink.removeExtensionEvent(`views:${view.key}:actions:${action.key}`);
          });
        } else {
          this._unregisterViewDataProvider(`views:${view.key}`, view.dataProvider);
          view.actions?.forEach(action => {
            this._eventLink.removeExtensionEvent(`views:${view.key}:actions:${action.key}`);
          });
        }
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
       * Returns a list of selected items in the platform
       * 
       * @returns {Promise<string[]>} List of selected items
       */
      get: async (): Promise<string[]> => {
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
       * @returns {Promise<FieldDescriptor[]>} List of fields
       */
      get: async (key: string): Promise<FieldDescriptor[]> => {
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
      subscribe: (key: string, listener: ((fields: FieldDescriptor[]) => Promise<void>)): (() => void) => {
        const listeners = this._fields.get(key)

        if (listeners) {
          listeners.add(listener);
        } else {
          this._fields.set(key, new Set([listener]))
        }

        return () => this._fields.get(key)?.delete(listener);
      },
      /**
       * Register a fields descriptor to platform. Make sure that key is at the `manifest.json`
       * 
       * @param fields Descriptor to be registered
       */
      register: (fields: FieldsDescriptor) => {
        this._eventLink.setExtensionEvent(`fields:${fields.key}:get`, fields.onGetFields);
      },
      /**
       * Unregister the descriptor
       * 
       * @param fields Descriptor to be unregistered
       */
      unregister: (fields: FieldsDescriptor) => {
        (fields as any).unregister();
        this._eventLink.removeExtensionEvent(`fields:${fields.key}:get`);
      },
    },
    editors: {
      register: (view: Editor) => {
        this._eventLink.setExtensionEvent(`editors:${view.key}:resolve`, async (id: string) => view.resolve?.(id));
        this._eventLink.setExtensionEvent(`editors:${view.key}:forwardEvents:receive`, async (...values) => view.onDidReceiveMessage?.(...values));

        view.__internal_subscribeToSend(`editors:${view.key}:forwardEvents:send`, async (...values) => {
          return await this._eventLink.callStudioEvent(`editors:${view.key}:forwardEvents:send`, ...values);
        });

        view.actions?.forEach(action => {
          this._eventLink.setExtensionEvent(`editors:${view.key}:actions:${action.key}`, action.action);
        });
      },
      unregister: (view: Editor) => {
        this._eventLink.removeExtensionEvent(`editors:${view.key}:resolve`);
        this._eventLink.removeExtensionEvent(`editors:${view.key}:forwardEvents:receive`);

        view.__internal_removeSubscribeToSend(`editors:${view.key}:forwardEvents:send`);

        view.actions?.forEach(action => {
          this._eventLink.removeExtensionEvent(`editors:${view.key}:actions:${action.key}`);
        });
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


  private _registerViewDataProvider(baseKey: string, dataProvider: TDataProvider) {
    if (dataProvider instanceof FormProvider) {
      this._eventLink.setExtensionEvent(`${baseKey}:getFields:${dataProvider.key}`, dataProvider.getFields);
    } else if (dataProvider instanceof ListProvider) {
      this._eventLink.setExtensionEvent(`${baseKey}:getItems:${dataProvider.key}`, dataProvider.getItems);
    }
  }

  private _unregisterViewDataProvider(baseKey: string, dataProvider: TDataProvider) {
    if (dataProvider instanceof FormProvider) {
      this._eventLink.removeExtensionEvent(`${baseKey}:getFields:${dataProvider.key}`);
    } else if (dataProvider instanceof ListProvider) {
      (dataProvider as any).unregister();
      this._eventLink.removeExtensionEvent(`${baseKey}:getItems:${dataProvider.key}`);
    }
  }
}
