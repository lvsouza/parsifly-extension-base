import { FormViewItem } from '../components/FormViewItem';


interface IFormProviderProps {
  key: string;
  getFields: (item?: FormViewItem) => Promise<FormViewItem[]>;
}
export class FormProvider {
  public readonly type = 'form';
  public readonly key: IFormProviderProps['key'];
  public readonly getFields: IFormProviderProps['getFields'];

  constructor(props: IFormProviderProps) {
    this.key = props.key;

    this.getFields = async (item?: FormViewItem | undefined) => {
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
