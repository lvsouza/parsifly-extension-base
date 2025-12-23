import { TFieldDescriptor, TFieldDescriptorMountContext, TFieldDescriptorValue } from './TFieldDescriptor';
import { TOnDidMount } from '../../types/TOnDidMount';
import { EventLink } from '../services/EventLink';


export type TFieldDescriptorConstructor = {
  key: string;
  initialValue?: Partial<TFieldDescriptor>;
  onDidMount?: TOnDidMount<TFieldDescriptorMountContext>;
}
export class FieldDescriptor {
  public readonly key: TFieldDescriptorConstructor['key'];
  public readonly onDidMount: TFieldDescriptorConstructor['onDidMount'];
  public readonly internalValue: NonNullable<Partial<TFieldDescriptorConstructor['initialValue']>>;


  constructor(props: TFieldDescriptorConstructor) {
    this.key = props.key;
    this.unregister = this.unregister;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
  }


  readonly #context: TFieldDescriptorMountContext = {
    reloadValue: async () => {
      return await EventLink.callStudioEvent(`fieldDescriptor:${this.key}:refetchChildren`);
    },
    set: async <GKey extends keyof TFieldDescriptor>(property: GKey, newValue: TFieldDescriptor[GKey]) => {
      switch (property) {
        case 'getValue':
        case 'onDidChange':
          this.internalValue[property] = newValue;
          return;

        default:
          this.internalValue[property] = newValue;
          return await EventLink.callStudioEvent(`fieldDescriptor:${this.key}:set`, { property, newValue });
      }
    },
  };

  #mountId: string | undefined;
  #onDidUnmount: ((checkMountId: string) => Promise<void>) = async () => { };

  async #onDidMount(mountId: string): Promise<void> {
    if (this.#mountId) {
      await this.#onDidUnmount(this.#mountId);
      this.#mountId = mountId;
    }

    EventLink.setExtensionEvent(`fieldDescriptor:${this.key}:getValue`, async () => this.internalValue.getValue?.(this.#context));
    EventLink.setExtensionEvent(`fieldDescriptor:${this.key}:onDidChange`, async (value) => this.internalValue.onDidChange?.(value as TFieldDescriptorValue, this.#context));


    if (this.onDidMount) {
      this.onDidMount?.({
        ...this.#context,
        onDidUnmount: (didUnmount) => {
          this.#onDidUnmount = async (checkMountId) => {
            if (checkMountId !== this.#mountId) return;
            this.#mountId = undefined;

            await didUnmount();

            EventLink.removeExtensionEvent(`fieldDescriptor:${this.key}:getValue`);
            EventLink.removeExtensionEvent(`fieldDescriptor:${this.key}:onDidChange`);
            EventLink.removeExtensionEvent(`fieldDescriptor:${this.key}:onDidUnmount`);
          }

          EventLink.setExtensionEvent(`fieldDescriptor:${this.key}:onDidUnmount`, this.#onDidUnmount);
        },
      });
    } else {
      EventLink.setExtensionEvent(`fieldDescriptor:${this.key}:onDidUnmount`, async () => { });
    }
  }


  public register() {
    EventLink.setExtensionEvent(`fieldDescriptor:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeExtensionEvent(`fieldDescriptor:${this.key}:getValue`);
    EventLink.removeExtensionEvent(`fieldDescriptor:${this.key}:onDidMount`);
    EventLink.removeExtensionEvent(`fieldDescriptor:${this.key}:onDidChange`);
    EventLink.removeExtensionEvent(`fieldDescriptor:${this.key}:onDidUnmount`);
  }

  public serialize() {
    return {
      key: this.key,
      icon: this.internalValue.icon,
      name: this.internalValue.name,
      type: this.internalValue.type,
      label: this.internalValue.label,
      disabled: this.internalValue.disabled,
      description: this.internalValue.description,
      defaultValue: this.internalValue.defaultValue,
    };
  }
}
