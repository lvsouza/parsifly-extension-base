import { TImage } from '../../../types/TImage';
import { Action } from '../actions/Actions';


export type TEditorContext = {
  reload(): Promise<void>;
  sendMessage(...values: unknown[]): Promise<unknown>;
  set<GKey extends keyof TEditor>(property: GKey, value: TEditor[GKey]): Promise<void>;
}

export type TEditor = {
  icon?: TImage;
  type: 'editor';
  title: string;
  position: 'center';
  selector: string[];
  description?: string;
  getActions?: (context: TEditorContext) => Promise<Action[]>;
  onDidMessage: (context: TEditorContext, ...values: unknown[]) => Promise<unknown>;
  entryPoint: {
    basePath: string;
    file: string;
  };
}

export type TSerializableEditor = {
  key: string;
  type: 'editor';
  title: string;
  position: 'center';
  selector: string[];
  icon: TImage | undefined;
  description: string | undefined;
  entryPoint: {
    basePath: string;
    file: string;
  };
}