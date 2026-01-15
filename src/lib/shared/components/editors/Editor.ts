import { TEditor, TEditorContext, TSerializableEditor } from './TEditor';
import { PlatformAction } from '../platform-actions/PlatformActions';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';


export type TEditorConstructor = {
  key: string;
  initialValue?: Partial<TEditor>,
  onDidMount?: TOnDidMount<TEditorContext>;
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


  readonly #context: TEditorContext = {
    sendMessage: async (...values) => {
      return await EventLink.sendEvent(`editor:${this.key}:sendMessage`, ...values);
    },
    reload: async () => {
      return await EventLink.sendEvent(`editor:${this.key}:reload`);
    },
    set: async <GKey extends keyof TEditor>(property: GKey, newValue: TEditor[GKey]) => {
      switch (property) {
        case 'getActions':
        case 'onDidMessage':
          this.internalValue[property] = newValue;
          return;

        default:
          this.internalValue[property] = newValue;
          return await EventLink.sendEvent(`editor:${this.key}:set`, { property, newValue });
      }
    },
  };


  async #onDidMount(): Promise<void> {
    EventLink.addEventListener(`editor:${this.key}:onDidMessage`, async (...values) => {
      return await this.internalValue?.onDidMessage?.(this.#context, ...values);
    });

    const registeredActions = new Set<PlatformAction>();
    EventLink.addEventListener(`editor:${this.key}:getActions`, async () => {
      const actions = await this.internalValue.getActions?.(this.#context) || [];

      registeredActions.forEach((item) => item.unregister());
      registeredActions.clear();

      for (const action of actions) {
        action.register();
        registeredActions.add(action);
      }

      return actions.map(action => action.serialize());
    });


    const onDidUnmount = await this.onDidMount?.(this.#context);

    EventLink.addEventListener(`editor:${this.key}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      registeredActions.forEach((item) => item.unregister());
      registeredActions.clear();

      EventLink.removeEventListener(`editor:${this.key}:getActions`);
      EventLink.removeEventListener(`editor:${this.key}:onDidMessage`);
      EventLink.removeEventListener(`editor:${this.key}:onDidUnmount`);
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
