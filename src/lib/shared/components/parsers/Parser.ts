import { TParser, TParserMountContext, TSerializableParser } from './TParser';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';


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
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
  }


  readonly #context: TParserMountContext = {
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
  };


  async #onDidMount(): Promise<void> {
    EventLink.setExtensionEvent(`parser:${this.key}:onParse`, async () => await this.internalValue?.onParse?.(this.#context));

    if (this.onDidMount) {
      await this.onDidMount?.({
        ...this.#context,
        onDidUnmount: (didUnmount) => {
          const didUnmountAndRemoveEventListener = async () => {
            await didUnmount();

            EventLink.removeExtensionEvent(`parser:${this.key}:onParse`);
          }

          EventLink.setExtensionEvent(`parser:${this.key}:onDidUnmount`, didUnmountAndRemoveEventListener);
        },
      });
    } else {
      EventLink.setExtensionEvent(`parser:${this.key}:onDidUnmount`, async () => { });
    }
  }


  public register() {
    EventLink.setExtensionEvent(`parser:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeExtensionEvent(`parser:${this.key}:onParse`)
    EventLink.removeExtensionEvent(`parser:${this.key}:onDidMount`);
    EventLink.removeExtensionEvent(`parser:${this.key}:onDidUnmount`);
  }

  public serialize(): TSerializableParser {
    if (!this.internalValue.label) throw new Error(`Label not defined for "${this.key}" parser`);

    return {
      key: this.key,
      icon: this.internalValue.icon,
      label: this.internalValue.label,
      description: this.internalValue.description,
    };
  }
}
