import { TDataProvider, TSerializableDataProvider } from '../../providers/TDataProvider';
import { TImage } from '../../../types/TImage';
import { Action } from '../actions/Actions';


export type TViewContext = {
  refetchData(): Promise<void>;
  set<GKey extends keyof TView>(property: GKey, value: TView[GKey]): Promise<void>;
}

export type TView = {
  type: 'view';
  icon?: TImage;
  title: string;
  order?: number;
  description?: string;
  dataProvider: TDataProvider;
  position: 'primary' | 'secondary' | 'panel';
  getTabs?: (context: TViewContext) => Promise<Action[]>;
  getActions?: (context: TViewContext) => Promise<Action[]>;
}

export type TSerializableView = {
  key: string;
  type: 'view';
  title: string;
  icon: TImage | undefined;
  order: number | undefined;
  description: string | undefined;
  dataProvider: TSerializableDataProvider;
  position: 'primary' | 'secondary' | 'panel';
}
