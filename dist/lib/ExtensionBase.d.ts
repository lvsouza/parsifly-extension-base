import { TApplicationMethods } from './types/TApplicationMethods';
import { TPlatformAction } from './types/TPlatformAction';
export declare abstract class ExtensionBase {
    private _mainThread;
    platformActions: TPlatformAction[];
    constructor();
    /**
     * Método chamado automaticamente ao ativar a extensão.
     * Pode ser sobrescrito pelas classes derivadas.
     */
    activate(): void;
    /**
     * Método chamado automaticamente ao desativar a extensão.
     * Pode ser sobrescrito pelas classes derivadas.
     */
    deactivate(): void;
    private _platformActions;
    readonly application: TApplicationMethods;
}
