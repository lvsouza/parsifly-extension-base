import { IComponent } from './IComponent';
import { IService } from './IService';
import { IBase } from './IBase';
import { IPage } from './IPage';


export interface IFolder<GContentType extends IPage | IComponent | IService = IPage | IComponent | IService> extends IBase<'folder'> {
  /**
   * Can container others @type {IFolder} or @type {GContentType}
   */
  content: (IFolder<GContentType> | GContentType)[];
}
