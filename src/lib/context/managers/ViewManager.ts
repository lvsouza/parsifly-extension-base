import { TViewContentDefault } from '../../shared/components/views/TView';
import { EventLink } from '../../shared/services/EventLink';
import { View } from '../../shared/components/views/View';



export class OpenedViewManager {
  constructor(
    public mountId: string
  ) { }

  public async close(): Promise<void> {
    return await EventLink.sendEvent(`views:close`, this.mountId);
  }
}

type TViewOpenProps<T = unknown> = {
  key: string;
  customData?: T;
  windowMode?: boolean;
}

export class ViewManager {
  #views: Set<View<TViewContentDefault>> = new Set([]);


  constructor() {
    EventLink.addEventListener('views:load', async () => Array.from(this.#views).map(view => view.serialize()));
  }


  public async open(props: TViewOpenProps): Promise<OpenedViewManager> {
    const mountId = await EventLink.sendEvent<unknown, string>(`views:open`, props);
    return new OpenedViewManager(mountId);
  }

  public async close(mountId: string) {
    return await EventLink.sendEvent(`views:close`, mountId);
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
}
