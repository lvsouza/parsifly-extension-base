import { TSerializableViewContentForm, TViewContentForm, TViewContentFormContext } from './TViewContentForm';
import { FieldViewItem } from '../field-view-item/FieldViewItem';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';


export type TViewContentFormConstructor = {
  key: string;
  initialValue?: Partial<TViewContentForm>,
  onDidMount?: TOnDidMount<TViewContentFormContext>;
}

export class ViewContentForm {
  public readonly registerId: string;
  public readonly key: TViewContentFormConstructor['key'];
  public readonly onDidMount: TViewContentFormConstructor['onDidMount'];
  public readonly defaultValue: NonNullable<TViewContentFormConstructor['initialValue']>;


  constructor(props: TViewContentFormConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.registerId = crypto.randomUUID();
    this.defaultValue = props.initialValue || {};
    this.defaultValue.type = 'viewContentForm';
  }


  #createContext(internalValue: typeof this.defaultValue, mountId: string): TViewContentFormContext {
    return {
      currentValue: internalValue as TViewContentForm,
      refetch: async () => {
        return await EventLink.sendEvent(`viewContentForm:${mountId}:refetch`);
      },
      set: async <GKey extends keyof TViewContentForm>(property: GKey, newValue: TViewContentForm[GKey]) => {
        switch (property) {
          case 'getFields':
            internalValue[property] = newValue;
            return;

          default:
            internalValue[property] = newValue;
            return await EventLink.sendEvent(`viewContentForm:${mountId}:set`, { property, newValue });
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const internalValue = this.defaultValue;

    const context = this.#createContext(internalValue, mountId);

    const registeredFields = new Set<FieldViewItem>();
    EventLink.addEventListener(`viewContentForm:${mountId}:getFields`, async () => {
      const fields = await internalValue.getFields?.(context) || [];

      registeredFields.forEach((item) => item.unregister());
      registeredFields.clear();

      for (const field of fields) {
        if (!(field instanceof FieldViewItem)) continue;

        field.register();
        registeredFields.add(field);
      }

      return fields.map(item => item instanceof FieldViewItem ? item.serialize() : item);
    });

    const onDidUnmount = await this.onDidMount?.(context);

    EventLink.addEventListener(`viewContentForm:${mountId}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      registeredFields.forEach((item) => item.unregister());
      registeredFields.clear();

      EventLink.removeEventListener(`viewContentForm:${mountId}:getFields`);
      EventLink.removeEventListener(`viewContentForm:${mountId}:onDidUnmount`);
    });
  }


  public register() {
    EventLink.addEventListener(`viewContentForm:${this.registerId}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeEventListener(`viewContentForm:${this.registerId}:onDidMount`);
  }

  public serialize(): TSerializableViewContentForm {
    if (!this.defaultValue.getFields) throw new Error(`Get fields not defined for "${this.key}" view content form`);

    return {
      key: this.key,
      type: 'viewContentForm',
      registerId: this.registerId,
    };
  }
}
