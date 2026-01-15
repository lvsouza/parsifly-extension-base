import { TSerializableFieldViewItem } from '../components/field-view-item/TFieldViewItem';
import { FieldViewItem } from '../components/field-view-item/FieldViewItem';
import { EventLink } from '../services/EventLink';


export type TSerializableFormProvider = {
  key: string;
  type: 'form';
}

export interface IFormProviderProps {
  key: string;
  getFields: () => Promise<(TSerializableFieldViewItem | FieldViewItem)[]>;
}
export class FormProvider {
  public readonly type = 'form';
  public readonly key: IFormProviderProps['key'];
  public readonly getFields: () => Promise<TSerializableFieldViewItem[]>;

  #registered: Set<FieldViewItem> = new Set();

  constructor(props: IFormProviderProps) {
    this.key = props.key;

    this.getFields = async () => {
      return props
        .getFields()
        .then(fields => fields.map(field => {

          this.#registered.forEach((item) => item.unregister());
          this.#registered.clear();

          if (field instanceof FieldViewItem) {
            field.register();
            this.#registered.add(field);
            return field.serialize();
          }

          return field;
        }));
    };
  }

  public register() {
    EventLink.addEventListener(`dataProvider:${this.key}:getFields`, this.getFields);
  }

  public unregister() {
    EventLink.removeEventListener(`dataProvider:${this.key}:getFields`);

    this.#registered.forEach((item) => item.unregister());
    this.#registered.clear();
  }

  public serialize(): TSerializableFormProvider {
    return {
      key: this.key,
      type: this.type,
    };
  }
}
