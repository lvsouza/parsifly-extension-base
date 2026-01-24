import { EventLink } from '../../shared/services/EventLink';


export class EditionManager {
  #edition: Set<((key: string | undefined) => void)> = new Set([]);


  constructor() {
    EventLink.addEventListener('edition:subscription', async key => this.#edition.forEach(listener => listener(key as string | undefined)));
  }


  /**
   * Opens an item in an editor appropriate for its type.
   * @param type The type of editor to use (e.g., 'text', 'graph').
   * @param key The unique identifier of the content/item to open.
   */
  public async open(type: string, customData: any) {
    await EventLink.sendEvent(`edition:open`, type, customData);
  }

  /**
   * Closes an item if it is currently open in an editor.
   * @param key The unique identifier of the item to close.
   */
  public async close() {
    await EventLink.sendEvent(`edition:close`);
  }

  /**
   * Retrieves the identifier of the item currently active/being edited.
   * @returns {Promise<string>} A promise resolving to the active item's ID.
   */
  public async get(): Promise<string> {
    return await EventLink.sendEvent(`edition:get`);
  }

  /**
   * Subscribes to changes in the active edition item.
   * @param listener A function called when the active item changes. Receives the key or undefined if nothing is open.
   * @returns {() => void} A function to unsubscribe the listener.
   */
  public subscribe(listener: (key: string | undefined) => Promise<void>): () => void {
    this.#edition.add(listener);
    return () => this.#edition.delete(listener);
  }
}
