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
      return await EventLink.sendEvent(`fieldViewItem:${this.key}:reloadValue`);
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
          return await EventLink.sendEvent(`fieldViewItem:${this.key}:set`, { property, newValue });
      }
    },
  };


  async #onDidMount(_mountId: string): Promise<void> {
    EventLink.addEventListener(`fieldViewItem:${this.key}:onDidChange`, async (value) => this.internalValue.onDidChange?.(value as TFieldViewItemValue, this.#context));
    EventLink.addEventListener(`fieldViewItem:${this.key}:getCompletions`, async (query: string) => this.internalValue.getCompletions?.(query, this.#context));

    const registeredCompletions = new Set<CompletionViewItem>();
    EventLink.addEventListener(`fieldViewItem:${this.key}:getValue`, async () => {
      return this.internalValue.getValue?.(this.#context).then(value => {

        registeredCompletions.forEach((item) => item.unregister());
        registeredCompletions.clear();

        if (value instanceof CompletionViewItem) {
          value.register();
          registeredCompletions.add(value);
          return value.serialize();
        }

        return value;
      });
    });


    const onDidUnmount = await this.onDidMount?.(this.#context);

    EventLink.addEventListener(`fieldViewItem:${this.key}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      registeredCompletions.forEach((item) => item.unregister());
      registeredCompletions.clear();

      EventLink.removeEventListener(`fieldViewItem:${this.key}:getValue`);
      EventLink.removeEventListener(`fieldViewItem:${this.key}:onDidChange`);
      EventLink.removeEventListener(`fieldViewItem:${this.key}:onDidUnmount`);
      EventLink.removeEventListener(`fieldViewItem:${this.key}:getCompletions`);
    });
  }


  public register() {
    EventLink.addEventListener(`fieldViewItem:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeEventListener(`fieldViewItem:${this.key}:onDidMount`);
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
