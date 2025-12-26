import { TSerializableCompletionViewItem } from '../shared/components/completion-view-item/TCompletionViewItem';


export type TQuickPick = {
  title: string;
  helpText?: string;
  placeholder?: string;
  /**
   * When set to true, interaction with outside elements will be disabled
   * 
   * @default false
   */
  modal?: boolean;
  /**
   * When set to true, only options available will be allowed to select
   */
  selectOnly?: boolean;
  options?: TSerializableCompletionViewItem[];
}
