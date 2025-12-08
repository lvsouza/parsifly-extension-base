import { TIcon } from '../../types/TIcon';


export type TContextMenuItem = {
  /** Identifier */
  key: string;
  icon?: TIcon;
  /** Label, main information for the record  */
  label: string;
  /** Details of the record */
  description?: string;
  onClick: () => Promise<void>;
}

export class ContextMenuItem {
  public readonly key: TContextMenuItem['key'];
  public readonly icon: TContextMenuItem['icon'];
  public readonly label: TContextMenuItem['label'];
  public readonly onClick: TContextMenuItem['onClick'];
  public readonly description?: TContextMenuItem['description'];

  constructor(props: TContextMenuItem) {
    this.key = props.key;
    this.icon = props.icon;
    this.label = props.label;
    this.description = props.description;

    this.onClick = props.onClick;
  }
}
