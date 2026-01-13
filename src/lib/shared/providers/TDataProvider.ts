import { FormProvider, TSerializableFormProvider } from './FormProvider';
import { ListProvider, TSerializableListProvider } from './ListProvider';


export type TSerializableDataProvider = TSerializableListProvider | TSerializableFormProvider

export type TDataProvider = ListProvider | FormProvider
