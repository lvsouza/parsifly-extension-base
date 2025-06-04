import * as ComLink from 'comlink';

import { Envs } from '../../Envs';


type TEvent<GParams = unknown, GReturn = unknown> = (...params: GParams[]) => Promise<GReturn>;

export class EventLink {
  private _events: Map<string, TEvent<any, any>> = new Map();
  private _studioWrapper: Record<'callEvent', (...args: unknown[]) => Promise<unknown>>;


  constructor() {
    ComLink.expose({ callEvent: this._callExtensionEvent.bind(this) });

    this._studioWrapper = ComLink.wrap(self as any);
  }


  public setExtensionEvent<GParams = unknown, GReturn = unknown>(key: string, event: TEvent<GParams, GReturn>) {
    this._events.set(key, event);
  }
  public removeExtensionEvent(key: string) {
    this._events.delete(key);
  }

  public async callStudioEvent<GParams = unknown, GReturn = unknown>(key: string, ...params: GParams[]): Promise<GReturn> {
    return this._studioWrapper.callEvent(key, ...params) as Promise<GReturn>;
  }


  private async _callExtensionEvent<GParams = unknown, GReturn = unknown>(key: string, ...params: GParams[]): Promise<GReturn> {
    const event = this._events.get(key);

    if (Envs.DEBUG) {
      console.log(this._events.keys());
    }

    if (!event) {
      throw new Error(`[EXTENSION] Event with key "${key}" was not found.`);
    }

    return event(...params);
  }
}
