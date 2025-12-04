import { TFileOrFolder } from '../../types/TFileOrFolder';
import { TOnDidMount } from '../../types/TOnDidMount';
import { EventLink } from '../services/EventLink';


export type TParserResult = {
  name: string;
  content: string | TFileOrFolder;
}

export type TParser = {
  label: string;
  icon?: string;
  description?: string;
  onParse: () => Promise<TParserResult>;
}

type TParserMountContext = {
  set<GKey extends keyof TParser>(property: GKey, value: TParser[GKey]): Promise<void>;
}
export type TParserConstructor = {
  key: string;
  initialValue?: Partial<TParser>,
  onDidMount?: TOnDidMount<TParserMountContext>;
}
export class Parser {

  public readonly key: TParserConstructor['key'];
  public readonly onDidMount: TParserConstructor['onDidMount'];
  public readonly internalValue: NonNullable<Partial<TParserConstructor['initialValue']>>;

  constructor(props: TParserConstructor) {
    this.key = props.key;
    this.register = this.register;
    this.unregister = this.unregister;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
  }


  async #onDidMount(): Promise<void> {
    EventLink.setExtensionEvent(`parser:${this.key}:onParse`, async () => this.internalValue?.onParse?.());

    this.onDidMount?.({
      set: async <GKey extends keyof TParser>(property: GKey, newValue: TParser[GKey]) => {
        switch (property) {
          case 'onParse':
            this.internalValue[property] = newValue;
            return;

          default:
            this.internalValue[property] = newValue;
            return await EventLink.callStudioEvent(`parser:${this.key}:set`, { property, newValue });
        }
      },
      onDidUnmount: (didUnmount) => {
        const didUnmountAndRemoveEventListener = async () => {
          await didUnmount();

          EventLink.removeExtensionEvent(`parser:${this.key}:onParse`);
        }

        EventLink.setExtensionEvent(`parser:${this.key}:onDidUnmount`, didUnmountAndRemoveEventListener);
      },
    });
  }


  public register() {
    EventLink.setExtensionEvent(`parser:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeExtensionEvent(`parser:${this.key}:onParse`)
    EventLink.removeExtensionEvent(`parser:${this.key}:onDidMount`);
    EventLink.removeExtensionEvent(`parser:${this.key}:onDidUnmount`);
  }
}
