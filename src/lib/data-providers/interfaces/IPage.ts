import { IBase } from './IBase';


export interface IPage extends IBase<'page'> {
  /**
   * Allow us to this in folders
   */
  folders: string[];
}
