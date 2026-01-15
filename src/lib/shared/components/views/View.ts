import { TSerializableView, TView, TViewContext } from './TView';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';
import { Action } from '../actions/Actions';


export type TViewConstructor = {
  key: string;
  initialValue?: Partial<TView>,
  onDidMount?: TOnDidMount<TViewContext>;
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


  readonly #context: TViewContext = {
    refetchData: async () => {
      return await EventLink.sendEvent(`view:${this.key}:refetchData`);
    },
    set: async <GKey extends keyof TView>(property: GKey, newValue: TView[GKey]) => {
      switch (property) {
        case 'getTabs':
        case 'getActions':
          this.internalValue[property] = newValue;
          return;

        default:
          this.internalValue[property] = newValue;
          return await EventLink.sendEvent(`view:${this.key}:set`, { property, newValue });
      }
    },
  };


  async #onDidMount(): Promise<void> {
    const registeredActions = new Set<Action>();
    EventLink.addEventListener(`view:${this.key}:getActions`, async () => {
      const actions = await this.internalValue.getActions?.(this.#context) || [];

      registeredActions.forEach((item) => item.unregister());
      registeredActions.clear();

      for (const action of actions) {
        action.register();
        registeredActions.add(action);
      }

      return actions.map(action => action.serialize());
    });

    const registeredTabs = new Set<Action>();
    EventLink.addEventListener(`view:${this.key}:getTabs`, async () => {
      const tabs = await this.internalValue.getTabs?.(this.#context) || [];

      registeredTabs.forEach((item) => item.unregister());
      registeredTabs.clear();

      for (const tab of tabs) {
        tab.register();
        registeredActions.add(tab);
      }

      return tabs.map(tab => tab.serialize());
    });


    this.internalValue.dataProvider?.register();

    const onDidUnmount = await this.onDidMount?.(this.#context);

    EventLink.addEventListener(`view:${this.key}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      this.internalValue.dataProvider?.unregister();

      registeredActions.forEach((item) => item.unregister());
      registeredActions.clear();

      registeredTabs.forEach((item) => item.unregister());
      registeredTabs.clear();

      EventLink.removeEventListener(`view:${this.key}:getTabs`);
      EventLink.removeEventListener(`view:${this.key}:getActions`);
      EventLink.removeEventListener(`view:${this.key}:onDidUnmount`);
    });
  }


  public register() {
    EventLink.addEventListener(`view:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeEventListener(`view:${this.key}:onDidMount`);
  }

  public serialize(): TSerializableView {
    if (!this.internalValue.title) throw new Error(`Title not defined for "${this.key}" view`);
    if (!this.internalValue.position) throw new Error(`Position not defined for "${this.key}" view`);
    if (!this.internalValue.dataProvider) throw new Error(`Data provider not defined for "${this.key}" view`);

    return {
      type: 'view',
      key: this.key,
      icon: this.internalValue.icon,
      title: this.internalValue.title,
      position: this.internalValue.position,
      description: this.internalValue.description,
      dataProvider: this.internalValue.dataProvider.serialize(),
    };
  }
}
