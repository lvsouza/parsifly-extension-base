import { TSerializableFieldViewItem } from '../field-view-item/TFieldViewItem';
import { FieldViewItem } from '../field-view-item/FieldViewItem';


export type TViewContentFormContext = {
  refetch(): Promise<void>;
  readonly currentValue: TViewContentForm;
  set<GKey extends keyof TViewContentForm>(property: GKey, value: TViewContentForm[GKey]): Promise<void>;
}

export type TViewContentForm = {
  type: 'viewContentForm';
  getFields?: (context: TViewContentFormContext) => Promise<(TSerializableFieldViewItem | FieldViewItem)[]>;
}

export type TSerializableViewContentForm = {
  key: string;
  registerId: string;
  type: 'viewContentForm';
}
