

export type TListItemWithTitle = {
  label?: undefined;
  /** Title, main information for the record  */
  title: string;
}

export type TListItemWithLabel = {
  /** Label, main information for the record  */
  label: string;
  title?: undefined;
}

export type TListViewItem = (TListItemWithLabel | TListItemWithTitle) & {
  /** Identifier */
  key: string;
  /** VS Code icons */
  icon?: string;
  /** Show additional information in bold */
  extra?: string;
  /** Details of the record */
  description?: string;
}
