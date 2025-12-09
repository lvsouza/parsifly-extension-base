import { IComponent } from './IComponent';
import { IStructure } from './IStructure';
import { IAction } from './IAction';
import { IBase } from './IBase';
import { IPage } from './IPage';


export interface IFolder<GContentType extends IPage | IComponent | IAction | IStructure = IPage | IComponent | IAction | IStructure> extends IBase<'folder'> {
  /**
   * Can container others @type {IFolder} or @type {GContentType}
   */
  content: (IFolder<GContentType> | GContentType)[];
}
