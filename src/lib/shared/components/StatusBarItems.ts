import { TOnDidMount } from '../../types/TOnDidMount';
import { EventLink } from '../services/EventLink';
import { TImage } from '../../types/TImage';


export type TStatusBarItemMountContext = {
  set<GKey extends keyof TStatusBarItem>(property: GKey, value: TStatusBarItem[GKey]): Promise<void>;
}


export type TStatusBarItem = {
  icon?: TImage;
  label: string;
  description?: string;
  side: 'right' | 'left';
  action(context: TStatusBarItemMountContext): Promise<void>;
};
export type TStatusBarItemConstructor = {
  key: string;
  initialValue?: Partial<TStatusBarItem>,
  onDidMount?: TOnDidMount<TStatusBarItemMountContext>;
}

export type TSerializableStatusBarItem = {
  key: string;
  label: string;
  side: 'right' | 'left';
  icon: TImage | undefined;
  description: string | undefined;
}

export class StatusBarItem {
  public readonly key: TStatusBarItemConstructor['key'];
  public readonly onDidMount: TStatusBarItemConstructor['onDidMount'];
  public readonly internalValue: NonNullable<Partial<TStatusBarItemConstructor['initialValue']>>;


  constructor(props: TStatusBarItemConstructor) {
    this.key = props.key;
    this.register = this.register;
    this.unregister = this.unregister;
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
      this.onDidMount?.({
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
    return {
      key: this.key,
      icon: this.internalValue.icon,
      label: this.internalValue.label || '',
      side: this.internalValue.side || 'right',
      description: this.internalValue.description,
    };
  }
}
