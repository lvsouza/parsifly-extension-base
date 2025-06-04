import { ListProvider } from '../providers/ListProvider';
import { Action } from './Action';


interface IViewProps {
  key: string;
  actions?: Action[];
  dataProvider: ListProvider;
}
export class View {
  public readonly key: IViewProps['key'];
  public readonly actions: IViewProps['actions'];
  public readonly dataProvider: IViewProps['dataProvider'];

  constructor(props: IViewProps) {
    this.key = props.key;
    this.actions = props.actions;
    this.dataProvider = props.dataProvider;
  }
}
