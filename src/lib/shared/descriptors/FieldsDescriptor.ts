import { FieldDescriptor } from './FieldDescriptor';


export interface IFieldsDescriptorProps {
  key: string;
  onGetFields: (key: string) => Promise<FieldDescriptor[]>;
}
export class FieldsDescriptor {
  public readonly type = 'fields';
  public readonly key: IFieldsDescriptorProps['key'];
  public readonly onGetFields: IFieldsDescriptorProps['onGetFields'];

  constructor(props: IFieldsDescriptorProps) {
    this.key = props.key;
    this.onGetFields = async (key: string) => {
      return props
        .onGetFields(key)
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
