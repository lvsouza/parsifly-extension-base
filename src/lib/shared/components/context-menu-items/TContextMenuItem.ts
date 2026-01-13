import { TImage } from '../../../types/TImage';


export type TContextMenuItem = {
  icon?: TImage;
  label: string;
  description?: string;
  onClick: () => Promise<void>;
}

export type TSerializableContextMenuItem = {
  key: string;
  label: string;
  icon: TImage | undefined;
  description: string | undefined;
}
