import * as ComLink from 'comlink';

import { TApplicationDataProviders } from './types/TApplicationDataProviders';
import { TApplicationCommands } from './types/TApplicationCommands';
import { TPlatformAction } from './types/TPlatformAction';
import { TParser } from './types/TParser';
import { TView } from './types/TView';


export abstract class ExtensionBase {
  private _mainThread: Record<string, (...args: unknown[]) => Promise<unknown>>;


  public platformActions: TPlatformAction[] = [];

  public parsers: TParser[] = [];

  public views: TView[] = [];


  constructor() {
    ComLink.expose({
      activate: this.activate.bind(this),
      deactivate: this.deactivate.bind(this),

      views: this._views.bind(this),
      parsers: this._parsers.bind(this),
      platformActions: this._platformActions.bind(this),
    });

    this._mainThread = ComLink.wrap(self as any);
  }

  /**
   * Método chamado automaticamente ao ativar a extensão.
   * Pode ser sobrescrito pelas classes derivadas.
   */
  activate(): void | Promise<void> {
    console.log('Extension activated (base implementation).');
  }

  /**
   * Método chamado automaticamente ao desativar a extensão.
   * Pode ser sobrescrito pelas classes derivadas.
   */
  deactivate(): void | Promise<void> {
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

  private async _views(key: string, actionKey: string) {
    const view = this.views.find(view => view.key === key);
    if (!view) throw new Error(`Parser with key "${key}" not found`);

    const viewAction = view.actions.find(action => action.key === actionKey);
    if (!viewAction) throw new Error(`View action with key "${key}" not found`);

    return await viewAction.action();
  }


  public readonly application = {
    commands: {
      callCustomCommand: async (key: string, ...args: any[]) => {
        return await this._mainThread[key](...args);
      },
      downloadFile: async (fileName, fileType, fileContent) => {
        return await this._mainThread['download:file'](fileName, fileType, fileContent) as ReturnType<TApplicationCommands['downloadFile']>;
      },
      downloadFiles: async (downloadName, files) => {
        return await this._mainThread['download:files'](downloadName, files) as ReturnType<TApplicationCommands['downloadFiles']>;
      },
      editor: {
        feedback: async (message, type) => {
          return await this._mainThread['editor:feedback'](message, type) as ReturnType<TApplicationCommands['editor']['feedback']>;
        },
        showQuickPick: async (props) => {
          return await this._mainThread['editor:quickPick:show'](props) as ReturnType<TApplicationCommands['editor']['showQuickPick']>;
        },
        showPrimarySideBarByKey: async (key) => {
          return await this._mainThread['editor:primarySideBar:showByKey'](key) as ReturnType<TApplicationCommands['editor']['showPrimarySideBarByKey']>;
        },
        showSecondarySideBarByKey: async (key) => {
          return await this._mainThread['editor:secondarySideBar:showByKey'](key) as ReturnType<TApplicationCommands['editor']['showSecondarySideBarByKey']>;
        },
        setSideBarItems: async (key, items) => {
          return await this._mainThread['editor:sideBar:setItems'](key, items) as ReturnType<TApplicationCommands['editor']['setSideBarItems']>;
        },
      }
    } satisfies TApplicationCommands,
    dataProviders: {
      callCustomDataProvider: async (key: string, ...args: any[]) => {
        return await this._mainThread[key](...args);
      },
      project: Object.assign(
        async () => {
          return await this._mainThread['project']() as ReturnType<TApplicationDataProviders['project']>;
        },
        {
          pages: async (index?: number) => {
            return await this._mainThread['project.pages'](index) as ReturnType<TApplicationDataProviders['project']['pages']>;
          },
          services: async (index?: number) => {
            return await this._mainThread['project.services'](index) as ReturnType<TApplicationDataProviders['project']['services']>;
          },
          components: async (index?: number) => {
            return await this._mainThread['project.components'](index) as ReturnType<TApplicationDataProviders['project']['components']>;
          },
        }
      ),
    } satisfies TApplicationDataProviders,
  } as const;
}
