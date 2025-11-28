import { ListViewItem, TListViewItem } from '../components/ListViewItem';
import { EventLink } from '../services/EventLink';


export interface IListProviderProps {
  key: string;
  getItems: () => Promise<ListViewItem[]>;
}
export class ListProvider {
  public readonly type = 'list';
  public readonly key: IListProviderProps['key'];
  public readonly getItems: IListProviderProps['getItems'];


  private _registeredItems: Set<ListViewItem> = new Set();

  constructor(props: IListProviderProps) {
    this.key = props.key;
    this.unregisterFields = this.unregisterFields;

    this.getItems = (async () => {
      const items = await props.getItems();
      items.forEach(field => {
        if (field.getItems) EventLink.setExtensionEvent(`listItem:${field.key}:getItems`, field.getItems);
        if (field.onItemClick) EventLink.setExtensionEvent(`listItem:${field.key}:onItemClick`, field.onItemClick);
        if (field.onItemDoubleClick) EventLink.setExtensionEvent(`listItem:${field.key}:onItemDoubleClick`, field.onItemDoubleClick);
        this._registeredItems.add(field);
      });

      return items.map(field => ({
        ...field,
        getItems: undefined,
        onItemClick: undefined,
        unregisterFields: undefined,
        _registeredItems: undefined,
        onItemDoubleClick: undefined,
      })) as TListViewItem[];
    }) as typeof props.getItems
  }

  private unregisterFields() {
    this._registeredItems.forEach((field) => {
      (field as any).unregisterFields();
      EventLink.removeExtensionEvent(`listItem:${field.key}:getItems`);
      EventLink.removeExtensionEvent(`listItem:${field.key}:onItemClick`);
      EventLink.removeExtensionEvent(`listItem:${field.key}:onItemDoubleClick`);
    });

    this._registeredItems.clear();
  }
}
