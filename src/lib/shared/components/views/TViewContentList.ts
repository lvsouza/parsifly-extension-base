import { ListViewItem } from '../list-view-item/ListViewItem';


export type TViewContentListContext = {
  refetch(): Promise<void>;
  readonly currentValue: TViewContentList;
  set<GKey extends keyof TViewContentList>(property: GKey, value: TViewContentList[GKey]): Promise<void>;
}

export type TViewContentList = {
  type: 'viewContentList';
  getItems?: (context: TViewContentListContext) => Promise<ListViewItem[]>;
}

export type TSerializableViewContentList = {
  key: string;
  registerId: string;
  type: 'viewContentList';
}
