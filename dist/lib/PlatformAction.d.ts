export interface IPlatformAction {
    key: string;
    action: (() => void);
}
