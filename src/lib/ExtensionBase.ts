import * as ComLink from 'comlink';

import { TApplicationMethods } from './types/TApplicationMethods';
import { TPlatformAction } from './types/TPlatformAction';
import { TParser } from './types/TParser';


export abstract class ExtensionBase {
  private _mainThread: TApplicationMethods;


  public platformActions: TPlatformAction[] = [];

  public parsers: TParser[] = [];


  constructor() {
    ComLink.expose({
      activate: this.activate.bind(this),
      deactivate: this.deactivate.bind(this),

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


  private _platformActions(key: string): void {
    const platformAction = this.platformActions.find(platformAction => platformAction.key === key);
    if (!platformAction) throw new Error(`Action with key "${key}" not found`);

    platformAction.action();
  }

  private _parsers(key: string, data: any) {
    const parser = this.parsers.find(parser => parser.key === key);
    if (!parser) throw new Error(`Parser with key "${key}" not found`);

    return parser.parser(data);
  }


  public readonly application: TApplicationMethods = {
    downloadFile: async (fileName, fileType, fileContent) => {
      return await this._mainThread.downloadFile(fileName, fileType, fileContent);
    },
    downloadFiles: async (downloadName, files) => {
      return await this._mainThread.downloadFiles(downloadName, files);
    },
    feedback: async (message, type) => {
      return await this._mainThread.feedback(message, type);
    },
  } as const
}
