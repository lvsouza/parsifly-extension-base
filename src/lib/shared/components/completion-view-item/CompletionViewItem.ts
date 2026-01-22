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


  #createContext(mountId: string): TCompletionViewItemMountContext {
    return {
      currentValue: this.internalValue as TCompletionViewItem,
      set: async <GKey extends keyof TCompletionViewItem>(property: GKey, newValue: TCompletionViewItem[GKey]) => {
        switch (property) {
          default:
            this.internalValue[property] = newValue;
            return await EventLink.sendEvent(`completionViewItem:${mountId}:set`, { property, newValue });
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const context = this.#createContext(mountId);

    const onDidUnmount = await this.onDidMount?.(context);

    EventLink.addEventListener(`completionViewItem:${mountId}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      EventLink.removeEventListener(`completionViewItem:${mountId}:onDidUnmount`);
    });
  }


  public register() {
    EventLink.addEventListener(`completionViewItem:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeEventListener(`completionViewItem:${this.key}:onDidMount`);
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
