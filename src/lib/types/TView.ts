


type TAction = {
  key: string;
  action(): Promise<void>;
}

export type TView = {
  key: string;
  actions: TAction[]
}
