import { FieldDescriptor } from '../descriptors/FieldDescriptor';


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
        .then(fields => {
          return fields.map(field => ({
            ...field,
            getValue: undefined,
            onDidChange: undefined,
          }))
        })
    };
  }
}
