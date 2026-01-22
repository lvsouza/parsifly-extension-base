import { TSerializableCompletionViewItem } from '../completion-view-item/TCompletionViewItem';
import { TImage } from '../../../types/TImage';


export type TFieldViewItemMountContext = {
  reloadValue(): Promise<void>;
  readonly currentValue: TFieldViewItem;
  set<GKey extends keyof TFieldViewItem>(property: GKey, value: TFieldViewItem[GKey]): Promise<void>;
}

export type TFieldViewItemValue = string | number | boolean | null | object;

export type TFieldViewItemType =
  | 'view'
  | 'text'
  | 'number'
  | 'boolean'
  | 'textarea'
  | 'expression'
  | 'autocomplete'
  ;

export type TFieldViewItem<TValue extends TFieldViewItemValue = TFieldViewItemValue> = {
  name: string;
  icon?: TImage;
  type: TFieldViewItemType;
  /** Title, main information for the record  */
  label: string;
  info?: string;
  error?: string;
  warning?: string;
  disabled?: boolean;
  /** Details of the record */
  description?: string;
  defaultValue?: TValue;

  onDidChange?(value: TValue, context: TFieldViewItemMountContext): Promise<void>;
  getValue?(context: TFieldViewItemMountContext): Promise<TValue | TSerializableCompletionViewItem>;
  getCompletions?(query: string | undefined, context: TFieldViewItemMountContext): Promise<TSerializableCompletionViewItem[]>;
}

export type TSerializableFieldViewItem<TValue extends TFieldViewItemValue = TFieldViewItemValue> = {
  key: string;
  name: string;
  label: string;
  icon: TImage | undefined;
  type: TFieldViewItemType;
  info: string | undefined;
  error: string | undefined;
  warning: string | undefined;
  disabled: boolean | undefined;
  description: string | undefined;
  defaultValue: TValue | undefined;
}
