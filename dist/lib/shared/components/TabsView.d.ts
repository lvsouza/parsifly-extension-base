import { TabView } from './TabView';
import { Action } from './Action';
interface ITabsViewProps {
    key: string;
    tabs: TabView[];
    actions?: Action[];
}
export declare class TabsView {
    readonly key: ITabsViewProps['key'];
    readonly tabs: ITabsViewProps['tabs'];
    readonly actions: ITabsViewProps['actions'];
    constructor(props: ITabsViewProps);
}
export {};
