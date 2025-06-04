import { TListViewItem } from '../../types/TListViewItem';
interface IListProviderProps {
    key: string;
    getItems: (item?: TListViewItem) => Promise<TListViewItem[]>;
}
export declare class ListProvider {
    readonly key: IListProviderProps['key'];
    readonly getItems: IListProviderProps['getItems'];
    constructor(props: IListProviderProps);
}
export {};
