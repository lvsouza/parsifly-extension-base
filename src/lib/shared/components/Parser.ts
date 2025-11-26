import { TFileOrFolder } from '../../types/TFileOrFolder';


export type TParserResult = {
  name: string;
  content: string | TFileOrFolder;
}

export type TParser = {
  key: string;
  parser: () => Promise<TParserResult>;
}
export class Parser {
  public readonly key: TParser['key'];
  public readonly parser: TParser['parser'];

  constructor(props: TParser) {
    this.key = props.key;
    this.parser = props.parser;
  }
}
