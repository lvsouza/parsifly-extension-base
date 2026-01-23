import { TSerializableViewContentWebView } from './TViewContentWebView';
import { TSerializableViewContentList } from './TViewContentList';
import { TSerializableViewContentForm } from './TViewContentForm';
import { ViewContentWebView } from './ViewContentWebView';
import { ViewContentList } from './ViewContentList';
import { ViewContentForm } from './ViewContentForm';
import { TImage } from '../../../types/TImage';
import { Action } from '../actions/Actions';


export type TViewContentDefault = ViewContentList | ViewContentForm | ViewContentWebView;

export type TViewPositionDefault = 'primary' | 'secondary' | 'panel' | 'editor';

export type TViewMountContext<GViewContent extends TViewContentDefault> =
  & {
    refetch(): Promise<void>;
    readonly customData: unknown;
    readonly currentValue: TView<GViewContent>;
    set<GKey extends keyof TView<GViewContent>>(property: GKey, value: TView<GViewContent>[GKey]): Promise<void>;
  }

export type TView<GViewContent extends TViewContentDefault> =
  & {
    type: 'view';
    icon?: TImage;
    title: string;
    order?: number;
    description?: string;
    viewContent: GViewContent;
    position: TViewPositionDefault;
    getTabs?: (context: TViewMountContext<GViewContent>) => Promise<Action[]>;
    getActions?: (context: TViewMountContext<GViewContent>) => Promise<Action[]>;
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
  position: TViewPositionDefault;
  description: string | undefined;
  viewContent: TSerializableViewContentList | TSerializableViewContentForm | TSerializableViewContentWebView;
}
