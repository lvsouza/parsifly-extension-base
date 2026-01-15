import { TSerializableListViewItem } from '../components/list-view-item/TListViewItem';
import { ListViewItem } from '../components/list-view-item/ListViewItem';
import { EventLink } from '../services/EventLink';


export type TSerializableListProvider = {
  key: string;
  type: 'list';
}

export interface IListProviderProps {
  key: string;
  getItems: () => Promise<ListViewItem[]>;
}
export class ListProvider {
  public readonly type = 'list';
  public readonly key: IListProviderProps['key'];
  public readonly getItems: () => Promise<TSerializableListViewItem[]>;


  #registered: Set<ListViewItem> = new Set();

  constructor(props: IListProviderProps) {
    this.key = props.key;

    this.getItems = async () => {
      const items = await props.getItems();

      this.#registered.forEach((item) => item.unregister());
      this.#registered.clear();

      for (const item of items) {
        item.register();
        this.#registered.add(item)
      }

      return items.map(field => field.serialize());
    };
  }

  public register() {
    EventLink.addEventListener(`dataProvider:${this.key}:getItems`, this.getItems);
  }

  public unregister() {
    EventLink.removeEventListener(`dataProvider:${this.key}:getItems`);

    this.#registered.forEach((item) => item.unregister());
    this.#registered.clear();
  }

  public serialize(): TSerializableListProvider {
    return {
      key: this.key,
      type: this.type,
    };
  }
}
