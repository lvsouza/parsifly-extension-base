import { StatusBarItem } from '../../shared/components/status-bar-items/StatusBarItems';
import { EventLink } from '../../shared/services/EventLink';


export class StatusBarManager {
  #statusBarItems: Set<StatusBarItem> = new Set([]);


  constructor() {
    EventLink.addEventListener('statusBarItems:load', async () => Array.from(this.#statusBarItems).map(statusBarItem => statusBarItem.serialize()));
  }


  /**
   * Reloads the status bar items configuration.
   */
  public async reload() {
    return await EventLink.sendEvent(`statusBarItems:change`, Array.from(this.#statusBarItems).map(statusBarItem => statusBarItem.serialize()));
  }

  /**
   * Registers a new item to the status bar.
   * @param statusBarItem The status bar item to register.
   */
  public async register(statusBarItem: StatusBarItem) {
    statusBarItem.register();
    this.#statusBarItems.add(statusBarItem);
    await EventLink.sendEvent(`statusBarItems:change`, Array.from(this.#statusBarItems).map(statusBarItem => statusBarItem.serialize()));
  }

  /**
   * Unregisters an existing item from the status bar.
   * @param statusBarItem The status bar item to unregister.
   */
  public async unregister(statusBarItem: StatusBarItem) {
    statusBarItem.unregister();
    this.#statusBarItems.delete(statusBarItem);
    await EventLink.sendEvent(`statusBarItems:change`, Array.from(this.#statusBarItems).map(statusBarItem => statusBarItem.serialize()));
  }
}
