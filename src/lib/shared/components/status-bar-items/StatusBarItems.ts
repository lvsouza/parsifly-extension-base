import { TSerializableStatusBarItem, TStatusBarItem, TStatusBarItemMountContext } from './TStatusBarItems';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';



export type TStatusBarItemConstructor = {
  key: string;
  initialValue?: Partial<TStatusBarItem>;
  onDidMount?: TOnDidMount<TStatusBarItemMountContext>;
}

export class StatusBarItem {
  public readonly key: TStatusBarItemConstructor['key'];
  public readonly onDidMount: TStatusBarItemConstructor['onDidMount'];
  public readonly internalValue: NonNullable<Partial<TStatusBarItemConstructor['initialValue']>>;


  constructor(props: TStatusBarItemConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
  }


  readonly #context: TStatusBarItemMountContext = {
    set: async <GKey extends keyof TStatusBarItem>(property: GKey, newValue: TStatusBarItem[GKey]) => {
      switch (property) {
        case 'action':
          this.internalValue[property] = newValue;
          return;

        default:
          this.internalValue[property] = newValue;
          return await EventLink.callStudioEvent(`statusBarItem:${this.key}:set`, { property, newValue });
      }
    },
  };


  async #onDidMount(): Promise<void> {
    EventLink.setExtensionEvent(`statusBarItem:${this.key}:action`, async () => 'action' in this.internalValue ? this.internalValue.action?.(this.#context) : {});

    if (this.onDidMount) {
      await this.onDidMount?.({
        ...this.#context,
        onDidUnmount: (didUnmount) => {
          const didUnmountAndRemoveEventListener = async () => {
            await didUnmount();

            EventLink.removeExtensionEvent(`statusBarItem:${this.key}:action`);
          }

          EventLink.setExtensionEvent(`statusBarItem:${this.key}:onDidUnmount`, didUnmountAndRemoveEventListener);
        },
      });
    } else {
      EventLink.setExtensionEvent(`statusBarItem:${this.key}:onDidUnmount`, async () => { });
    }
  }


  public register() {
    EventLink.setExtensionEvent(`statusBarItem:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeExtensionEvent(`statusBarItem:${this.key}:action`);
    EventLink.removeExtensionEvent(`statusBarItem:${this.key}:onDidMount`);
    EventLink.removeExtensionEvent(`statusBarItem:${this.key}:onDidUnmount`);
  }

  public serialize(): TSerializableStatusBarItem {
    if (!this.internalValue.label) throw new Error(`Label not defined for "${this.key}" status bar item`);
    if (!this.internalValue.side) throw new Error(`Side not defined for "${this.key}" status bar item`);

    return {
      key: this.key,
      icon: this.internalValue.icon,
      side: this.internalValue.side,
      label: this.internalValue.label,
      description: this.internalValue.description,
    };
  }
}
