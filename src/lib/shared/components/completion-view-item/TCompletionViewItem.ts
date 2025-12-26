import { TImage } from '../../../types/TImage';


export type TCompletionViewItemMountContext = {
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
  icon?: TImage;
  label: string;
  value: unknown;
  disabled?: boolean;
  description?: string;
}