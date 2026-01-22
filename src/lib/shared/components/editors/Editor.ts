import { TEditor, TEditorMountContext, TSerializableEditor } from './TEditor';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';
import { Action } from '../actions/Actions';


export type TEditorConstructor = {
  key: string;
  initialValue?: Partial<TEditor>,
  onDidMount?: TOnDidMount<TEditorMountContext>;
}

export class Editor {
  public readonly key: TEditorConstructor['key'];
  public readonly onDidMount: TEditorConstructor['onDidMount'];
  public readonly internalValue: NonNullable<Partial<TEditorConstructor['initialValue']>>;


  constructor(props: TEditorConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
    this.internalValue.type = 'editor';
  }


  #createContext(mountId: string): TEditorMountContext {
    return {
      currentValue: this.internalValue as TEditor,
      sendMessage: async (...values) => {
        return await EventLink.sendEvent(`editor:${mountId}:sendMessage`, ...values);
      },
      reload: async () => {
        return await EventLink.sendEvent(`editor:${mountId}:reload`);
      },
      set: async <GKey extends keyof TEditor>(property: GKey, newValue: TEditor[GKey]) => {
        switch (property) {
          case 'getActions':
          case 'onDidMessage':
            this.internalValue[property] = newValue;
            return;

          default:
            this.internalValue[property] = newValue;
            return await EventLink.sendEvent(`editor:${mountId}:set`, { property, newValue });
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const context = this.#createContext(mountId);

    EventLink.addEventListener(`editor:${mountId}:onDidMessage`, async (...values) => {
      return await this.internalValue?.onDidMessage?.(context, ...values);
    });

    const registeredActions = new Set<Action>();
    EventLink.addEventListener(`editor:${mountId}:getActions`, async () => {
      const actions = await this.internalValue.getActions?.(context) || [];

      registeredActions.forEach((item) => item.unregister());
      registeredActions.clear();

      for (const action of actions) {
        action.register();
        registeredActions.add(action);
      }

      return actions.map(action => action.serialize());
    });


    const onDidUnmount = await this.onDidMount?.(context);

    EventLink.addEventListener(`editor:${mountId}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      registeredActions.forEach((item) => item.unregister());
      registeredActions.clear();

      EventLink.removeEventListener(`editor:${mountId}:getActions`);
      EventLink.removeEventListener(`editor:${mountId}:onDidMessage`);
      EventLink.removeEventListener(`editor:${mountId}:onDidUnmount`);
    });
  }


  public register() {
    EventLink.addEventListener(`editor:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeEventListener(`editor:${this.key}:onDidMount`);
  }

  public serialize(): TSerializableEditor {
    if (!this.internalValue.title) throw new Error(`Title not defined for "${this.key}" editor`)
    if (!this.internalValue.selector) throw new Error(`Selector not defined for "${this.key}" editor`)
    if (!this.internalValue.position) throw new Error(`Position not defined for "${this.key}" editor`)
    if (!this.internalValue.entryPoint) throw new Error(`Entrypoint not defined for "${this.key}" editor`)

    return {
      key: this.key,
      type: 'editor',
      icon: this.internalValue.icon,
      title: this.internalValue.title,
      selector: this.internalValue.selector,
      position: this.internalValue.position,
      entryPoint: this.internalValue.entryPoint,
      description: this.internalValue.description,
    };
  }
}
