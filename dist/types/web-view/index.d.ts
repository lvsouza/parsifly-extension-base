import * as ComLink from 'comlink';
type TStudioApi = {
    /** Allows you to send a message to your extension host */
    send: ComLink.Remote<(...data: any[]) => Promise<any>>;
    /** Allows you to subscribe to receive a message from your extension host */
    subscribeToMessage(fn: (...params: any[]) => void): () => void;
};
/**
 * Allows you to send and subscribe to receive message from your extension host
 */
export declare const acquireStudioApi: () => TStudioApi;
export {};
