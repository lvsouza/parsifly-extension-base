import { ContextMenuItem } from '../ContextMenuItem';
import { ListViewItem } from './ListViewItem';


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
