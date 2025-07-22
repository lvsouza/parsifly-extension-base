import { Action } from './Action';


interface IEditorProps {
  key: string;
  actions?: Action[];
  onDidReceiveMessage?: (...values: unknown[]) => Promise<void>;
}
export class Editor {
  private readonly _messageSenderListeners = new Map<string, ((...values: unknown[]) => Promise<unknown>)>();


  public readonly key: IEditorProps['key'];
  public readonly actions: IEditorProps['actions'];
  public readonly onDidReceiveMessage: IEditorProps['onDidReceiveMessage'];


  public readonly webView = {
    sendMessage: async (...values: unknown[]) => {
      this._messageSenderListeners.forEach(listener => listener(...values));
    },
  } as const

  constructor(props: IEditorProps) {
    this.key = props.key;
    this.actions = props.actions;
    this.onDidReceiveMessage = props.onDidReceiveMessage;
  }


  public __internal_subscribeToSend(key: string, fn: ((...values: unknown[]) => Promise<unknown>)) {
    this._messageSenderListeners.set(key, fn);
  }
  public __internal_removeSubscribeToSend(key: string) {
    this._messageSenderListeners.delete(key);
  }
}
