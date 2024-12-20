import * as ComLink from 'comlink';

import { TApplicationMethods } from './types/TApplicationMethods';
import { TPlatformAction } from './types/TPlatformAction';


export abstract class ExtensionBase {
  private _mainThread;


  public platformActions: TPlatformAction[] = [];


  constructor() {
    ComLink.expose({
      activate: this.activate.bind(this),
      deactivate: this.deactivate.bind(this),
      platformActions: this._platformActions.bind(this),
    });
    this._mainThread = ComLink.wrap<TApplicationMethods>({
      addEventListener: self.addEventListener,
      removeEventListener: self.removeEventListener,
      postMessage: (message, transfer) => self.postMessage(message, '/', transfer),
    });
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
    this.platformActions.forEach(platformAction => platformAction.key === key ? platformAction.action() : {});
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
