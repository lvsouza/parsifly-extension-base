

export type TListViewItem = {
  /** Identifier */
  key: string;
  /** Label, main information for the record  */
  label: string;
  /** VS Code icons */
  icon?: string;
  /** Show additional information in bold */
  extra?: string;
  /** Details of the record */
  description?: string;
}
