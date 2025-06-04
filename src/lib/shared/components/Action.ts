
interface IActionProps {
  key: string;
  action(): Promise<void>;
}
export class Action {
  public readonly key: IActionProps['key'];
  public readonly action: IActionProps['action'];

  constructor(props: IActionProps) {
    this.key = props.key;
    this.action = props.action;
  }
}
