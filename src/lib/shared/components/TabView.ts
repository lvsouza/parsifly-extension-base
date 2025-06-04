import { ListProvider } from '../providers/ListProvider';


interface ITabViewProps {
  key: string;
  dataProvider: ListProvider;
}
export class TabView {
  public readonly key: ITabViewProps['key'];
  public readonly dataProvider: ITabViewProps['dataProvider'];

  constructor(props: ITabViewProps) {
    this.key = props.key;
    this.dataProvider = props.dataProvider;
  }
}
