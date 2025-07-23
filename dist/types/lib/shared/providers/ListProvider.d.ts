import { ListViewItem } from '../components/ListViewItem';
interface IListProviderProps {
    key: string;
    onItemClick?: (item: ListViewItem) => Promise<void>;
    onItemDoubleClick?: (item: ListViewItem) => Promise<void>;
    getItems: (item?: ListViewItem) => Promise<ListViewItem[]>;
}
export declare class ListProvider {
    readonly key: IListProviderProps['key'];
    readonly getItems: IListProviderProps['getItems'];
    readonly onItemClick: IListProviderProps['onItemClick'];
    readonly onItemDoubleClick: IListProviderProps['onItemDoubleClick'];
    constructor(props: IListProviderProps);
}
export {};
