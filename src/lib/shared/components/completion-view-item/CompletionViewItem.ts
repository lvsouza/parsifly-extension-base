import { TCompletionViewItem, TCompletionViewItemMountContext, TSerializableCompletionViewItem } from './TCompletionViewItem';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';


export type TCompletionViewItemConstructor = {
  key: string;
  initialValue?: Partial<TCompletionViewItem>;
  onDidMount?: TOnDidMount<TCompletionViewItemMountContext>;
}
export class CompletionViewItem {
  public readonly registerId: string;
  public readonly key: TCompletionViewItemConstructor['key'];
  public readonly onDidMount: TCompletionViewItemConstructor['onDidMount'];
  public readonly defaultValue: NonNullable<TCompletionViewItemConstructor['initialValue']>;


  constructor(props: TCompletionViewItemConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.registerId = crypto.randomUUID();
    this.defaultValue = props.initialValue || {};
  }


  #createContext(internalValue: typeof this.defaultValue, mountId: string): TCompletionViewItemMountContext {
    return {
      currentValue: internalValue as TCompletionViewItem,
      set: async <GKey extends keyof TCompletionViewItem>(property: GKey, newValue: TCompletionViewItem[GKey]) => {
        switch (property) {
          default:
            internalValue[property] = newValue;
            return await EventLink.sendEvent(`completionViewItem:${mountId}:set`, { property, newValue });
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const internalValue = this.defaultValue;

    const context = this.#createContext(internalValue, mountId);

    const onDidUnmount = await this.onDidMount?.(context);

    EventLink.addEventListener(`completionViewItem:${mountId}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      EventLink.removeEventListener(`completionViewItem:${mountId}:onDidUnmount`);
    });
  }


  public register() {
    EventLink.addEventListener(`completionViewItem:${this.registerId}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeEventListener(`completionViewItem:${this.registerId}:onDidMount`);
  }

  public serialize(): TSerializableCompletionViewItem {
    return {
      key: this.key,
      registerId: this.registerId,
      icon: this.defaultValue.icon,
      value: this.defaultValue.value,
      label: this.defaultValue.label || '',
      disabled: this.defaultValue.disabled,
      description: this.defaultValue.description,
    };
  }
}
