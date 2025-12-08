import { ListViewItem } from '../components/list-view-item/ListViewItem';


export interface IListProviderProps {
  key: string;
  getItems: () => Promise<ListViewItem[]>;
}
export class ListProvider {
  public readonly type = 'list';
  public readonly key: IListProviderProps['key'];
  public readonly getItems: IListProviderProps['getItems'];


  #registeredItems: Set<ListViewItem> = new Set();

  constructor(props: IListProviderProps) {
    this.key = props.key;
    this.unregister = this.unregister;

    this.getItems = (async () => {
      const items = await props.getItems();

      for (const item of items) {
        item.register();
        this.#registeredItems.add(item)
      }

      return items.map(field => ({
        key: field.key,
        icon: field.internalValue.icon,
        label: field.internalValue.label,
        extra: field.internalValue.extra,
        title: field.internalValue.title,
        opened: field.internalValue.opened,
        children: field.internalValue.children,
        draggable: field.internalValue.draggable,
        description: field.internalValue.description,
        disableSelect: field.internalValue.disableSelect,
      } as any));
    }) as typeof props.getItems
  }

  private unregister() {
    this.#registeredItems.forEach((field) => field.unregister());
    this.#registeredItems.clear();
  }
}
