
type TFormViewItemValue = string | number | boolean;

export type TFormViewItem<TValue extends TFormViewItemValue = TFormViewItemValue> = {
  /** Identifier */
  key: string;
  name: string;
  type: string;
  /** Title, main information for the record  */
  label: string;
  /** VS Code icons */
  icon?: string;
  /** Define if a item can have a children list */
  children?: boolean;
  /** Details of the record */
  description?: string;
  defaultValue?: string;

  getValue?(): Promise<TValue>;
  onDidChange?(value: TValue): Promise<void>;
};

export class FormViewItem {
  public readonly key: TFormViewItem['key'];
  public readonly name: TFormViewItem['name'];
  public readonly type: TFormViewItem['type'];
  public readonly icon: TFormViewItem['icon'];
  public readonly label: TFormViewItem['label'];
  public readonly children: TFormViewItem['children'];
  public readonly description: TFormViewItem['description'];
  public readonly defaultValue: TFormViewItem['defaultValue'];

  public readonly getValue: TFormViewItem['getValue'];
  public readonly onDidChange: TFormViewItem['onDidChange'];


  constructor(props: TFormViewItem) {
    this.key = props.key;
    this.name = props.name;
    this.type = props.type;
    this.icon = props.icon;
    this.label = props.label;
    this.children = props.children;
    this.description = props.description;
    this.defaultValue = props.defaultValue;
    this.getValue = props.getValue;
    this.onDidChange = props.onDidChange;
  }
}
