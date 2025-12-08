import { TOnDidMount } from '../../types/TOnDidMount';
import { EventLink } from '../services/EventLink';
import { TIcon } from '../../types/TIcon';


export type TPlatformActionMountContext = {
  refetchChildren(): Promise<void>;
  set<GKey extends keyof TPlatformAction>(property: GKey, value: TPlatformAction[GKey]): Promise<void>;
}

export type TSingleAction = {
  children: false;
  getActions?: undefined;
  action(context: TPlatformActionMountContext): Promise<void>;
};

export type TMultiAction = {
  children: true;
  action?: undefined;
  getActions: (context: TPlatformActionMountContext) => Promise<PlatformAction[]>;
};

export type TPlatformAction = (TSingleAction | TMultiAction) & {
  icon?: TIcon;
  label: string;
  description?: string;
};
export type TPlatformActionConstructor = {
  key: string;
  initialValue?: Partial<TPlatformAction>,
  onDidMount?: TOnDidMount<TPlatformActionMountContext>;
}

export class PlatformAction {
  #registered: Set<PlatformAction> = new Set([]);

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


  readonly #context: TPlatformActionMountContext = {
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
  };


  async #onDidMount(): Promise<void> {
    EventLink.setExtensionEvent(`platformAction:${this.key}:action`, async () => 'action' in this.internalValue ? this.internalValue.action?.(this.#context) : {});
    EventLink.setExtensionEvent(`platformAction:${this.key}:getActions`, async () => {
      const actions = await this.internalValue.getActions?.(this.#context) || [];

      for (const action of actions) {
        action.register();
        this.#registered.add(action);
      }

      return actions.map(field => ({
        key: field.key,
        icon: field.internalValue.icon,
        label: field.internalValue.label,
        children: field.internalValue.children,
        description: field.internalValue.description,
      }));
    });


    if (this.onDidMount) {
      this.onDidMount?.({
        ...this.#context,
        onDidUnmount: (didUnmount) => {
          const didUnmountAndRemoveEventListener = async () => {
            await didUnmount();

            EventLink.removeExtensionEvent(`platformAction:${this.key}:action`);
          }

          EventLink.setExtensionEvent(`platformAction:${this.key}:onDidUnmount`, didUnmountAndRemoveEventListener);
        },
      });
    } else {
      EventLink.setExtensionEvent(`platformAction:${this.key}:onDidUnmount`, async () => { });
    }
  }


  public register() {
    EventLink.setExtensionEvent(`platformAction:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeExtensionEvent(`platformAction:${this.key}:action`);
    EventLink.removeExtensionEvent(`platformAction:${this.key}:getActions`);
    EventLink.removeExtensionEvent(`platformAction:${this.key}:onDidMount`);
    EventLink.removeExtensionEvent(`platformAction:${this.key}:onDidUnmount`);

    this.#registered.forEach((field) => field.unregister());
    this.#registered.clear();
  }
}
