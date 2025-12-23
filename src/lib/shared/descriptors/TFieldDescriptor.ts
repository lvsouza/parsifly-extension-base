import { TImage } from '../../types/TImage';


export type TFieldDescriptorMountContext = {
  reloadValue(): Promise<void>;
  set<GKey extends keyof TFieldDescriptor>(property: GKey, value: TFieldDescriptor[GKey]): Promise<void>;
}

export type TFieldDescriptorValue = string | number | boolean;

export type TFieldDescriptorType =
  | 'view'
  | 'text'
  | 'number'
  | 'boolean'
  | 'textarea'
  | 'expression'

export type TFieldDescriptor<TValue extends TFieldDescriptorValue = TFieldDescriptorValue> = {
  name: string;
  icon?: TImage;
  type: TFieldDescriptorType | (string & {});
  /** Title, main information for the record  */
  label: string;
  disabled?: boolean;
  /** Details of the record */
  description?: string;
  defaultValue?: TValue;

  getValue?(context: TFieldDescriptorMountContext): Promise<TValue>;
  onDidChange?(value: TValue, context: TFieldDescriptorMountContext): Promise<void>;
}