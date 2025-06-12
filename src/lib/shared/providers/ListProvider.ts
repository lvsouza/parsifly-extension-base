import { ListViewItem } from '../components/ListViewItem';


interface IListProviderProps {
  key: string;
  getItems: (item?: ListViewItem) => Promise<ListViewItem[]>;
}
export class ListProvider {
  public readonly key: IListProviderProps['key'];
  public readonly getItems: IListProviderProps['getItems'];

  constructor(props: IListProviderProps) {
    this.key = props.key;
    this.getItems = props.getItems;
  }
}
