export type TBaseAction = {
  key: string;
};

export type TSingleAction = {
  action(): Promise<void>;
};

export type TMultiAction = {
  actions: (TBaseAction & TSingleAction)[];
};

export type TPlatformAction = TBaseAction & (TSingleAction | TMultiAction);

export class PlatformAction {
  key: TPlatformAction['key'];
  action?: TSingleAction['action'];
  actions?: TMultiAction['actions'];

  constructor(props: TPlatformAction) {
    this.key = props.key;

    if ('action' in props) {
      this.action = props.action;
    }

    if ('actions' in props) {
      this.actions = props.actions;
    }
  }

  isSingle(): this is TBaseAction & TSingleAction {
    return typeof this.action === 'function';
  }

  isMulti(): this is TBaseAction & TMultiAction {
    return Array.isArray(this.actions);
  }
}
