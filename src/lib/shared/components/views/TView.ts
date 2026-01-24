import { TSerializableViewContentWebView } from './TViewContentWebView';
import { TSerializableViewContentList } from './TViewContentList';
import { TSerializableViewContentForm } from './TViewContentForm';
import { ViewContentWebView } from './ViewContentWebView';
import { ViewContentList } from './ViewContentList';
import { ViewContentForm } from './ViewContentForm';
import { TImage } from '../../../types/TImage';
import { Action } from '../actions/Actions';


export type TViewContentDefault = ViewContentList | ViewContentForm | ViewContentWebView;

export type TViewPosition = 'primary' | 'secondary' | 'panel' | 'editor';

export type TViewMountContext<GViewContent extends TViewContentDefault> = {
  refetch(): Promise<void>;
  readonly customData: unknown;
  readonly currentValue: TView<GViewContent>;
  set<GKey extends keyof TView<GViewContent>>(property: GKey, value: TView<GViewContent>[GKey]): Promise<void>;
};

type TViewBase<GViewContent extends TViewContentDefault> = {
  type: 'view';
  icon?: TImage;
  title: string;
  order?: number;
  description?: string;
  viewContent: GViewContent;
  getTabs?: (context: TViewMountContext<GViewContent>) => Promise<Action[]>;
  getActions?: (context: TViewMountContext<GViewContent>) => Promise<Action[]>;
};

type TViewWindowOptions =
  | { allowWindow?: false | undefined; window?: undefined }
  | {
    allowWindow: true;
    window?: {
      width?: boolean;
      height?: boolean;
      resizable?: boolean;
      draggable?: boolean;
      anchor?: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center-center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    };
  };


export type TView<GViewContent extends TViewContentDefault> =
  & (
    | (TViewBase<GViewContent> & {
      allowedPositions?: Exclude<TViewPosition, 'editor'>[];
      position: Exclude<TViewPosition, 'editor'>;
      selector?: undefined;
    })
    | (TViewBase<GViewContent> & {
      position: 'editor';
      selector: string[];
      allowedPositions?: ['editor'];
    })
  )
  & TViewWindowOptions;

export type TSerializableView = {
  key: string;
  type: 'view';
  title: string;
  position: TViewPosition;
  icon: TImage | undefined;
  order: number | undefined;
  selector: string[] | undefined;
  description: string | undefined;
  allowWindow: boolean | undefined;
  allowedPositions: TViewPosition[] | undefined;
  viewContent: TSerializableViewContentList | TSerializableViewContentForm | TSerializableViewContentWebView;
  window: undefined | {
    width: boolean | undefined;
    height: boolean | undefined;
    resizable: boolean | undefined;
    draggable: boolean | undefined;
    anchor: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center-center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | undefined;
  };
};
