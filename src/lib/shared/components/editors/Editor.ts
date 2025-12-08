import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';
import { PlatformAction } from '../PlatformActions';
import { TIcon } from '../../../types/TIcon';


export type TEditorContext = {
  reload(): Promise<void>;
  sendMessage(...values: unknown[]): Promise<unknown>;
  set<GKey extends keyof TEditor>(property: GKey, value: TEditor[GKey]): Promise<void>;
}

export type TEditor = {
  icon?: TIcon;
  type: 'editor';
  title: string;
  position: 'center';
  selector: string[];
  description?: string;
  onDidMessage: (context: TEditorContext, ...values: unknown[]) => Promise<unknown>;
  getActions?: (context: TEditorContext) => Promise<PlatformAction[]>;
  entryPoint: {
    basePath: string;
    file: string;
  };
}

export type TEditorConstructor = {
  key: string;
  initialValue?: Partial<TEditor>,
  onDidMount?: TOnDidMount<TEditorContext>;
}

export class Editor {
  #registered: Set<PlatformAction> = new Set([]);


  public readonly key: TEditorConstructor['key'];
  public readonly onDidMount: TEditorConstructor['onDidMount'];
  public readonly internalValue: NonNullable<Partial<TEditorConstructor['initialValue']>>;


  constructor(props: TEditorConstructor) {
    this.key = props.key;
    this.register = this.register;
    this.unregister = this.unregister;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
    this.internalValue.type = 'editor';
  }


  readonly #context: TEditorContext = {
    sendMessage: async (...values) => {
      return await EventLink.callStudioEvent(`editor:${this.key}:sendMessage`, ...values);
    },
    reload: async () => {
      return await EventLink.callStudioEvent(`editor:${this.key}:reload`);
    },
    set: async <GKey extends keyof TEditor>(property: GKey, newValue: TEditor[GKey]) => {
      switch (property) {
        case 'getActions':
        case 'onDidMessage':
          this.internalValue[property] = newValue;
          return;

        default:
          this.internalValue[property] = newValue;
          return await EventLink.callStudioEvent(`editor:${this.key}:set`, { property, newValue });
      }
    },
  };


  async #onDidMount(): Promise<void> {
    EventLink.setExtensionEvent(`editor:${this.key}:onDidMessage`, async (...values) => {
      return await this.internalValue?.onDidMessage?.(this.#context, ...values)
    });
    EventLink.setExtensionEvent(`editor:${this.key}:getActions`, async () => {
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


    if (this.onDidMount) {
      this.onDidMount?.({
        ...this.#context,
        onDidUnmount: (didUnmount) => {
          const didUnmountAndRemoveEventListener = async () => {
            await didUnmount();

            EventLink.removeExtensionEvent(`editor:${this.key}:getActions`);
          }

          EventLink.setExtensionEvent(`editor:${this.key}:onDidUnmount`, didUnmountAndRemoveEventListener);
        },
      });
    } else {
      EventLink.setExtensionEvent(`editor:${this.key}:onDidUnmount`, async () => { });
    }
  }


  public register() {
    EventLink.setExtensionEvent(`editor:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeExtensionEvent(`editor:${this.key}:getActions`)
    EventLink.removeExtensionEvent(`editor:${this.key}:onDidMount`);
    EventLink.removeExtensionEvent(`editor:${this.key}:onDidUnmount`);

    this.#registered.forEach((action) => action.unregister());
    this.#registered.clear();
  }
}
