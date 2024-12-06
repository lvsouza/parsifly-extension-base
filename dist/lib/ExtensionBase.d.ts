import { IPlatformAction } from './PlatformAction';
export declare abstract class ExtensionBase {
    platformActions: IPlatformAction[];
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
}
