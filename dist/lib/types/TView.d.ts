type TTab = {
    key: string;
    action(): Promise<void>;
};
type TAction = {
    key: string;
    action(): Promise<void>;
};
export type TView = {
    key: string;
    tabs?: TTab[];
    actions: TAction[];
};
export {};
