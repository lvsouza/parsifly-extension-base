import { PlatformAction } from './PlatformActions';
import { TImage } from '../../../types/TImage';


export type TPlatformActionMountContext = {
  refetchChildren(): Promise<void>;
  set<GKey extends keyof TPlatformAction>(property: GKey, value: TPlatformAction[GKey]): Promise<void>;
}

export type TSingleAction = {
  children: false;
  getActions?: undefined;
  action(context: TPlatformActionMountContext): Promise<void>;
};

export type TMultiAction = {
  children: true;
  action?: undefined;
  getActions: (context: TPlatformActionMountContext) => Promise<PlatformAction[]>;
};

export type TPlatformAction = (TSingleAction | TMultiAction) & {
  icon?: TImage;
  label: string;
  description?: string;
};

export type TSerializablePlatformAction = {
  key: string;
  label: string;
  icon: TImage | undefined;
  children: boolean | undefined;
  description: string | undefined;
};
