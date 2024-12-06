import workerpool from 'workerpool';

import { IPlatformAction } from './PlatformAction';


export abstract class ExtensionBase {
  public platformActions: IPlatformAction[] = [];


  constructor() {
    workerpool.worker({
      activate: this.activate.bind(this),
      deactivate: this.deactivate.bind(this),
      platformActions: this._platformActions.bind(this),
    })
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
}
