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
  public readonly defaultValue: NonNullable<TViewContentListConstructor['initialValue']>;


  constructor(props: TViewContentListConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.defaultValue = props.initialValue || {};
    this.defaultValue.type = 'viewContentList';
  }


  #createContext(internalValue: typeof this.defaultValue, mountId: string): TViewContentListContext {
    return {
      currentValue: internalValue as TViewContentList,
      refetch: async () => {
        return await EventLink.sendEvent(`viewContentList:${mountId}:refetch`);
      },
      set: async <GKey extends keyof TViewContentList>(property: GKey, newValue: TViewContentList[GKey]) => {
        switch (property) {
          case 'getItems':
            internalValue[property] = newValue;
            return;

          default:
            internalValue[property] = newValue;
            return await EventLink.sendEvent(`viewContentList:${mountId}:set`, { property, newValue });
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const internalValue = this.defaultValue;

    const context = this.#createContext(internalValue, mountId);

    const registeredItems = new Set<ListViewItem>();
    EventLink.addEventListener(`viewContentList:${mountId}:getItems`, async () => {
      const items = await internalValue.getItems?.(context) || [];

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
    if (!this.defaultValue.getItems) throw new Error(`Get items not defined for "${this.key}" view content list`);

    return {
      key: this.key,
      type: 'viewContentList',
    };
  }
}
