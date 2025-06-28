import { Action } from './Action';


interface IEditorProps {
  key: string;
  actions?: Action[];
}
export class Editor {
  public readonly key: IEditorProps['key'];
  public readonly actions: IEditorProps['actions'];

  constructor(props: IEditorProps) {
    this.key = props.key;
    this.actions = props.actions;
  }
}
