import { IComponent } from './IComponent';
import { IAction } from './IAction';
import { IBase } from './IBase';
import { IPage } from './IPage';


export interface IFolder<GContentType extends IPage | IComponent | IAction = IPage | IComponent | IAction> extends IBase<'folder'> {
  /**
   * Can container others @type {IFolder} or @type {GContentType}
   */
  content: (IFolder<GContentType> | GContentType)[];
}
