import { IBase } from './IBase';


export interface IComponent extends IBase<'component'> {
  /**
   * Allow us to this in folders
   */
  folders: string[];
}
