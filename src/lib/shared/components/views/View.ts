import { TSerializableView, TView, TViewContentDefault, TViewMountContext } from './TView';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';
import { Action } from '../actions/Actions';


export type TViewConstructor<GViewContent extends TViewContentDefault> = {
  key: string;
  onRequestOpen?: () => Promise<void>;
  initialValue?: Partial<TView<GViewContent>>,
  onDidMount?: TOnDidMount<TViewMountContext<GViewContent>>;
}

export class View<GViewContent extends TViewContentDefault> {
  public readonly registerId: string;
  public readonly key: TViewConstructor<GViewContent>['key'];
  public readonly onDidMount: TViewConstructor<GViewContent>['onDidMount'];
  public readonly onRequestOpen: TViewConstructor<GViewContent>['onRequestOpen'];
  public readonly defaultValue: NonNullable<TViewConstructor<GViewContent>['initialValue']>;


  constructor(props: TViewConstructor<GViewContent>) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.registerId = crypto.randomUUID();
    this.onRequestOpen = props.onRequestOpen;
    this.defaultValue = props.initialValue || {};
    this.defaultValue.type = 'view';
  }


  #createContext(internalValue: typeof this.defaultValue, mountId: string, customData: unknown): TViewMountContext<GViewContent> {
    return {
      customData: customData,
      currentValue: internalValue as TView<GViewContent>,
      refetch: async () => {
        return await EventLink.sendEvent(`view:${mountId}:refetch`);
      },
      close: async () => {
        return await EventLink.sendEvent(`views:close`, mountId);
      },
      set: async <GKey extends keyof TView<GViewContent>>(property: GKey, newValue: TView<GViewContent>[GKey]) => {
        switch (property) {
          case 'getTabs':
          case 'getActions':
            internalValue[property] = newValue;
            return;

          default:
            internalValue[property] = newValue;
            return await EventLink.sendEvent(`view:${mountId}:set`, { property, newValue });
        }
      },
    } satisfies TViewMountContext<GViewContent>;
  };


  async #onDidMount(mountId: string, customData: unknown): Promise<void> {
    const internalValue = this.defaultValue;

    const context = this.#createContext(internalValue, mountId, customData);

    const registeredActions = new Set<Action>();
    EventLink.addEventListener(`view:${mountId}:getActions`, async () => {
      const actions = await internalValue.getActions?.(context) || [];

      registeredActions.forEach((item) => item.unregister());
      registeredActions.clear();

      for (const action of actions) {
        action.register();
        registeredActions.add(action);
      }

      return actions.map(action => action.serialize());
    });

    const registeredTabs = new Set<Action>();
    EventLink.addEventListener(`view:${mountId}:getTabs`, async () => {
      const tabs = await internalValue.getTabs?.(context) || [];

      registeredTabs.forEach((item) => item.unregister());
      registeredTabs.clear();

      for (const tab of tabs) {
        tab.register();
        registeredTabs.add(tab);
      }

      return tabs.map(tab => tab.serialize());
    });

    let registeredViewContent: GViewContent | undefined;
    EventLink.addEventListener(`view:${mountId}:getViewContent`, async () => {
      registeredViewContent?.unregister();

      const viewContent = await internalValue.getViewContent?.(context);
      if (!viewContent) throw new Error(`View content not found for "${this.key}" view`);

      viewContent.register();
      registeredViewContent = viewContent;

      return viewContent.serialize();
    });

    const onDidUnmount = await this.onDidMount?.(context);

    EventLink.addEventListener(`view:${mountId}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      registeredViewContent?.unregister();

      registeredActions.forEach((item) => item.unregister());
      registeredActions.clear();

      registeredTabs.forEach((item) => item.unregister());
      registeredTabs.clear();

      EventLink.removeEventListener(`view:${mountId}:getTabs`);
      EventLink.removeEventListener(`view:${mountId}:getActions`);
      EventLink.removeEventListener(`view:${mountId}:onDidUnmount`);
      EventLink.removeEventListener(`view:${mountId}:getViewContent`);
    });
  }

  async #onRequestOpen() {
    await this.onRequestOpen?.();
  }

  public register() {
    EventLink.addEventListener<any>(`view:${this.registerId}:onDidMount`, this.#onDidMount.bind(this));
    EventLink.addEventListener<any>(`view:${this.key}:onRequestOpen`, this.#onRequestOpen.bind(this));
  }

  public unregister() {
    EventLink.removeEventListener(`view:${this.key}:onRequestOpen`);
    EventLink.removeEventListener(`view:${this.registerId}:onDidMount`);
  }

  public serialize(): TSerializableView {
    if (!this.defaultValue.title) throw new Error(`Title not defined for "${this.key}" view`);
    if (!this.defaultValue.position) throw new Error(`Position not defined for "${this.key}" view`);
    if (!this.defaultValue.getViewContent) throw new Error(`Get view content not defined for "${this.key}" view`);
    if (!this.defaultValue.selector && this.defaultValue.position === 'editor') throw new Error(`Selector not defined for "${this.key}" view`);

    return {
      type: 'view',
      key: this.key,
      registerId: this.registerId,
      icon: this.defaultValue.icon,
      order: this.defaultValue.order,
      title: this.defaultValue.title,
      position: this.defaultValue.position,
      allowWindow: this.defaultValue.allowWindow,
      selector: this.defaultValue.selector || [],
      description: this.defaultValue.description,
      allowedPositions: this.defaultValue.allowedPositions as [],
      window: {
        width: this.defaultValue.window?.width,
        height: this.defaultValue.window?.height,
        anchor: this.defaultValue.window?.anchor,
        draggable: this.defaultValue.window?.draggable,
        resizable: this.defaultValue.window?.resizable,
      },
    };
  }
}
