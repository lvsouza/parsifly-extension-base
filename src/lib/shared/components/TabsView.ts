import { TabView } from './TabView';
import { Action } from './Action';


export interface ITabsViewProps {
  key: string;
  tabs: TabView[];
  actions?: Action[];
}
export class TabsView {
  public readonly key: ITabsViewProps['key'];
  public readonly tabs: ITabsViewProps['tabs'];
  public readonly actions: ITabsViewProps['actions'];

  constructor(props: ITabsViewProps) {
    this.key = props.key;
    this.tabs = props.tabs;
    this.actions = props.actions;
  }
}
