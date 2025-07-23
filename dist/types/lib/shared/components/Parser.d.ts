import { TFileOrFolder } from '../../types/TFileOrFolder';
type TParserResult = {
    name: string;
    content: string | TFileOrFolder;
};
export type TParser = {
    key: string;
    parser: () => Promise<TParserResult>;
};
export declare class Parser {
    readonly key: TParser['key'];
    readonly parser: TParser['parser'];
    constructor(props: TParser);
}
export {};
