import { ContextMenuItem, TContextMenuItem } from '../ContextMenuItem';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';
import { TListViewItem } from './TListViewItem';


type TListItemMountContext = {
  refetchChildren(): Promise<void>;
  edit(value: boolean): Promise<void>;
  select(value: boolean): Promise<void>;
  set<GKey extends keyof TListViewItem>(property: GKey, value: TListViewItem[GKey]): Promise<void>;
}

export type TListViewItemConstructor = {
  key: string;
  initialValue?: Partial<TListViewItem>;
  onDidMount?: TOnDidMount<TListItemMountContext>;
}
export class ListViewItem {
  #registeredItems: Set<ListViewItem | ContextMenuItem> = new Set();

  public readonly key: TListViewItemConstructor['key'];
  public readonly onDidMount: TListViewItemConstructor['onDidMount'];
  public readonly internalValue: NonNullable<Partial<TListViewItemConstructor['initialValue']>>;

  constructor(props: TListViewItemConstructor) {
    this.key = props.key;
    this.unregister = this.unregister;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
    EventLink.setExtensionEvent(`listItem:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }


  async #onDidMount(): Promise<void> {
    EventLink.setExtensionEvent(`listItem:${this.key}:onItemClick`, async () => this.internalValue.onItemClick?.());
    EventLink.setExtensionEvent(`listItem:${this.key}:onItemDoubleClick`, async () => this.internalValue.onItemDoubleClick?.());
    EventLink.setExtensionEvent(`listItem:${this.key}:getItems`, async () => {
      const items = await this.internalValue.getItems?.() || [];

      for (const item of items) {
        this.#registeredItems.add(item)
      }

      return items.map(field => ({
        key: field.key,
        icon: field.internalValue.icon,
        label: field.internalValue.label,
        extra: field.internalValue.extra,
        title: field.internalValue.title,
        children: field.internalValue.children,
        draggable: field.internalValue.draggable,
        description: field.internalValue.description,
      }));
    });
    EventLink.setExtensionEvent(`listItem:${this.key}:getContextMenuItems`, async () => {
      const items = await this.internalValue.getContextMenuItems?.() || [];

      items.forEach(item => {
        if (item.onClick) EventLink.setExtensionEvent(`contextMenuItem:${item.key}:onClick`, item.onClick);
        this.#registeredItems.add(item);
      });

      return items.map(item => ({
        ...item,
        onClick: undefined,
        unregister: undefined,
        _registeredItems: undefined,
      })) as Partial<TContextMenuItem>[];
    });


    this.onDidMount?.({
      edit: async (value) => {
        return await EventLink.callStudioEvent(`listItem:${this.key}:edit`, value);
      },
      select: async (value) => {
        return await EventLink.callStudioEvent(`listItem:${this.key}:select`, value);
      },
      refetchChildren: async () => {
        return await EventLink.callStudioEvent(`listItem:${this.key}:refetchChildren`);
      },
      set: async <GKey extends keyof TListViewItem>(property: GKey, newValue: TListViewItem[GKey]) => {
        switch (property) {
          case 'getItems':
          case 'onItemClick':
          case 'onItemDoubleClick':
          case 'getContextMenuItems':
            this.internalValue[property] = newValue;
            return;

          default:
            this.internalValue[property] = newValue;
            return await EventLink.callStudioEvent(`listItem:${this.key}:set`, { property, newValue });
        }
      },
      onDidUnmount: (didUnmount) => {
        const didUnmountAndRemoveEventListener = async () => {
          await didUnmount();

          EventLink.removeExtensionEvent(`listItem:${this.key}:getItems`);
          EventLink.removeExtensionEvent(`listItem:${this.key}:onDidUnmount`);
          EventLink.removeExtensionEvent(`listItem:${this.key}:onItemClick`);
          EventLink.removeExtensionEvent(`listItem:${this.key}:onItemDoubleClick`);
          EventLink.removeExtensionEvent(`listItem:${this.key}:getContextMenuItems`);
        }

        EventLink.setExtensionEvent(`listItem:${this.key}:onDidUnmount`, didUnmountAndRemoveEventListener);
      },
    });
  }

  private unregister() {
    EventLink.removeExtensionEvent(`listItem:${this.key}:getItems`);
    EventLink.removeExtensionEvent(`listItem:${this.key}:onDidMount`)
    EventLink.removeExtensionEvent(`listItem:${this.key}:onItemClick`);
    EventLink.removeExtensionEvent(`listItem:${this.key}:onDidUnmount`);
    EventLink.removeExtensionEvent(`listItem:${this.key}:onItemDoubleClick`);
    EventLink.removeExtensionEvent(`listItem:${this.key}:getContextMenuItems`);

    this.#registeredItems.forEach((field) => {
      if (field instanceof ListViewItem) {
        (field as any).unregister();
      } else {
        EventLink.removeExtensionEvent(`contextMenuItem:${field.key}:onClick`);
      }
    });
    this.#registeredItems.clear();
  }
}
