import { TImage } from '../../../types/TImage';


export type TStatusBarItemMountContext = {
  readonly currentValue: TStatusBarItem;
  set<GKey extends keyof TStatusBarItem>(property: GKey, value: TStatusBarItem[GKey]): Promise<void>;
}

export type TStatusBarItem = {
  icon?: TImage;
  label: string;
  description?: string;
  side: 'right' | 'left';
  action(context: TStatusBarItemMountContext): Promise<void>;
};

export type TSerializableStatusBarItem = {
  key: string;
  label: string;
  side: 'right' | 'left';
  icon: TImage | undefined;
  description: string | undefined;
}
