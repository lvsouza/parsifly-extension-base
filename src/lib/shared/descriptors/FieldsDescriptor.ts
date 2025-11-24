import { FormViewItem } from '../components/FormViewItem';


interface IFieldsDescriptorProps {
  key: string;
  onGetFields: (key: string) => Promise<FormViewItem[]>;
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
