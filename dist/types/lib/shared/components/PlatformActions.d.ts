type TBaseAction = {
    key: string;
};
type TSingleAction = {
    action(): Promise<void>;
};
type TMultiAction = {
    actions: (TBaseAction & TSingleAction)[];
};
export type TPlatformAction = TBaseAction & (TSingleAction | TMultiAction);
export declare class PlatformAction {
    key: TPlatformAction['key'];
    action?: TSingleAction['action'];
    actions?: TMultiAction['actions'];
    constructor(props: TPlatformAction);
    isSingle(): this is TBaseAction & TSingleAction;
    isMulti(): this is TBaseAction & TMultiAction;
}
export {};
