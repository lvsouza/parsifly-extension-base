import { TSerializableCompletionViewItem } from '../../components/completion-view-item/TCompletionViewItem';
import { TImage } from '../../../types/TImage';


export type TFieldDescriptorMountContext = {
  reloadValue(): Promise<void>;
  getCompletions(query?: string): Promise<TSerializableCompletionViewItem[]>;
  set<GKey extends keyof TFieldDescriptor>(property: GKey, value: TFieldDescriptor[GKey]): Promise<void>;
}

export type TFieldDescriptorValue = string | number | boolean | null | TSerializableCompletionViewItem;

export type TFieldDescriptorType =
  | 'view'
  | 'text'
  | 'number'
  | 'boolean'
  | 'textarea'
  | 'expression'
  | 'autocomplete'
  ;

export type TFieldDescriptor<TValue extends TFieldDescriptorValue = TFieldDescriptorValue> = {
  name: string;
  icon?: TImage;
  type: TFieldDescriptorType;
  /** Title, main information for the record  */
  label: string;
  disabled?: boolean;
  /** Details of the record */
  description?: string;
  defaultValue?: TValue;

  getValue?(context: TFieldDescriptorMountContext): Promise<TValue>;
  onDidChange?(value: TValue, context: TFieldDescriptorMountContext): Promise<void>;
  getCompletions?(query: string | undefined, context: TFieldDescriptorMountContext): Promise<TSerializableCompletionViewItem[]>;
}