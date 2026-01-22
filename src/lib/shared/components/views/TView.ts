import { TSerializableViewContentWebView } from './TViewContentWebView';
import { TSerializableViewContentList } from './TViewContentList';
import { TSerializableViewContentForm } from './TViewContentForm';
import { ViewContentWebView } from './ViewContentWebView';
import { ViewContentList } from './ViewContentList';
import { ViewContentForm } from './ViewContentForm';
import { TImage } from '../../../types/TImage';
import { Action } from '../actions/Actions';


export type TViewMountContext = {
  refetch(): Promise<void>;
  readonly currentValue: TView;
  set<GKey extends keyof TView>(property: GKey, value: TView[GKey]): Promise<void>;
}

export type TView =
  & {
    type: 'view';
    icon?: TImage;
    title: string;
    order?: number;
    description?: string;
    position: 'primary' | 'secondary' | 'panel' | 'editor';
    viewContent: ViewContentList | ViewContentForm | ViewContentWebView;
    getTabs?: (context: TViewMountContext) => Promise<Action[]>;
    getActions?: (context: TViewMountContext) => Promise<Action[]>;
  }
  & ({ selector?: undefined } | {
    position: 'editor';
    selector: string[];
  })

export type TSerializableView = {
  key: string;
  type: 'view';
  title: string;
  selector: string[];
  icon: TImage | undefined;
  order: number | undefined;
  description: string | undefined;
  position: 'primary' | 'secondary' | 'panel' | 'editor';
  viewContent: TSerializableViewContentList | TSerializableViewContentForm | TSerializableViewContentWebView;
}
