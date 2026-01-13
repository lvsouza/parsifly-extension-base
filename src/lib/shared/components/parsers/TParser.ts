import { TFileOrFolder } from '../../../types/TFileOrFolder';
import { TImage } from '../../../types/TImage';


export type TParserResult = {
  name: string;
  content: string | TFileOrFolder;
}

export type TParserMountContext = {
  set<GKey extends keyof TParser>(property: GKey, value: TParser[GKey]): Promise<void>;
}

export type TParser = {
  icon?: TImage;
  label: string;
  description?: string;
  onParse: (context: TParserMountContext) => Promise<TParserResult>;
}

export type TSerializableParser = {
  key: string;
  label: string;
  icon: TImage | undefined;
  description: string | undefined;
}
