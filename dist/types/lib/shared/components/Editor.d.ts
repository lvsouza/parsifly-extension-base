import { Action } from './Action';
interface IEditorProps {
    key: string;
    actions?: Action[];
    onDidReceiveMessage?: (...values: unknown[]) => Promise<void>;
}
export declare class Editor {
    private readonly _messageSenderListeners;
    readonly key: IEditorProps['key'];
    readonly actions: IEditorProps['actions'];
    readonly onDidReceiveMessage: IEditorProps['onDidReceiveMessage'];
    readonly webView: {
        readonly sendMessage: (...values: unknown[]) => Promise<void>;
    };
    constructor(props: IEditorProps);
    __internal_subscribeToSend(key: string, fn: ((...values: unknown[]) => Promise<unknown>)): void;
    __internal_removeSubscribeToSend(key: string): void;
}
export {};
