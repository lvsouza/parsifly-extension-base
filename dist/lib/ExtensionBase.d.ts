export declare abstract class ExtensionBase {
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
}
