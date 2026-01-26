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
  public readonly defaultValue: NonNullable<TFieldViewItemConstructor['initialValue']>;


  constructor(props: TFieldViewItemConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.defaultValue = props.initialValue || {};
  }


  #createContext(mountId: string): TFieldViewItemMountContext {
    return {
      currentValue: this.defaultValue as TFieldViewItem,
      reloadValue: async () => {
        return await EventLink.sendEvent(`fieldViewItem:${mountId}:reloadValue`);
      },
      set: async <GKey extends keyof TFieldViewItem>(property: GKey, newValue: TFieldViewItem[GKey]) => {
        switch (property) {
          case 'getValue':
          case 'onDidChange':
          case 'getCompletions':
            this.defaultValue[property] = newValue;
            return;

          default:
            this.defaultValue[property] = newValue;
            return await EventLink.sendEvent(`fieldViewItem:${mountId}:set`, { property, newValue });
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const context = this.#createContext(mountId);

    EventLink.addEventListener(`fieldViewItem:${mountId}:onDidChange`, async (value) => this.defaultValue.onDidChange?.(value as TFieldViewItemValue, context));
    EventLink.addEventListener(`fieldViewItem:${mountId}:getCompletions`, async (query: string) => this.defaultValue.getCompletions?.(query, context));

    const registeredCompletions = new Set<CompletionViewItem>();
    EventLink.addEventListener(`fieldViewItem:${mountId}:getValue`, async () => {
      return this.defaultValue.getValue?.(context).then(value => {

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


    const onDidUnmount = await this.onDidMount?.(context);

    EventLink.addEventListener(`fieldViewItem:${mountId}:onDidUnmount`, async () => {

      registeredCompletions.forEach((item) => item.unregister());
      registeredCompletions.clear();

      EventLink.removeEventListener(`fieldViewItem:${mountId}:getValue`);
      EventLink.removeEventListener(`fieldViewItem:${mountId}:onDidChange`);
      EventLink.removeEventListener(`fieldViewItem:${mountId}:onDidUnmount`);
      EventLink.removeEventListener(`fieldViewItem:${mountId}:getCompletions`);

      await onDidUnmount?.();
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
      icon: this.defaultValue.icon,
      info: this.defaultValue.info,
      error: this.defaultValue.error,
      warning: this.defaultValue.warning,
      name: this.defaultValue.name || '',
      label: this.defaultValue.label || '',
      disabled: this.defaultValue.disabled,
      type: this.defaultValue.type || 'view',
      description: this.defaultValue.description,
      defaultValue: this.defaultValue.defaultValue,
    };
  }
}
