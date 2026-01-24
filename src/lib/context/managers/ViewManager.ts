import { TViewContentDefault } from '../../shared/components/views/TView';
import { EventLink } from '../../shared/services/EventLink';
import { View } from '../../shared/components/views/View';


export class ViewManager {
  #views: Set<View<TViewContentDefault>> = new Set([]);


  constructor() {
    EventLink.addEventListener('views:load', async () => Array.from(this.#views).map(view => view.serialize()));
  }


  /**
   * Reloads the views registry.
   */
  public async reload() {
    return await EventLink.sendEvent(`views:change`, Array.from(this.#views).map(view => view.serialize()));
  }

  /**
   * Registers a new view to the platform.
   * @param view The view definition to register.
   */
  public async register<GViewContent extends TViewContentDefault>(view: View<GViewContent>) {
    view.register();
    this.#views.add(view as unknown as View<TViewContentDefault>);
    await EventLink.sendEvent(`views:change`, Array.from(this.#views).map(view => view.serialize()));
  }

  /**
   * Unregisters an existing view from the platform.
   * @param view The view definition to unregister.
   */
  public async unregister<GViewContent extends TViewContentDefault>(view: View<GViewContent>) {
    view.unregister();
    this.#views.delete(view as unknown as View<TViewContentDefault>);
    await EventLink.sendEvent(`views:change`, Array.from(this.#views).map(view => view.serialize()));
  }

  /**
   * Activates and displays a specific view in the primary side bar.
   * * @param key The unique key identifying the view to show.
   */
  public async showPrimarySideBarByKey(key: string): Promise<void> {
    return await EventLink.sendEvent<string, void>('views:primarySideBar:showByKey', key);
  }

  /**
   * Activates and displays a specific view in the secondary side bar.
   * @param key The unique key identifying the view to show.
   */
  public async showSecondarySideBarByKey(key: string): Promise<void> {
    return await EventLink.sendEvent<string, void>('views:secondarySideBar:showByKey', key);
  }

  /**
   * Activates and displays a specific view in the panel.
   * @param key The unique key identifying the view to show.
   */
  public async showPanelByKey(key: string): Promise<void> {
    return await EventLink.sendEvent<string, void>('views:panel:showByKey', key);
  }

}
