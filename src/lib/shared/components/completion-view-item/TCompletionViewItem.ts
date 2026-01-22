import { TImage } from '../../../types/TImage';


export type TCompletionViewItemMountContext = {
  readonly currentValue: TCompletionViewItem;
  set<GKey extends keyof TCompletionViewItem>(property: GKey, value: TCompletionViewItem[GKey]): Promise<void>;
}

export type TCompletionViewItem = {
  icon?: TImage;
  label: string;
  value: unknown;
  disabled?: boolean;
  description?: string;
}

export type TSerializableCompletionViewItem = {
  key: string;
  label: string;
  value: unknown;
  icon: TImage | undefined;
  disabled: boolean | undefined;
  description: string | undefined;
}