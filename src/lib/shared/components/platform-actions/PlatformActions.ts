import { TPlatformAction, TPlatformActionMountContext, TSerializablePlatformAction } from './TPlatformActions';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';


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

      return actions.map(action => action.serialize());
    });


    if (this.onDidMount) {
      await this.onDidMount?.({
        ...this.#context,
        onDidUnmount: (didUnmount) => {
          const didUnmountAndRemoveEventListener = async () => {
            await didUnmount();

            this.#registered.forEach((item) => item.unregister());
            this.#registered.clear();

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

    this.#registered.forEach((item) => item.unregister());
    this.#registered.clear();
  }

  public serialize(): TSerializablePlatformAction {
    if (!this.internalValue.label) throw new Error(`Label not defined for "${this.key}" parser`);

    return {
      key: this.key,
      icon: this.internalValue.icon,
      label: this.internalValue.label,
      children: this.internalValue.children,
      description: this.internalValue.description,
    };
  }
}
