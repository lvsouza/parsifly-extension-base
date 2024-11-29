import workerpool from 'workerpool';


export abstract class ExtensionBase {
  constructor() {
    workerpool.worker({
      activate: this.activate,
      deactivate: this.deactivate,
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
}