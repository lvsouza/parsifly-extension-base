import { FieldDescriptor } from '../descriptors/fields/FieldDescriptor';


export interface IFormProviderProps {
  key: string;
  getFields: (item?: FieldDescriptor) => Promise<FieldDescriptor[]>;
}
export class FormProvider {
  public readonly type = 'form';
  public readonly key: IFormProviderProps['key'];
  public readonly getFields: IFormProviderProps['getFields'];

  constructor(props: IFormProviderProps) {
    this.key = props.key;

    this.getFields = async (item?: FieldDescriptor | undefined) => {
      return props
        .getFields(item)
        .then(fields => fields.map(field => field as unknown as FieldDescriptor))
    };
  }
}
