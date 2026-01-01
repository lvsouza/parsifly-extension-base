import { TSerializableFieldViewItem } from '../components/field-view-item/TFieldViewItem';


export interface IFormProviderProps {
  key: string;
  getFields: () => Promise<TSerializableFieldViewItem[]>;
}
export class FormProvider {
  public readonly type = 'form';
  public readonly key: IFormProviderProps['key'];
  public readonly getFields: IFormProviderProps['getFields'];

  constructor(props: IFormProviderProps) {
    this.key = props.key;

    this.getFields = async () => {
      return props
        .getFields()
        .then(fields => fields.map(field => field as unknown as TSerializableFieldViewItem))
    };
  }
}
