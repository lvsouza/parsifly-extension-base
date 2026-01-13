import { TContextMenuItem, TSerializableContextMenuItem } from './TContextMenuItem';
import { EventLink } from '../../services/EventLink';


export type TContextMenuItemConstructor = {
  key: string;
  initialValue?: Partial<TContextMenuItem>;
}

export class ContextMenuItem {
  public readonly key: TContextMenuItemConstructor['key'];
  public readonly internalValue: NonNullable<Partial<TContextMenuItemConstructor['initialValue']>>;

  constructor(props: TContextMenuItemConstructor) {
    this.key = props.key;
    this.internalValue = props.initialValue || {};
  }

  public register() {
    if (this.internalValue.onClick) EventLink.setExtensionEvent(`contextMenuItem:${this.key}:onClick`, this.internalValue.onClick);
  }

  public unregister() {
    EventLink.removeExtensionEvent(`contextMenuItem:${this.key}:onClick`);
  }

  public serialize(): TSerializableContextMenuItem {
    if (!this.internalValue.label) throw new Error(`Label not defined for "${this.key}" context menu item`);

    return {
      key: this.key,
      icon: this.internalValue.icon,
      label: this.internalValue.label,
      description: this.internalValue.description,
    };
  }
}
