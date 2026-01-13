import { PlatformAction } from '../platform-actions/PlatformActions';
import { TSerializableView, TView, TViewContext } from './TView';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';


export type TViewConstructor = {
  key: string;
  initialValue?: Partial<TView>,
  onDidMount?: TOnDidMount<TViewContext>;
}

export class View {
  #registered: Set<PlatformAction> = new Set([]);


  public readonly key: TViewConstructor['key'];
  public readonly onDidMount: TViewConstructor['onDidMount'];
  public readonly internalValue: NonNullable<Partial<TViewConstructor['initialValue']>>;


  constructor(props: TViewConstructor) {
    this.key = props.key;
    this.internalValue = props.initialValue || {};
    this.internalValue.type = 'view';
  }


  readonly #context: TViewContext = {
    refetchData: async () => {
      return await EventLink.callStudioEvent(`view:${this.key}:refetchData`);
    },
    set: async <GKey extends keyof TView>(property: GKey, newValue: TView[GKey]) => {
      switch (property) {
        case 'getTabs':
        case 'getActions':
          this.internalValue[property] = newValue;
          return;

        default:
          this.internalValue[property] = newValue;
          return await EventLink.callStudioEvent(`view:${this.key}:set`, { property, newValue });
      }
    },
  };


  async #onDidMount(): Promise<void> {
    EventLink.setExtensionEvent(`view:${this.key}:getActions`, async () => {
      const actions = await this.internalValue.getActions?.(this.#context) || [];

      for (const action of actions) {
        action.register();
        this.#registered.add(action);
      }

      return actions.map(action => action.serialize());
    });
    EventLink.setExtensionEvent(`view:${this.key}:getTabs`, async () => {
      const tabs = await this.internalValue.getTabs?.(this.#context) || [];

      for (const tab of tabs) {
        tab.register();
        this.#registered.add(tab);
      }

      return tabs.map(tab => tab.serialize());
    });


    if (this.internalValue.dataProvider) {
      this.internalValue.dataProvider.register();
    }


    if (this.onDidMount) {
      this.onDidMount?.({
        ...this.#context,
        onDidUnmount: (didUnmount) => {
          const didUnmountAndRemoveEventListener = async () => {
            await didUnmount();

            this.internalValue.dataProvider?.unregister();

            this.#registered.forEach((item) => item.unregister());
            this.#registered.clear();
          }

          EventLink.setExtensionEvent(`view:${this.key}:onDidUnmount`, didUnmountAndRemoveEventListener);
        },
      });
    } else {
      EventLink.setExtensionEvent(`view:${this.key}:onDidUnmount`, async () => { });
    }
  }


  public register() {
    EventLink.setExtensionEvent(`view:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeExtensionEvent(`view:${this.key}:onDidMount`);
    EventLink.removeExtensionEvent(`view:${this.key}:onDidUnmount`);

    this.internalValue.dataProvider?.unregister();

    this.#registered.forEach((item) => item.unregister());
    this.#registered.clear();
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
