import { IBase } from './IBase';


export interface IStructureAttribute extends IBase<'structure_attribute'> {
  /**
   * Store the attributes reference
   */
  attributes: IStructureAttribute[];
}
