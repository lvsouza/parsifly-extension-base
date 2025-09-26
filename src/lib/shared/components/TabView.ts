import { TDataProvider } from '../providers/TDataProvider';


interface ITabViewProps {
  key: string;
  dataProvider: TDataProvider;
}
export class TabView {
  public readonly key: ITabViewProps['key'];
  public readonly dataProvider: ITabViewProps['dataProvider'];

  constructor(props: ITabViewProps) {
    this.key = props.key;
    this.dataProvider = props.dataProvider;
  }
}
