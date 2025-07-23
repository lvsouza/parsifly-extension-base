interface IActionProps {
    key: string;
    action(): Promise<void>;
}
export declare class Action {
    readonly key: IActionProps['key'];
    readonly action: IActionProps['action'];
    constructor(props: IActionProps);
}
export {};
