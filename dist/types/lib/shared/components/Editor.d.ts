import { Action } from './Action';
interface IEditorProps {
    key: string;
    actions?: Action[];
    /**
     * Listem for change of the item id that is edit in the moment
     *
     * @param id Id of the content to be edited
     */
    resolve?: (id: string) => Promise<void>;
    onDidReceiveMessage?: (...values: unknown[]) => Promise<void>;
}
export declare class Editor {
    private readonly _messageSenderListeners;
    readonly key: IEditorProps['key'];
    readonly actions: IEditorProps['actions'];
    readonly resolve: IEditorProps['resolve'];
    readonly onDidReceiveMessage: IEditorProps['onDidReceiveMessage'];
    readonly webView: {
        readonly sendMessage: (...values: unknown[]) => Promise<void>;
    };
    constructor(props: IEditorProps);
    __internal_subscribeToSend(key: string, fn: ((...values: unknown[]) => Promise<unknown>)): void;
    __internal_removeSubscribeToSend(key: string): void;
}
export {};
