import { TPlatformAction } from './types/TPlatformAction';
import { EventLink } from './shared/services/EventLink';
import { TFileOrFolder } from './types/TFileOrFolder';
import { TQuickPick } from './types/TQuickPick';
import { View } from './shared/components/View';
import { TParser } from './types/TParser';


export abstract class ExtensionBase {
  private _eventLink: EventLink = new EventLink();


  public platformActions: TPlatformAction[] = [];
  public parsers: TParser[] = [];
  public views: View[] = [];


  constructor() {
    this._eventLink.setExtensionEvent('activate', this.activate.bind(this));
    this._eventLink.setExtensionEvent('deactivate', this.deactivate.bind(this));
    this._eventLink.setExtensionEvent('parsers', this._parsers.bind(this));
    this._eventLink.setExtensionEvent('platformActions', this._platformActions.bind(this));
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


  private async _platformActions(key: string) {
    const platformAction = this.platformActions
      .flatMap(platformAction => 'action' in platformAction ? [platformAction] : platformAction.actions)
      .find(platformAction => platformAction.key === key);
    if (!platformAction) throw new Error(`Action with key "${key}" not found`);

    return await platformAction.action();
  }

  private async _parsers(key: string) {
    const parser = this.parsers.find(parser => parser.key === key);
    if (!parser) throw new Error(`Parser with key "${key}" not found`);

    return await parser.parser();
  }


  public readonly application = {
    views: {
      register: async (view: View) => {
        this._eventLink.setExtensionEvent(`views:${view.key}:loadItems:${view.dataProvider.key}`, view.dataProvider.getItems);
        view.actions?.forEach(action => {
          this._eventLink.setExtensionEvent(`views:${view.key}:actions:${action.key}`, action.action);
        });
      },
      unregister: async (view: View) => {
        this._eventLink.removeExtensionEvent(`views:${view.key}:loadItems:${view.dataProvider.key}`);
        view.actions?.forEach(action => {
          this._eventLink.removeExtensionEvent(`views:${view.key}:actions:${action.key}`);
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
    dataProviders: {
      /**
       * Allow you to call a custom command from application
       * 
       * @param key Name of the command
       * @param args List of arguments to be forwarded to the command call
       */
      callCustomDataProvider: async <GParam = unknown, GReturn = unknown>(key: string, ...args: GParam[]): Promise<GReturn> => {
        return await this._eventLink.callStudioEvent(key, ...args);
      },
      /**
       * Allow you to get the entire project object or get parts with ...project.pages(), .services(), .components() and more.
       */
      project: Object.assign(
        async (): Promise<any> => {
          return await this._eventLink.callStudioEvent<void, any>('project');
        },
        {
          pages: async (index?: number): Promise<any | any[]> => {
            return await this._eventLink.callStudioEvent<number | undefined, any | any[]>('project.pages', index);
          },
          services: async (index?: number): Promise<any | any[]> => {
            return await this._eventLink.callStudioEvent<number | undefined, any | any[]>('project.services', index);
          },
          components: async (index?: number): Promise<any | any[]> => {
            return await this._eventLink.callStudioEvent<number | undefined, any | any[]>('project.components', index);
          },
        }
      ),
    },
  } as const;
}
