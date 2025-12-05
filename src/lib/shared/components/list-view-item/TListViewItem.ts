import { ContextMenuItem } from '../ContextMenuItem';
import { ListViewItem } from './ListViewItem';


export type TListItemMountContext = {
  refetchChildren(): Promise<void>;
  edit(value: boolean): Promise<void>;
  select(value: boolean): Promise<void>;
  set<GKey extends keyof TListViewItem>(property: GKey, value: TListViewItem[GKey]): Promise<void>;
}


export type TListItemBase = {
  /** Identifier */
  key: string;
  /** VS Code icons */
  icon?: string;
  /** Show additional information in bold */
  extra?: string;
  /** Details of the record */
  description?: string;
  onItemClick?: (context: TListItemMountContext) => Promise<void>;
  onItemDoubleClick?: (context: TListItemMountContext) => Promise<void>;
  getContextMenuItems?: (context: TListItemMountContext) => Promise<ContextMenuItem[]>;
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
  getItems?: (context: TListItemMountContext) => Promise<ListViewItem[]>;
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
