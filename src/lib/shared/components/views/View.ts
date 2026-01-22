import { TSerializableView, TView, TViewMountContext } from './TView';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';
import { Action } from '../actions/Actions';


export type TViewConstructor = {
  key: string;
  initialValue?: Partial<TView>,
  onDidMount?: TOnDidMount<TViewMountContext>;
}

export class View {
  public readonly key: TViewConstructor['key'];
  public readonly onDidMount: TViewConstructor['onDidMount'];
  public readonly internalValue: NonNullable<Partial<TViewConstructor['initialValue']>>;


  constructor(props: TViewConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
    this.internalValue.type = 'view';
  }


  #createContext(mountId: string): TViewMountContext {
    return {
      currentValue: this.internalValue as TView,
      refetch: async () => {
        return await EventLink.sendEvent(`view:${mountId}:refetch`);
      },
      set: async <GKey extends keyof TView>(property: GKey, newValue: TView[GKey]) => {
        switch (property) {
          case 'getTabs':
          case 'getActions':
            this.internalValue[property] = newValue;
            return;

          default:
            this.internalValue[property] = newValue;
            return await EventLink.sendEvent(`view:${mountId}:set`, { property, newValue });
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const context = this.#createContext(mountId);

    const registeredActions = new Set<Action>();
    EventLink.addEventListener(`view:${mountId}:getActions`, async () => {
      const actions = await this.internalValue.getActions?.(context) || [];

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
      const tabs = await this.internalValue.getTabs?.(context) || [];

      registeredTabs.forEach((item) => item.unregister());
      registeredTabs.clear();

      for (const tab of tabs) {
        tab.register();
        registeredTabs.add(tab);
      }

      return tabs.map(tab => tab.serialize());
    });

    const onDidUnmount = await this.onDidMount?.(context);

    EventLink.addEventListener(`view:${mountId}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      registeredActions.forEach((item) => item.unregister());
      registeredActions.clear();

      registeredTabs.forEach((item) => item.unregister());
      registeredTabs.clear();

      EventLink.removeEventListener(`view:${mountId}:getTabs`);
      EventLink.removeEventListener(`view:${mountId}:getActions`);
      EventLink.removeEventListener(`view:${mountId}:onDidUnmount`);
    });
  }


  public register() {
    EventLink.addEventListener(`view:${this.key}:onDidMount`, this.#onDidMount.bind(this));
    this.internalValue.viewContent?.register();
  }

  public unregister() {
    EventLink.removeEventListener(`view:${this.key}:onDidMount`);
    this.internalValue.viewContent?.unregister();
  }

  public serialize(): TSerializableView {
    if (!this.internalValue.title) throw new Error(`Title not defined for "${this.key}" view`);
    if (!this.internalValue.position) throw new Error(`Position not defined for "${this.key}" view`);
    if (!this.internalValue.viewContent) throw new Error(`View content not defined for "${this.key}" view`);
    if (!this.internalValue.selector && this.internalValue.position === 'editor') throw new Error(`Selector not defined for "${this.key}" view`);

    return {
      type: 'view',
      key: this.key,
      icon: this.internalValue.icon,
      order: this.internalValue.order,
      title: this.internalValue.title,
      position: this.internalValue.position,
      selector: this.internalValue.selector || [],
      description: this.internalValue.description,
      viewContent: this.internalValue.viewContent.serialize(),
    };
  }
}
