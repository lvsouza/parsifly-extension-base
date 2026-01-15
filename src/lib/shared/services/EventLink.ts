import * as ComLink from 'comlink';
import { Envs } from '../../Envs';


type TEventLinkCaller = <GParams = unknown, GReturn = unknown>(key: string, ...params: GParams[]) => Promise<GReturn>;


export class EventLink {
  static #LISTENERS = new Map<string, <GParams = unknown, GReturn = unknown | void>(...params: GParams[]) => Promise<GReturn>>();
  static #STUDIO: Record<'callEvent', TEventLinkCaller> | undefined;


  public static initialize() {
    if (EventLink.#STUDIO) return;

    ComLink.expose({ callEvent: EventLink.#receiveEvent.bind(this) });
    EventLink.#STUDIO = ComLink.wrap(self as any) as Record<'callEvent', TEventLinkCaller>;
  }


  static #receiveEvent<GParams = unknown, GReturn = unknown>(key: string, ...params: GParams[]): Promise<GReturn> {
    const event = this.#LISTENERS.get(key);

    if (Envs.DEBUG) {
      console.log(this.#LISTENERS.keys());
    }

    if (!event) {
      if (Envs.DEBUG) console.warn(`[EXTENSION] Event with key "${key}" was not found.`);
      return Promise.resolve(undefined as GReturn);
    }

    return event(...params);
  }


  public static sendEvent<GParams = unknown, GReturn = unknown>(key: string, ...params: GParams[]): Promise<GReturn> {
    if (!this.#STUDIO) throw new Error("EventLink not initiate. Call initialize before.");

    return this.#STUDIO.callEvent(key, ...params);
  }


  public static addEventListener<GParams = unknown, GReturn = unknown>(key: string, listener: (...params: GParams[]) => Promise<GReturn>): void {
    if (!this.#STUDIO) throw new Error("EventLink not initiate. Call initialize before.");

    this.#LISTENERS.set(key, listener as any);
  }

  public static removeEventListener(key: string) {
    if (!this.#STUDIO) throw new Error("EventLink not initiate. Call initialize before.");

    this.#LISTENERS.delete(key);
  }
}
