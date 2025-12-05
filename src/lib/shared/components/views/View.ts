import { TDataProvider } from '../../providers/TDataProvider';
import { FormProvider } from '../../providers/FormProvider';
import { ListProvider } from '../../providers/ListProvider';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';
import { PlatformAction } from '../PlatformActions';


export type TViewContext = {
  refetchData(): Promise<void>;
  set<GKey extends keyof TView>(property: GKey, value: TView[GKey]): Promise<void>;
}

export type TView = {
  type: 'view';
  icon: string;
  title: string;
  description?: string;
  dataProvider: TDataProvider;
  position: 'primary' | 'secondary';
  getTabs?: (context: TViewContext) => Promise<PlatformAction[]>;
  getActions?: (context: TViewContext) => Promise<PlatformAction[]>;
}

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
    this.register = this.register;
    this.unregister = this.unregister;
    this.onDidMount = props.onDidMount;
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

      return actions.map(action => ({
        key: action.key,
        icon: action.internalValue.icon,
        label: action.internalValue.label,
        children: action.internalValue.children,
        description: action.internalValue.description,
      }));
    });
    EventLink.setExtensionEvent(`view:${this.key}:getTabs`, async () => {
      const tabs = await this.internalValue.getTabs?.(this.#context) || [];

      for (const tab of tabs) {
        tab.register();
        this.#registered.add(tab);
      }

      return tabs.map(action => ({
        key: action.key,
        icon: action.internalValue.icon,
        label: action.internalValue.label,
        children: action.internalValue.children,
        description: action.internalValue.description,
      }));
    });


    if (this.internalValue.dataProvider instanceof FormProvider) {
      EventLink.setExtensionEvent(`dataProvider:${this.internalValue.dataProvider.key}:getFields`, this.internalValue.dataProvider.getFields);
    } else if (this.internalValue.dataProvider instanceof ListProvider) {
      EventLink.setExtensionEvent(`dataProvider:${this.internalValue.dataProvider.key}:getItems`, this.internalValue.dataProvider.getItems);
    }


    if (this.onDidMount) {
      this.onDidMount?.({
        ...this.#context,
        onDidUnmount: (didUnmount) => {
          const didUnmountAndRemoveEventListener = async () => {
            await didUnmount();

            EventLink.removeExtensionEvent(`view:${this.key}:getTabs`);
            EventLink.removeExtensionEvent(`view:${this.key}:getActions`);
            EventLink.removeExtensionEvent(`dataProvider:${this.internalValue.dataProvider?.key}:getItems`);
            EventLink.removeExtensionEvent(`dataProvider:${this.internalValue.dataProvider?.key}:getFields`);
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
    EventLink.removeExtensionEvent(`view:${this.key}:getTabs`)
    EventLink.removeExtensionEvent(`view:${this.key}:getActions`)
    EventLink.removeExtensionEvent(`view:${this.key}:onDidMount`);
    EventLink.removeExtensionEvent(`view:${this.key}:onDidUnmount`);
    EventLink.removeExtensionEvent(`dataProvider:${this.internalValue.dataProvider?.key}:getItems`);
    EventLink.removeExtensionEvent(`dataProvider:${this.internalValue.dataProvider?.key}:getFields`);

    this.#registered.forEach((action) => action.unregister());
    this.#registered.clear();
  }
}
