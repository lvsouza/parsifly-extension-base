import { TListViewItem } from '../../types/TListViewItem';


interface IListProviderProps {
  key: string;
  getItems: (item?: TListViewItem) => Promise<TListViewItem[]>;
}
export class ListProvider {
  public readonly key: IListProviderProps['key'];
  public readonly getItems: IListProviderProps['getItems'];

  constructor(props: IListProviderProps) {
    this.key = props.key;
    this.getItems = props.getItems;
  }
}
