import { TDropEvent } from '../../../types/TDropEvent';
import { ContextMenuItem } from '../ContextMenuItem';
import { TImage } from '../../../types/TImage';
import { ListViewItem } from './ListViewItem';


export type TListItemMountContext = {
  refetchChildren(): Promise<void>;
  edit(value: boolean): Promise<void>;
  select(value: boolean): Promise<void>;
  set<GKey extends keyof TListViewItem>(property: GKey, value: TListViewItem[GKey]): Promise<void>;
}


export type TListItemBase = {
  icon?: TImage;
  /** Show additional information in bold */
  extra?: string;
  /** Details of the record */
  description?: string;
  disableSelect?: boolean;
  onItemClick?: (context: TListItemMountContext) => Promise<void>;
  onItemDoubleClick?: (context: TListItemMountContext) => Promise<void>;
  getContextMenuItems?: (context: TListItemMountContext) => Promise<ContextMenuItem[]>;
}

export type TListItemWithTitle = {
  label?: undefined;
  getItems?: undefined;
  opened?: false | undefined;
  children?: false | undefined;
  /** Title, main information for the record  */
  title: string;
}

export type TListItemWithLabel = {
  /** Label, main information for the record  */
  label: string;
  opened: boolean;
  title?: undefined;
  /** Define if a item can have a children list */
  children: boolean;
  getItems?: (context: TListItemMountContext) => Promise<ListViewItem[]>;
}

export type TListItemWithoutDrag = {
  dragProvides?: undefined;
}

export type TListItemWithDrag = {
  dragProvides: string;
}

export type TListItemWithoutDrop = {
  onDidDrop?: undefined;
  dropAccepts?: undefined;
}

export type TListItemWithDrop = {
  dropAccepts: string[];
  onDidDrop: (context: TListItemMountContext, event: TDropEvent) => Promise<void>;
}

export type TListViewItem =
  & TListItemBase
  & (TListItemWithLabel | TListItemWithTitle)
  & (TListItemWithoutDrag | TListItemWithDrag)
  & (TListItemWithoutDrop | TListItemWithDrop);
