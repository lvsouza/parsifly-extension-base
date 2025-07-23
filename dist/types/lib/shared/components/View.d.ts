import { ListProvider } from '../providers/ListProvider';
import { Action } from './Action';
interface IViewProps {
    key: string;
    actions?: Action[];
    dataProvider: ListProvider;
}
export declare class View {
    readonly key: IViewProps['key'];
    readonly actions: IViewProps['actions'];
    readonly dataProvider: IViewProps['dataProvider'];
    constructor(props: IViewProps);
}
export {};
