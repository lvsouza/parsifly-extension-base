import { ListProvider } from '../providers/ListProvider';
interface ITabViewProps {
    key: string;
    dataProvider: ListProvider;
}
export declare class TabView {
    readonly key: ITabViewProps['key'];
    readonly dataProvider: ITabViewProps['dataProvider'];
    constructor(props: ITabViewProps);
}
export {};
