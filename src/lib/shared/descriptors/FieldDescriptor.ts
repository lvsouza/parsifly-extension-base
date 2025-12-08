import { TIcon } from '../../types/TIcon';

export type TFieldDescriptorValue = string | number | boolean;

export type TFieldDescriptor<TValue extends TFieldDescriptorValue = TFieldDescriptorValue> = {
  /** Identifier */
  key: string;
  name: string;
  type: string;
  icon?: TIcon;
  /** Title, main information for the record  */
  label: string;
  /** Define if a item can have a children list */
  children?: boolean;
  /** Details of the record */
  description?: string;
  defaultValue?: string;

  getValue?(): Promise<TValue>;
  onDidChange?(value: TValue): Promise<void>;
};

export class FieldDescriptor {
  public readonly key: TFieldDescriptor['key'];
  public readonly name: TFieldDescriptor['name'];
  public readonly type: TFieldDescriptor['type'];
  public readonly icon: TFieldDescriptor['icon'];
  public readonly label: TFieldDescriptor['label'];
  public readonly children: TFieldDescriptor['children'];
  public readonly description: TFieldDescriptor['description'];
  public readonly defaultValue: TFieldDescriptor['defaultValue'];

  public readonly getValue: TFieldDescriptor['getValue'];
  public readonly onDidChange: TFieldDescriptor['onDidChange'];


  constructor(props: TFieldDescriptor) {
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
