import { PlatformAction } from './shared/components/PlatformActions';
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


  constructor() {
    this._eventLink.setExtensionEvent('activate', this.activate.bind(this));
    this._eventLink.setExtensionEvent('deactivate', this.deactivate.bind(this));
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
          view.tabs.forEach(tabView => {
            this._eventLink.setExtensionEvent(`views:${view.key}:tabsView:${tabView.key}:loadItems:${tabView.dataProvider.key}`, tabView.dataProvider.getItems);
            if (tabView.dataProvider.onItemClick) this._eventLink.setExtensionEvent(`views:${view.key}:tabsView:${tabView.key}:onItemClick:${tabView.dataProvider.key}`, tabView.dataProvider.onItemClick);
            if (tabView.dataProvider.onItemDoubleClick) this._eventLink.setExtensionEvent(`views:${view.key}:tabsView:${tabView.key}:onItemDoubleClick:${tabView.dataProvider.key}`, tabView.dataProvider.onItemDoubleClick);
          })
          view.actions?.forEach(action => {
            this._eventLink.setExtensionEvent(`views:${view.key}:actions:${action.key}`, action.action);
          });
        } else {
          this._eventLink.setExtensionEvent(`views:${view.key}:loadItems:${view.dataProvider.key}`, view.dataProvider.getItems);
          if (view.dataProvider.onItemClick) this._eventLink.setExtensionEvent(`views:${view.key}:onItemClick:${view.dataProvider.key}`, view.dataProvider.onItemClick);
          if (view.dataProvider.onItemDoubleClick) this._eventLink.setExtensionEvent(`views:${view.key}:onItemDoubleClick:${view.dataProvider.key}`, view.dataProvider.onItemDoubleClick);
          view.actions?.forEach(action => {
            this._eventLink.setExtensionEvent(`views:${view.key}:actions:${action.key}`, action.action);
          });
        }
      },
      unregister: (view: View | TabsView) => {
        if (view instanceof TabsView) {
          view.tabs.forEach(tabView => {
            this._eventLink.removeExtensionEvent(`views:${view.key}:tabsView:${tabView.key}:loadItems:${tabView.dataProvider.key}`);
            if (tabView.dataProvider.onItemClick) this._eventLink.removeExtensionEvent(`views:${view.key}:tabsView:${tabView.key}:onItemClick:${tabView.dataProvider.key}`);
            if (tabView.dataProvider.onItemDoubleClick) this._eventLink.removeExtensionEvent(`views:${view.key}:tabsView:${tabView.key}:onItemDoubleClick:${tabView.dataProvider.key}`);
          })
          view.actions?.forEach(action => {
            this._eventLink.removeExtensionEvent(`views:${view.key}:actions:${action.key}`);
          });
        } else {
          this._eventLink.removeExtensionEvent(`views:${view.key}:loadItems:${view.dataProvider.key}`);
          if (view.dataProvider.onItemClick) this._eventLink.removeExtensionEvent(`views:${view.key}:onItemClick:${view.dataProvider.key}`);
          if (view.dataProvider.onItemDoubleClick) this._eventLink.removeExtensionEvent(`views:${view.key}:onItemDoubleClick:${view.dataProvider.key}`);
          view.actions?.forEach(action => {
            this._eventLink.removeExtensionEvent(`views:${view.key}:actions:${action.key}`);
          });
        }
      },
    },
    editors: {
      /**
       * Allow you to open a item in a editor based on the item type
       * 
       * @param key Identifier of a item to be opened for some editor
       */
      open: async (key: string) => {
        await this._eventLink.callStudioEvent(`editors:open`, key);
      },
      register: (view: Editor) => {
        this._eventLink.setExtensionEvent(`editors:${view.key}:forwardEvents:receive`, async (...values) => view.onDidReceiveMessage?.(...values));

        view.__internal_subscribeToSend(`editors:${view.key}:forwardEvents:send`, async (...values) => {
          return await this._eventLink.callStudioEvent(`editors:${view.key}:forwardEvents:send`, ...values);
        });

        view.actions?.forEach(action => {
          this._eventLink.setExtensionEvent(`editors:${view.key}:actions:${action.key}`, action.action);
        });
      },
      unregister: (view: Editor) => {
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
}
