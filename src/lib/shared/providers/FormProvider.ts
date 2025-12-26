import { FieldViewItem } from '../components/field-view-item/FieldViewItem';


export interface IFormProviderProps {
  key: string;
  getFields: (item?: FieldViewItem) => Promise<FieldViewItem[]>;
}
export class FormProvider {
  public readonly type = 'form';
  public readonly key: IFormProviderProps['key'];
  public readonly getFields: IFormProviderProps['getFields'];

  constructor(props: IFormProviderProps) {
    this.key = props.key;

    this.getFields = async (item?: FieldViewItem | undefined) => {
      return props
        .getFields(item)
        .then(fields => fields.map(field => field as unknown as FieldViewItem))
    };
  }
}
