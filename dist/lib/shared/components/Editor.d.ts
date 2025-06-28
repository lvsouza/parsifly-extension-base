import { Action } from './Action';
interface IEditorProps {
    key: string;
    actions?: Action[];
}
export declare class Editor {
    readonly key: IEditorProps['key'];
    readonly actions: IEditorProps['actions'];
    constructor(props: IEditorProps);
}
export {};
