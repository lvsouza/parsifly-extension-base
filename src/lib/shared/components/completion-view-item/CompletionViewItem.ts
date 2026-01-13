import { TCompletionViewItem, TCompletionViewItemMountContext, TSerializableCompletionViewItem } from './TCompletionViewItem';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';


export type TCompletionViewItemConstructor = {
  key: string;
  initialValue?: Partial<TCompletionViewItem>;
  onDidMount?: TOnDidMount<TCompletionViewItemMountContext>;
}
export class CompletionViewItem {
  public readonly key: TCompletionViewItemConstructor['key'];
  public readonly onDidMount: TCompletionViewItemConstructor['onDidMount'];
  public readonly internalValue: NonNullable<Partial<TCompletionViewItemConstructor['initialValue']>>;


  constructor(props: TCompletionViewItemConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
  }


  readonly #context: TCompletionViewItemMountContext = {
    set: async <GKey extends keyof TCompletionViewItem>(property: GKey, newValue: TCompletionViewItem[GKey]) => {
      switch (property) {
        default:
          this.internalValue[property] = newValue;
          return await EventLink.callStudioEvent(`completionViewItem:${this.key}:set`, { property, newValue });
      }
    },
  };

  #mountId: string | undefined;
  #onDidUnmount: ((checkMountId: string) => Promise<void>) = async () => { };

  async #onDidMount(mountId: string): Promise<void> {
    if (this.#mountId) {
      await this.#onDidUnmount(this.#mountId);
      this.#mountId = mountId;
    }

    if (this.onDidMount) {
      await this.onDidMount?.({
        ...this.#context,
        onDidUnmount: (didUnmount) => {
          this.#onDidUnmount = async (checkMountId) => {
            if (checkMountId !== this.#mountId) return;
            this.#mountId = undefined;

            await didUnmount();

            EventLink.removeExtensionEvent(`completionViewItem:${this.key}:onDidUnmount`);
          }

          EventLink.setExtensionEvent(`completionViewItem:${this.key}:onDidUnmount`, this.#onDidUnmount);
        },
      });
    } else {
      EventLink.setExtensionEvent(`completionViewItem:${this.key}:onDidUnmount`, async () => { });
    }
  }


  public register() {
    EventLink.setExtensionEvent(`completionViewItem:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeExtensionEvent(`completionViewItem:${this.key}:onDidMount`);
    EventLink.removeExtensionEvent(`completionViewItem:${this.key}:onDidUnmount`);
  }

  public serialize(): TSerializableCompletionViewItem {
    return {
      key: this.key,
      icon: this.internalValue.icon,
      value: this.internalValue.value,
      label: this.internalValue.label || '',
      disabled: this.internalValue.disabled,
      description: this.internalValue.description,
    };
  }
}
