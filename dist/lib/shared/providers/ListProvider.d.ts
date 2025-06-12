import { ListViewItem } from '../components/ListViewItem';
interface IListProviderProps {
    key: string;
    getItems: (item?: ListViewItem) => Promise<ListViewItem[]>;
}
export declare class ListProvider {
    readonly key: IListProviderProps['key'];
    readonly getItems: IListProviderProps['getItems'];
    constructor(props: IListProviderProps);
}
export {};
