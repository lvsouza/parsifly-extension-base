import { TFieldViewItem, TFieldViewItemMountContext, TFieldViewItemValue, TSerializableFieldViewItem } from './TFieldViewItem';
import { CompletionViewItem } from '../completion-view-item/CompletionViewItem';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';


export type TFieldViewItemConstructor = {
  key: string;
  initialValue?: Partial<TFieldViewItem>;
  onDidMount?: TOnDidMount<TFieldViewItemMountContext>;
}
export class FieldViewItem {
  public readonly key: TFieldViewItemConstructor['key'];
  public readonly onDidMount: TFieldViewItemConstructor['onDidMount'];
  public readonly internalValue: NonNullable<Partial<TFieldViewItemConstructor['initialValue']>>;


  constructor(props: TFieldViewItemConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
  }


  readonly #context: TFieldViewItemMountContext = {
    getCompletions: async (query) => (await this.internalValue.getCompletions?.(query, this.#context)) || [],
    reloadValue: async () => {
      return await EventLink.callStudioEvent(`fieldViewItem:${this.key}:reloadValue`);
    },
    set: async <GKey extends keyof TFieldViewItem>(property: GKey, newValue: TFieldViewItem[GKey]) => {
      switch (property) {
        case 'getValue':
        case 'onDidChange':
        case 'getCompletions':
          this.internalValue[property] = newValue;
          return;

        default:
          this.internalValue[property] = newValue;
          return await EventLink.callStudioEvent(`fieldViewItem:${this.key}:set`, { property, newValue });
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


    EventLink.setExtensionEvent(`fieldViewItem:${this.key}:onDidChange`, async (value) => this.internalValue.onDidChange?.(value as TFieldViewItemValue, this.#context));
    EventLink.setExtensionEvent(`fieldViewItem:${this.key}:getValue`, async () => {
      return this.internalValue.getValue?.(this.#context).then(value => value instanceof CompletionViewItem ? value.serialize() : value);
    });
    EventLink.setExtensionEvent(`fieldViewItem:${this.key}:getCompletions`, async (query: string) => {
      return this.internalValue.getCompletions?.(query, this.#context)
    });


    if (this.onDidMount) {
      await this.onDidMount?.({
        ...this.#context,
        onDidUnmount: (didUnmount) => {
          this.#onDidUnmount = async (checkMountId) => {
            if (checkMountId !== this.#mountId) return;
            this.#mountId = undefined;

            await didUnmount();

            EventLink.removeExtensionEvent(`fieldViewItem:${this.key}:getValue`);
            EventLink.removeExtensionEvent(`fieldViewItem:${this.key}:onDidChange`);
            EventLink.removeExtensionEvent(`fieldViewItem:${this.key}:onDidUnmount`);
            EventLink.removeExtensionEvent(`fieldViewItem:${this.key}:getCompletions`);
          }

          EventLink.setExtensionEvent(`fieldViewItem:${this.key}:onDidUnmount`, this.#onDidUnmount);
        },
      });
    } else {
      EventLink.setExtensionEvent(`fieldViewItem:${this.key}:onDidUnmount`, async () => { });
    }
  }


  public register() {
    EventLink.setExtensionEvent(`fieldViewItem:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeExtensionEvent(`fieldViewItem:${this.key}:getValue`);
    EventLink.removeExtensionEvent(`fieldViewItem:${this.key}:onDidMount`);
    EventLink.removeExtensionEvent(`fieldViewItem:${this.key}:onDidChange`);
    EventLink.removeExtensionEvent(`fieldViewItem:${this.key}:onDidUnmount`);
    EventLink.removeExtensionEvent(`fieldViewItem:${this.key}:getCompletions`);
  }

  public serialize(): TSerializableFieldViewItem {
    return {
      key: this.key,
      icon: this.internalValue.icon,
      info: this.internalValue.info,
      error: this.internalValue.error,
      warning: this.internalValue.warning,
      name: this.internalValue.name || '',
      label: this.internalValue.label || '',
      disabled: this.internalValue.disabled,
      type: this.internalValue.type || 'view',
      description: this.internalValue.description,
      defaultValue: this.internalValue.defaultValue,
    };
  }
}
