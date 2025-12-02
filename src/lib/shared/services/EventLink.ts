import * as ComLink from 'comlink';

import { Envs } from '../../Envs';


/**
 * Async function to be registered in the Event Link
 */
export type TEvent<GParams = unknown, GReturn = unknown> = (...params: GParams[]) => Promise<GReturn>;

/**
 * Async bridge between this extension and the studio
 */
export class EventLink {
  private static _EVENTS: Map<string, TEvent<any, any>> = new Map();
  private static _STUDIO_WRAPPER: Record<'callEvent', (...args: unknown[]) => Promise<unknown>>;

  /**
   * @private
   * 
   * Initialize EventLink between this extension and the studio
   */
  constructor() {
    ComLink.expose({ callEvent: this._callExtensionEvent.bind(this) });

    EventLink._STUDIO_WRAPPER = ComLink.wrap(self as any);
  }


  /**
   * Register a async event listener to be called by the studio
   * 
   * @param key Key of the event to be registered
   * @param event Async event to be called by the studio
   */
  public setExtensionEvent<GParams = unknown, GReturn = unknown>(key: string, event: TEvent<GParams, GReturn>) {
    EventLink._EVENTS.set(key, event);
  }
  /**
   * Remove a event listener from the studio
   * @param key Event key to be removed
   */
  public removeExtensionEvent(key: string) {
    EventLink._EVENTS.delete(key);
  }
  /**
   * Call a async event at the studio can return a value on resolve
   * 
   * @param key Event key to be called
   * @param params Params to be forward to studio
   * @returns 
   */
  public async callStudioEvent<GParams = unknown, GReturn = unknown>(key: string, ...params: GParams[]): Promise<GReturn> {
    return EventLink._STUDIO_WRAPPER.callEvent(key, ...params) as Promise<GReturn>;
  }


  /**
   * Register a async event listener to be called by the studio
   * 
   * @param key Key of the event to be registered
   * @param event Async event to be called by the studio
   */
  public static setExtensionEvent<GParams = unknown, GReturn = unknown>(key: string, event: TEvent<GParams, GReturn>) {
    EventLink._EVENTS.set(key, event);
  }
  /**
   * Remove a event listener from the studio
   * @param key Event key to be removed
   */
  public static removeExtensionEvent(key: string) {
    EventLink._EVENTS.delete(key);
  }
  /**
   * Call a async event at the studio can return a value on resolve
   * 
   * @param key Event key to be called
   * @param params Params to be forward to studio
   * @returns 
   */
  public static async callStudioEvent<GParams = unknown, GReturn = unknown>(key: string, ...params: GParams[]): Promise<GReturn> {
    return EventLink._STUDIO_WRAPPER.callEvent(key, ...params) as Promise<GReturn>;
  }


  /**
   * @private
   * Internal: This function is async called when studio send a event to the extension 
   */
  private async _callExtensionEvent<GParams = unknown, GReturn = unknown>(key: string, ...params: GParams[]): Promise<GReturn> {
    const event = EventLink._EVENTS.get(key);

    if (Envs.DEBUG) {
      console.log(EventLink._EVENTS.keys());
    }

    if (!event) {
      console.warn(`[EXTENSION] Event with key "${key}" was not found.`);
      return Promise.resolve(undefined as GReturn);
    }

    return event(...params);
  }
}
