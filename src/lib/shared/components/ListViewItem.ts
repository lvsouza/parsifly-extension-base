import { ContextMenuItem, TContextMenuItem } from './ContextMenuItem';
import { EventLink } from '../services/EventLink';


export type TListItemBase = {
  /** Identifier */
  key: string;
  /** VS Code icons */
  icon?: string;
  /** Show additional information in bold */
  extra?: string;
  /** Details of the record */
  description?: string;
  onItemClick?: () => Promise<void>;
  onItemDoubleClick?: () => Promise<void>;
  getContextMenuItems?: () => Promise<ContextMenuItem[]>;
}

export type TListItemWithTitle = {
  label?: undefined;
  getItems?: undefined;
  children?: false | undefined;
  /** Title, main information for the record  */
  title: string;
}

export type TListItemWithLabel = {
  /** Label, main information for the record  */
  label: string;
  title?: undefined;
  /** Define if a item can have a children list */
  children: boolean;
  getItems?: () => Promise<ListViewItem[]>;
}

export type TListItemWithoutDraggableData = {
  draggable?: false | undefined;
  draggableData?: void;
}

export type TListItemWithDraggableData = {
  draggable: boolean;
  draggableData: Record<string, any>;
}

export type TListViewItem = (TListItemWithLabel | TListItemWithTitle) & (TListItemWithoutDraggableData | TListItemWithDraggableData) & TListItemBase;

export class ListViewItem {
  public readonly key: TListItemBase['key'];
  public readonly icon?: TListItemBase['icon'];
  public readonly extra?: TListItemBase['extra'];
  public readonly description?: TListItemBase['description'];
  public readonly onItemClick?: TListViewItem['onItemClick'];
  public readonly onItemDoubleClick?: TListViewItem['onItemDoubleClick'];
  public readonly getContextMenuItems?: TListViewItem['getContextMenuItems'];

  public readonly title?: TListViewItem['title'];
  public readonly label?: TListViewItem['label'];
  public readonly children?: TListViewItem['children'];
  public readonly getItems?: TListViewItem['getItems'];

  public readonly draggable?: TListViewItem['draggable'];
  public readonly draggableData?: TListViewItem['draggableData'];


  private _registeredItems: Set<ListViewItem | ContextMenuItem> = new Set();

  constructor(props: TListViewItem) {
    this.key = props.key;
    this.icon = props.icon;
    this.extra = props.extra;
    this.description = props.description;
    this.unregisterFields = this.unregisterFields;

    this.onItemClick = props.onItemClick;
    this.onItemDoubleClick = props.onItemDoubleClick;

    if ('title' in props && props.title !== undefined) {
      this.title = props.title;
    }

    if ('label' in props && props.label !== undefined) {
      this.label = props.label;
    }

    if ('children' in props && props.children !== undefined) {
      this.children = props.children;
    }

    if ('draggable' in props && props.draggable) {
      this.draggable = props.draggable;
      this.draggableData = props.draggableData;
    } else {
      this.draggable = false;
    }

    if ((this.title && this.label) || (!this.title && !this.label)) {
      throw new Error("ListViewItem must have either a `title` or a `label`, but not both.");
    }

    if ('getItems' in props && props.getItems !== undefined) {
      const getItems = props.getItems;

      this.getItems = (async () => {
        const items = await getItems();

        items.forEach(field => {
          if (field.getItems) EventLink.setExtensionEvent(`listItem:${field.key}:getItems`, field.getItems);
          if (field.onItemClick) EventLink.setExtensionEvent(`listItem:${field.key}:onItemClick`, field.onItemClick);
          if (field.onItemDoubleClick) EventLink.setExtensionEvent(`listItem:${field.key}:onItemDoubleClick`, field.onItemDoubleClick);
          if (field.getContextMenuItems) EventLink.setExtensionEvent(`listItem:${field.key}:getContextMenuItems`, field.getContextMenuItems);
          this._registeredItems.add(field);
        });

        return items.map(field => ({
          ...field,
          getItems: undefined,
          onItemClick: undefined,
          unregisterFields: undefined,
          _registeredItems: undefined,
          onItemDoubleClick: undefined,
          getContextMenuItems: undefined,
        })) as TListViewItem[];
      }) as typeof props.getItems
    }

    if ('getContextMenuItems' in props && props.getContextMenuItems !== undefined) {
      const getContextMenuItems = props.getContextMenuItems;

      this.getContextMenuItems = (async () => {
        const items = await getContextMenuItems();

        items.forEach(item => {
          if (item.onClick) EventLink.setExtensionEvent(`contextMenuItem:${item.key}:onClick`, item.onClick);
          this._registeredItems.add(item);
        });

        return items.map(item => ({
          ...item,
          onClick: undefined,
          unregisterFields: undefined,
          _registeredItems: undefined,
        })) as Partial<TContextMenuItem>[];
      }) as typeof props.getContextMenuItems
    }
  }

  private unregisterFields() {
    this._registeredItems.forEach((field) => {
      if (field instanceof ListViewItem) {
        (field as any).unregisterFields();
        EventLink.removeExtensionEvent(`listItem:${field.key}:getItems`);
        EventLink.removeExtensionEvent(`listItem:${field.key}:onItemClick`);
        EventLink.removeExtensionEvent(`listItem:${field.key}:onItemDoubleClick`);
        EventLink.removeExtensionEvent(`listItem:${field.key}:getContextMenuItems`);
      } else {
        EventLink.removeExtensionEvent(`contextMenuItem:${field.key}:onClick`);
      }
    });

    this._registeredItems.clear();
  }
}
