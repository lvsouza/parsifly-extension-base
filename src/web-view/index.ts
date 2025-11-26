import * as ComLink from 'comlink';


export type TDragEventMonitor = {
  x: number;
  y: number;
  droppableId: string;
  draggingId: string | undefined;
}

export type TStudioApi = {
  /** Allows you to send a message to your extension host */
  send: ComLink.Remote<(...data: any[]) => Promise<any>>;
  /** Allows you to subscribe to receive a message from your extension host */
  subscribeToMessage(fn: (...params: any[]) => Promise<void>): () => void;
  /** Allows you to subscribe to receive drag events from studio */
  subscribeToDragEvent(fn: (type: 'dragover' | 'dragleave' | 'drop', data: any, monitor: TDragEventMonitor) => Promise<void>): () => void;
}

/**
 * Allows you to send and subscribe to receive message from your extension host
 */
export const acquireStudioApi = (): TStudioApi => {
  if ((window as any).studioApi) return (window as any).studioApi as TStudioApi;

  const dragEventListeners = new Set<((...params: any[]) => Promise<void>)>();
  const listeners = new Set<((...params: any[]) => Promise<void>)>();
  const channel = new MessageChannel();


  const apiAtIframe = {
    async send(...data: any[]): Promise<any> {
      const promises: Promise<any>[] = [];

      for (const listener of listeners) {
        promises.push(listener(...data));
      }

      await Promise.all(promises);
    },
    async sendDragEvent(...data: any[]): Promise<any> {
      const promises: Promise<any>[] = [];

      for (const listener of dragEventListeners) {
        promises.push(listener(...data));
      }

      await Promise.all(promises);
    }
  };

  ComLink.expose(apiAtIframe, channel.port1);
  window.parent.postMessage({ type: 'connect' }, '*', [channel.port2]);


  const apiStudio = ComLink.wrap<typeof apiAtIframe>(channel.port1);

  (window as any).studioApi = {
    send: apiStudio.send,
    subscribeToMessage(fn: (...params: any[]) => Promise<void>): () => void {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    subscribeToDragEvent(fn: (...params: any[]) => Promise<void>): () => void {
      dragEventListeners.add(fn);
      return () => dragEventListeners.delete(fn);
    },
  };

  return (window as any).studioApi;
}
