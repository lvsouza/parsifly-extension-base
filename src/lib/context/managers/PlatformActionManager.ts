import { Action } from '../../shared/components/actions/Actions';
import { EventLink } from '../../shared/services/EventLink';


export class PlatformActionManager {
  #actions: Set<Action> = new Set([]);


  constructor() {
    EventLink.addEventListener('platformActions:load', async () => Array.from(this.#actions).map(item => item.serialize()));
  }


  /**
   * Reloads the platform actions configuration.
   */
  public async reload() {
    return await EventLink.sendEvent(`platformActions:change`, Array.from(this.#actions).map(item => item.serialize()));
  }

  /**
   * Registers a new action to the platform.
   * @param platformAction The action definition to register.
   */
  public async register(item: Action) {
    item.register();
    this.#actions.add(item);
    await EventLink.sendEvent(`platformActions:change`, Array.from(this.#actions).map(item => item.serialize()));
  }

  /**
   * Unregisters an existing action from the platform.
   * @param platformAction The action definition to unregister.
   */
  public async unregister(item: Action) {
    item.unregister();
    this.#actions.delete(item);
    await EventLink.sendEvent(`platformActions:change`, Array.from(this.#actions).map(item => item.serialize()));
  }
}
