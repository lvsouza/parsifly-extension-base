import { TDataProvider, TSerializableDataProvider } from '../../providers/TDataProvider';
import { PlatformAction } from '../platform-actions/PlatformActions';
import { TImage } from '../../../types/TImage';


export type TViewContext = {
  refetchData(): Promise<void>;
  set<GKey extends keyof TView>(property: GKey, value: TView[GKey]): Promise<void>;
}

export type TView = {
  type: 'view';
  icon?: TImage;
  title: string;
  description?: string;
  dataProvider: TDataProvider;
  position: 'primary' | 'secondary';
  getTabs?: (context: TViewContext) => Promise<PlatformAction[]>;
  getActions?: (context: TViewContext) => Promise<PlatformAction[]>;
}

export type TSerializableView = {
  key: string;
  type: 'view';
  title: string;
  icon: TImage | undefined;
  description: string | undefined;
  position: 'primary' | 'secondary';
  dataProvider: TSerializableDataProvider;
}
