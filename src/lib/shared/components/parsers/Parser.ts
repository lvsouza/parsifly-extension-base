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
  public readonly internalValue: NonNullable<TParserConstructor['initialValue']>;


  constructor(props: TParserConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
  }


  #createContext(mountId: string): TParserMountContext {
    return {
      currentValue: this.internalValue as TParser,
      set: async <GKey extends keyof TParser>(property: GKey, newValue: TParser[GKey]) => {
        switch (property) {
          case 'onParse':
            this.internalValue[property] = newValue;
            return;

          default:
            this.internalValue[property] = newValue;
            return await EventLink.sendEvent(`parser:${mountId}:set`, { property, newValue });
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const context = this.#createContext(mountId);

    EventLink.addEventListener(`parser:${mountId}:onParse`, async () => await this.internalValue?.onParse?.(context));

    const onDidUnmount = await this.onDidMount?.(context);

    EventLink.addEventListener(`parser:${mountId}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      EventLink.removeEventListener(`parser:${mountId}:onParse`);
      EventLink.removeEventListener(`parser:${mountId}:onDidUnmount`);
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
