import * as ComLink from 'comlink';


type TStudioApi = {
  /** Allows you to send a message to your extension host */
  send: ComLink.Remote<(...data: any[]) => Promise<any>>;
  /** Allows you to subscribe to receive a message from your extension host */
  subscribeToMessage(fn: (...params: any[]) => void): () => void;
}

/**
 * Allows you to send and subscribe to receive message from your extension host
 */
export const acquireStudioApi = (): TStudioApi => {
  if ((window as any).studioApi) return (window as any).studioApi as TStudioApi;

  const listeners = new Set<((...params: any[]) => void)>();
  const channel = new MessageChannel();


  const apiAtIframe = {
    async send(...data: any[]): Promise<any> {
      listeners.forEach(listener => listener(...data));
    }
  };

  ComLink.expose(apiAtIframe, channel.port1);
  window.parent.postMessage({ type: 'connect' }, '*', [channel.port2]);


  const apiStudio = ComLink.wrap<typeof apiAtIframe>(channel.port1);

  (window as any).studioApi = {
    send: apiStudio.send,
    subscribeToMessage(fn: (...params: any[]) => void): () => void {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };

  return (window as any).studioApi;
}
