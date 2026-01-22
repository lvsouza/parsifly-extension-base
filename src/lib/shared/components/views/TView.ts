import { TSerializableViewContentList } from './TViewContentList';
import { TSerializableViewContentForm } from './TViewContentForm';
import { ViewContentList } from './ViewContentList';
import { ViewContentForm } from './ViewContentForm';
import { TImage } from '../../../types/TImage';
import { Action } from '../actions/Actions';


export type TViewMountContext = {
  refetch(): Promise<void>;
  readonly currentValue: TView;
  set<GKey extends keyof TView>(property: GKey, value: TView[GKey]): Promise<void>;
}

export type TView = {
  type: 'view';
  icon?: TImage;
  title: string;
  order?: number;
  description?: string;
  position: 'primary' | 'secondary' | 'panel';
  viewContent: ViewContentList | ViewContentForm;
  getTabs?: (context: TViewMountContext) => Promise<Action[]>;
  getActions?: (context: TViewMountContext) => Promise<Action[]>;
}

export type TSerializableView = {
  key: string;
  type: 'view';
  title: string;
  icon: TImage | undefined;
  order: number | undefined;
  description: string | undefined;
  position: 'primary' | 'secondary' | 'panel';
  viewContent: TSerializableViewContentList | TSerializableViewContentForm;
}
