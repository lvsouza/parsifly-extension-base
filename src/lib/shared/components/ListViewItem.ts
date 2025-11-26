
export type TListItemBase = {
  /** Identifier */
  key: string;
  /** VS Code icons */
  icon?: string;
  /** Show additional information in bold */
  extra?: string;
  /** Details of the record */
  description?: string;
}

export type TListItemWithTitle = {
  label?: undefined;
  children?: false | undefined;
  /** Title, main information for the record  */
  title: string;
}

export type TListItemWithLabel = {
  /** Label, main information for the record  */
  label: string;
  title?: undefined;
  /** Define if a item can have a children list */
  children: boolean;
}

export type TListItemWithoutDraggableData = {
  draggable?: false | undefined;
  draggableData?: void;
}

export type TListItemWithDraggableData = {
  draggable: boolean;
  draggableData: Record<string, any>;
}

export type TListViewItem = (TListItemWithLabel | TListItemWithTitle) & (TListItemWithoutDraggableData | TListItemWithDraggableData) & TListItemBase;

export class ListViewItem {
  public readonly key: TListItemBase['key'];
  public readonly icon?: TListItemBase['icon'];
  public readonly extra?: TListItemBase['extra'];
  public readonly description?: TListItemBase['description'];

  public readonly title?: TListViewItem['title'];
  public readonly label?: TListViewItem['label'];
  public readonly children?: TListViewItem['children'];

  public readonly draggable?: TListViewItem['draggable'];
  public readonly draggableData?: TListViewItem['draggableData'];


  constructor(props: TListViewItem) {
    this.key = props.key;
    this.icon = props.icon;
    this.extra = props.extra;
    this.description = props.description;

    if ('title' in props && props.title !== undefined) {
      this.title = props.title;
    }

    if ('label' in props && props.label !== undefined) {
      this.label = props.label;
    }

    if ('children' in props && props.children !== undefined) {
      this.children = props.children;
    }

    if ('draggable' in props && props.draggable) {
      this.draggable = props.draggable;
      this.draggableData = props.draggableData;
    } else {
      this.draggable = false;
    }

    if ((this.title && this.label) || (!this.title && !this.label)) {
      throw new Error("ListViewItem must have either a `title` or a `label`, but not both.");
    }
  }
}
