import { TParser, TParserMountContext, TSerializableParser } from './TParser';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';


export type TParserConstructor = {
  key: string;
  initialValue?: Partial<TParser>,
  onDidMount?: TOnDidMount<TParserMountContext>;
}
export class Parser {
  public readonly registerId: string;
  public readonly key: TParserConstructor['key'];
  public readonly onDidMount: TParserConstructor['onDidMount'];
  public readonly defaultValue: NonNullable<TParserConstructor['initialValue']>;


  constructor(props: TParserConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.registerId = crypto.randomUUID();
    this.defaultValue = props.initialValue || {};
  }


  #createContext(internalValue: typeof this.defaultValue, mountId: string): TParserMountContext {
    return {
      currentValue: internalValue as TParser,
      set: async <GKey extends keyof TParser>(property: GKey, newValue: TParser[GKey]) => {
        switch (property) {
          case 'onParse':
            internalValue[property] = newValue;
            return;

          default:
            internalValue[property] = newValue;
            return await EventLink.sendEvent(`parser:${mountId}:set`, { property, newValue });
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const internalValue = this.defaultValue;

    const context = this.#createContext(internalValue, mountId);

    EventLink.addEventListener(`parser:${mountId}:onParse`, async () => await internalValue?.onParse?.(context));

    const onDidUnmount = await this.onDidMount?.(context);

    EventLink.addEventListener(`parser:${mountId}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      EventLink.removeEventListener(`parser:${mountId}:onParse`);
      EventLink.removeEventListener(`parser:${mountId}:onDidUnmount`);
    });
  }


  public register() {
    EventLink.addEventListener(`parser:${this.registerId}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeEventListener(`parser:${this.registerId}:onDidMount`);
  }

  public serialize(): TSerializableParser {
    if (!this.defaultValue.label) throw new Error(`Label not defined for "${this.key}" parser`);

    return {
      key: this.key,
      registerId: this.registerId,
      icon: this.defaultValue.icon,
      label: this.defaultValue.label,
      description: this.defaultValue.description,
    };
  }
}
