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
          return await EventLink.sendEvent(`parser:${this.key}:set`, { property, newValue });
      }
    },
  };


  async #onDidMount(): Promise<void> {
    EventLink.addEventListener(`parser:${this.key}:onParse`, async () => await this.internalValue?.onParse?.(this.#context));

    const onDidUnmount = await this.onDidMount?.(this.#context);

    EventLink.addEventListener(`parser:${this.key}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      EventLink.removeEventListener(`parser:${this.key}:onParse`);
      EventLink.removeEventListener(`parser:${this.key}:onDidUnmount`);
    });
  }


  public register() {
    EventLink.addEventListener(`parser:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeEventListener(`parser:${this.key}:onDidMount`);
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
