import { EventLink } from '../../shared/services/EventLink';


export class SelectionManager {
  #selection: Set<((key: string[]) => void)> = new Set([]);


  constructor() {
    EventLink.addEventListener('selection:subscription', async keys => this.#selection.forEach(listener => listener(keys as string[])));
  }


  /**
   * Selects an item in the platform using its identifier.
   * @param key The identifier of the item to be selected.
   */
  public async select(key: string) {
    await EventLink.sendEvent(`selection:select`, key);
  }

  /**
   * Deselects an item in the platform using its identifier.
   * @param key The identifier of the item to be unselected.
   */
  public async unselect(key: string) {
    await EventLink.sendEvent(`selection:unselect`, key);
  }

  /**
   * Retrieves the list of currently selected items in the platform.
   * @returns {Promise<string[]>} A promise resolving to an array of selected item keys.
   */
  public async get(): Promise<string[]> {
    return await EventLink.sendEvent(`selection:get`);
  }

  /**
   * Subscribes to changes in the selection state.
   * @param listener A function to be called when the selection changes, receiving the new list of keys.
   * @returns {() => void} A function to unsubscribe the listener.
   */
  public subscribe(listener: ((key: string[]) => Promise<void>)): (() => void) {
    this.#selection.add(listener);
    return () => this.#selection.delete(listener);
  }
}
