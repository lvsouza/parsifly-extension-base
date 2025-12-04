import { TOnDidMount } from '../../types/TOnDidMount';
import { EventLink } from '../services/EventLink';


export type TSingleAction = {
  children: false;
  getActions?: undefined;
  action(): Promise<void>;
};

export type TMultiAction = {
  children: true;
  action?: undefined;
  getActions: () => Promise<PlatformAction[]>;
};

export type TPlatformAction = (TSingleAction | TMultiAction) & {
  label: string;
  icon?: string;
  description?: string;
};

type TTPlatformActionMountContext = {
  refetchChildren(): Promise<void>;
  set<GKey extends keyof TPlatformAction>(property: GKey, value: TPlatformAction[GKey]): Promise<void>;
}
export type TPlatformActionConstructor = {
  key: string;
  initialValue?: Partial<TPlatformAction>,
  onDidMount?: TOnDidMount<TTPlatformActionMountContext>;
}

export class PlatformAction {
  #registeredItems: Set<PlatformAction> = new Set([]);

  public readonly key: TPlatformActionConstructor['key'];
  public readonly onDidMount: TPlatformActionConstructor['onDidMount'];
  public readonly internalValue: NonNullable<Partial<TPlatformActionConstructor['initialValue']>>;


  constructor(props: TPlatformActionConstructor) {
    this.key = props.key;
    this.register = this.register;
    this.unregister = this.unregister;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
  }


  async #onDidMount(): Promise<void> {
    EventLink.setExtensionEvent(`platformAction:${this.key}:action`, async () => 'action' in this.internalValue ? this.internalValue.action?.() : {});
    EventLink.setExtensionEvent(`platformAction:${this.key}:getActions`, async () => {

      console.log(`platformAction:${this.key}:getActions`);

      const actions = await this.internalValue.getActions?.() || [];
      console.log(actions);

      for (const action of actions) {
        action.register();
        this.#registeredItems.add(action);
      }

      return actions.map(field => ({
        key: field.key,
        icon: field.internalValue.icon,
        label: field.internalValue.label,
        children: field.internalValue.children,
        description: field.internalValue.description,
      }));
    });


    this.onDidMount?.({
      refetchChildren: async () => {
        return await EventLink.callStudioEvent(`listItem:${this.key}:refetchChildren`);
      },
      set: async <GKey extends keyof TPlatformAction>(property: GKey, newValue: TPlatformAction[GKey]) => {
        switch (property) {
          case 'action':
          case 'getActions':
            this.internalValue[property] = newValue;
            return;

          default:
            this.internalValue[property] = newValue;
            return await EventLink.callStudioEvent(`platformAction:${this.key}:set`, { property, newValue });
        }
      },
      onDidUnmount: (didUnmount) => {
        const didUnmountAndRemoveEventListener = async () => {
          await didUnmount();

          EventLink.removeExtensionEvent(`platformAction:${this.key}:action`);
        }

        EventLink.setExtensionEvent(`platformAction:${this.key}:onDidUnmount`, didUnmountAndRemoveEventListener);
      },
    });
  }


  public register() {
    EventLink.setExtensionEvent(`platformAction:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeExtensionEvent(`platformAction:${this.key}:action`);
    EventLink.removeExtensionEvent(`platformAction:${this.key}:getActions`);
    EventLink.removeExtensionEvent(`platformAction:${this.key}:onDidMount`);
    EventLink.removeExtensionEvent(`platformAction:${this.key}:onDidUnmount`);

    this.#registeredItems.forEach((field) => field.unregister());
    this.#registeredItems.clear();
  }
}
