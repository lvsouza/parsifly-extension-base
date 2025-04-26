


type TAction = {
  key: string;
  action(): Promise<void>;
}

export type TView = {
  key: string;
  type: 'list-view',
  actions: TAction[]
}
