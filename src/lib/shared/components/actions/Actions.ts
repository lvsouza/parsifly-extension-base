import { TAction, TActionMountContext, TSerializableAction } from './TActions';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';


export type TActionConstructor = {
  key: string;
  initialValue?: Partial<TAction>,
  onDidMount?: TOnDidMount<TActionMountContext>;
}
export class Action {
  public readonly key: TActionConstructor['key'];
  public readonly onDidMount: TActionConstructor['onDidMount'];
  public readonly defaultValue: NonNullable<TActionConstructor['initialValue']>;


  constructor(props: TActionConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.defaultValue = props.initialValue || {};
  }


  #createContext(mountId: string): TActionMountContext {
    return {
      currentValue: this.defaultValue as TAction,
      refetchChildren: async () => {
        return await EventLink.sendEvent(`action:${mountId}:refetchChildren`);
      },
      set: async <GKey extends keyof TAction>(property: GKey, newValue: TAction[GKey]) => {
        switch (property) {
          case 'action':
          case 'getActions':
            this.defaultValue[property] = newValue;
            return;

          default:
            this.defaultValue[property] = newValue;
            return await EventLink.sendEvent(`action:${mountId}:set`, { property, newValue });
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const context = this.#createContext(mountId);

    EventLink.addEventListener(`action:${mountId}:action`, async () => 'action' in this.defaultValue ? this.defaultValue.action?.(context) : {});

    const registeredActions = new Set<Action>();
    EventLink.addEventListener(`action:${mountId}:getActions`, async () => {
      const actions = await this.defaultValue.getActions?.(context) || [];

      registeredActions.forEach((item) => item.unregister());
      registeredActions.clear();

      for (const action of actions) {
        action.register();
        registeredActions.add(action);
      }

      return actions.map(action => action.serialize());
    });

    const onDidUnmount = await this.onDidMount?.(context);

    EventLink.addEventListener(`action:${mountId}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      registeredActions.forEach((item) => item.unregister());
      registeredActions.clear();

      EventLink.removeEventListener(`action:${mountId}:action`);
      EventLink.removeEventListener(`action:${mountId}:getActions`);
      EventLink.removeEventListener(`action:${mountId}:onDidUnmount`);
    });
  }


  public register() {
    EventLink.addEventListener(`action:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeEventListener(`action:${this.key}:onDidMount`);
  }

  public serialize(): TSerializableAction {
    if (!this.defaultValue.label) throw new Error(`Label not defined for "${this.key}" parser`);

    return {
      key: this.key,
      icon: this.defaultValue.icon,
      label: this.defaultValue.label,
      children: this.defaultValue.children,
      description: this.defaultValue.description,
    };
  }
}
