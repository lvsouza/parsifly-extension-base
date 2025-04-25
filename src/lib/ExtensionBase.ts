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
  activate(): void {
    console.log('Extensão ativada (método base).');
  }

  /**
   * Método chamado automaticamente ao desativar a extensão.
   * Pode ser sobrescrito pelas classes derivadas.
   */
  deactivate(): void {
    console.log('Extensão desativada (método base).');
  }


  private async _platformActions(key: string) {
    const platformAction = this.platformActions
      .flatMap(platformAction => 'action' in platformAction ? [platformAction] : platformAction.actions)
      .find(platformAction => platformAction.key === key);
    if (!platformAction) throw new Error(`Action with key "${key}" not found`);

    return await platformAction.action();
  }

  private async _parsers(key: string, data: any) {
    const parser = this.parsers.find(parser => parser.key === key);
    if (!parser) throw new Error(`Parser with key "${key}" not found`);

    return await parser.parser(data);
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
      feedback: async (message, type) => {
        return await this._mainThread['feedback'](message, type) as ReturnType<TApplicationCommands['feedback']>;
      },
      quickPick: async (props) => {
        return await this._mainThread['quick:pick'](props) as ReturnType<TApplicationCommands['quickPick']>;
      },
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
  } as const
}
