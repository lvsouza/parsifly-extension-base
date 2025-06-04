type TEvent<GParams = unknown, GReturn = unknown> = (...params: GParams[]) => Promise<GReturn>;
export declare class EventLink {
    private _events;
    private _studioWrapper;
    constructor();
    setExtensionEvent<GParams = unknown, GReturn = unknown>(key: string, event: TEvent<GParams, GReturn>): void;
    removeExtensionEvent(key: string): void;
    callStudioEvent<GParams = unknown, GReturn = unknown>(key: string, ...params: GParams[]): Promise<GReturn>;
    private _callExtensionEvent;
}
export {};
