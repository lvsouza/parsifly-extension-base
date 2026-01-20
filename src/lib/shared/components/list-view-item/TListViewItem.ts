import { TDropEvent } from '../../../types/TDropEvent';
import { TImage } from '../../../types/TImage';
import { ListViewItem } from './ListViewItem';
import { Action } from '../actions/Actions';


export type TListItemMountContext = {
  refetchChildren(): Promise<void>;
  set<GKey extends keyof TListViewItem>(property: GKey, value: TListViewItem[GKey]): Promise<void>;
}


export type TListItemBase = {
  icon?: TImage;
  /** Show additional information in bold */
  extra?: string;
  editing?: boolean;
  selected?: boolean;
  /** Details of the record */
  description?: string;
  disableEdit?: boolean;
  disableSelect?: boolean;
  onItemClick?: (context: TListItemMountContext) => Promise<void>;
  onItemDoubleClick?: (context: TListItemMountContext) => Promise<void>;
  getContextMenuItems?: (context: TListItemMountContext) => Promise<Action[]>;
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


export type TSerializableListViewItem = {
  key: string;
  icon: TImage | undefined;
  extra: string | undefined;
  label: string | undefined;
  title: string | undefined;
  opened: boolean | undefined;
  editing: boolean | undefined;
  selected: boolean | undefined;
  children: boolean | undefined;
  description: string | undefined;
  dragProvides: string | undefined;
  disableEdit: boolean | undefined;
  dropAccepts: string[] | undefined;
  disableSelect: boolean | undefined;
}
