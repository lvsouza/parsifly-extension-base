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
export class Editor {
  private readonly _messageSenderListeners = new Map<string, ((...values: unknown[]) => Promise<unknown>)>();


  public readonly key: IEditorProps['key'];
  public readonly actions: IEditorProps['actions'];
  public readonly resolve: IEditorProps['resolve'];
  public readonly onDidReceiveMessage: IEditorProps['onDidReceiveMessage'];


  public readonly webView = {
    sendMessage: async (...values: unknown[]) => {
      this._messageSenderListeners.forEach(listener => listener(...values));
    },
  } as const

  constructor(props: IEditorProps) {
    this.key = props.key;
    this.actions = props.actions;
    this.resolve = props.resolve;
    this.onDidReceiveMessage = props.onDidReceiveMessage;
  }


  public __internal_subscribeToSend(key: string, fn: ((...values: unknown[]) => Promise<unknown>)) {
    this._messageSenderListeners.set(key, fn);
  }
  public __internal_removeSubscribeToSend(key: string) {
    this._messageSenderListeners.delete(key);
  }
}
