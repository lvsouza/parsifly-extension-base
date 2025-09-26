import { ListViewItem } from '../components/ListViewItem';


interface IListProviderProps {
  key: string;
  onItemClick?: (item: ListViewItem) => Promise<void>;
  onItemDoubleClick?: (item: ListViewItem) => Promise<void>;
  getItems: (item?: ListViewItem) => Promise<ListViewItem[]>;
}
export class ListProvider {
  public readonly type = 'list';
  public readonly key: IListProviderProps['key'];
  public readonly getItems: IListProviderProps['getItems'];
  public readonly onItemClick: IListProviderProps['onItemClick'];
  public readonly onItemDoubleClick: IListProviderProps['onItemDoubleClick'];

  constructor(props: IListProviderProps) {
    this.key = props.key;
    this.getItems = props.getItems;
    this.onItemClick = props.onItemClick;
    this.onItemDoubleClick = props.onItemDoubleClick;
  }
}
