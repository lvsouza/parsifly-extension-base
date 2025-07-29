type TListItemBase = {
    /** Identifier */
    key: string;
    /** VS Code icons */
    icon?: string;
    /** Show additional information in bold */
    extra?: string;
    /** Details of the record */
    description?: string;
};
type TListItemWithTitle = {
    label?: undefined;
    children?: false | undefined;
    /** Title, main information for the record  */
    title: string;
};
type TListItemWithLabel = {
    /** Label, main information for the record  */
    label: string;
    title?: undefined;
    /** Define if a item can have a children list */
    children: boolean;
};
type TListItemWithoutDraggableData = {
    draggable?: false | undefined;
    draggableData?: void;
};
type TListItemWithDraggableData = {
    draggable: boolean;
    draggableData: Record<string, any>;
};
export type TListViewItem = (TListItemWithLabel | TListItemWithTitle) & (TListItemWithoutDraggableData | TListItemWithDraggableData) & TListItemBase;
export declare class ListViewItem {
    readonly key: TListItemBase['key'];
    readonly icon?: TListItemBase['icon'];
    readonly extra?: TListItemBase['extra'];
    readonly description?: TListItemBase['description'];
    readonly title?: TListViewItem['title'];
    readonly label?: TListViewItem['label'];
    readonly children?: TListViewItem['children'];
    readonly draggable?: TListViewItem['draggable'];
    readonly draggableData?: TListViewItem['draggableData'];
    constructor(props: TListViewItem);
}
export {};
