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
export {};
