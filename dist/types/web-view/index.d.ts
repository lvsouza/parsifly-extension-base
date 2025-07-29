import * as ComLink from 'comlink';
type TDragEventMonitor = {
    x: number;
    y: number;
    droppableId: string;
    draggingId: string | undefined;
};
type TStudioApi = {
    /** Allows you to send a message to your extension host */
    send: ComLink.Remote<(...data: any[]) => Promise<any>>;
    /** Allows you to subscribe to receive a message from your extension host */
    subscribeToMessage(fn: (...params: any[]) => Promise<void>): () => void;
    /** Allows you to subscribe to receive drag events from studio */
    subscribeToDragEvent(fn: (type: 'dragover' | 'dragleave' | 'drop', data: any, monitor: TDragEventMonitor) => Promise<void>): () => void;
};
/**
 * Allows you to send and subscribe to receive message from your extension host
 */
export declare const acquireStudioApi: () => TStudioApi;
export {};
