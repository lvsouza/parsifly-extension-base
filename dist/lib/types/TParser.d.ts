import { TFileOrFolder } from './TFileOrFolder';
export type TParser = {
    key: string;
    parser: () => Promise<string | TFileOrFolder>;
};
