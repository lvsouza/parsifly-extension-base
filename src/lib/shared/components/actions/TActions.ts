import { TImage } from '../../../types/TImage';
import { Action } from './Actions';


export type TActionMountContext = {
  readonly currentValue: TAction;
  refetchChildren(): Promise<void>;
  set<GKey extends keyof TAction>(property: GKey, value: TAction[GKey]): Promise<void>;
}

export type TSingleAction = {
  children: false;
  getActions?: undefined;
  action(context: TActionMountContext): Promise<void>;
};

export type TMultiAction = {
  children: true;
  action?: undefined;
  getActions: (context: TActionMountContext) => Promise<Action[]>;
};

export type TAction =
  & (TSingleAction | TMultiAction)
  & {
    icon?: TImage;
    label: string;
    description?: string;
  };

export type TSerializableAction = {
  key: string;
  label: string;
  icon: TImage | undefined;
  children: boolean | undefined;
  description: string | undefined;
};
