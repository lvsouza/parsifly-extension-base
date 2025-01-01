import { TFileOrFolder } from './TFileOrFolder';
export type TParser = {
    key: string;
    parser: (project: any) => Promise<string | TFileOrFolder>;
};
