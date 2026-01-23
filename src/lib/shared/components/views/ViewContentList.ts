import { TSerializableViewContentList, TViewContentList, TViewContentListContext } from './TViewContentList';
import { ListViewItem } from '../list-view-item/ListViewItem';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';


export type TViewContentListConstructor = {
  key: string;
  initialValue?: Partial<TViewContentList>,
  onDidMount?: TOnDidMount<TViewContentListContext>;
}

export class ViewContentList {
  public readonly key: TViewContentListConstructor['key'];
  public readonly onDidMount: TViewContentListConstructor['onDidMount'];
  public readonly internalValue: NonNullable<TViewContentListConstructor['initialValue']>;


  constructor(props: TViewContentListConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
    this.internalValue.type = 'viewContentList';
  }


  #createContext(mountId: string): TViewContentListContext {
    return {
      currentValue: this.internalValue as TViewContentList,
      refetch: async () => {
        return await EventLink.sendEvent(`viewContentList:${mountId}:refetch`);
      },
      set: async <GKey extends keyof TViewContentList>(property: GKey, newValue: TViewContentList[GKey]) => {
        switch (property) {
          case 'getItems':
            this.internalValue[property] = newValue;
            return;

          default:
            this.internalValue[property] = newValue;
            return await EventLink.sendEvent(`viewContentList:${mountId}:set`, { property, newValue });
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const context = this.#createContext(mountId);

    const registeredItems = new Set<ListViewItem>();
    EventLink.addEventListener(`viewContentList:${mountId}:getItems`, async () => {
      const items = await this.internalValue.getItems?.(context) || [];

      registeredItems.forEach((item) => item.unregister());
      registeredItems.clear();

      for (const item of items) {
        item.register();
        registeredItems.add(item);
      }

      return items.map(tab => tab.serialize());
    });

    const onDidUnmount = await this.onDidMount?.(context);

    EventLink.addEventListener(`viewContentList:${mountId}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      registeredItems.forEach((item) => item.unregister());
      registeredItems.clear();

      EventLink.removeEventListener(`viewContentList:${mountId}:getItems`);
      EventLink.removeEventListener(`viewContentList:${mountId}:onDidUnmount`);
    });
  }


  public register() {
    EventLink.addEventListener(`viewContentList:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeEventListener(`viewContentList:${this.key}:onDidMount`);
  }

  public serialize(): TSerializableViewContentList {
    if (!this.internalValue.getItems) throw new Error(`Get items not defined for "${this.key}" view content list`);

    return {
      key: this.key,
      type: 'viewContentList',
    };
  }
}
