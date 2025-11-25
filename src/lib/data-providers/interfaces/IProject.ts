import { IComponent } from './IComponent';
import { IService } from './IService';
import { IPage } from './IPage';
import { IBase } from './IBase';


export type TProjectType = 'application' | 'package';

export interface IProject<GType extends TProjectType> extends IBase<GType> {
  /**
   * Version of the package
   */
  version: string;
  /**
   * Used to define if this record is public or not
   */
  public: boolean;
  /**
   * Used to list all pages of the project
   */
  pages: IPage[];
  /**
   * Used to list all components of the project
   */
  components: IComponent[];
  /**
   * Used to list all services of the project
   */
  services: IService[];
}
