import { IStructureAttribute } from './IStructureAttribute';
import { IComponent } from './IComponent';
import { IStructure } from './IStructure';
import { IProject } from './IProject';
import { IAction } from './IAction';
import { IFolder } from './IFolder';
import { IPage } from './IPage';


export type TAllTypes = IProject | IPage | IComponent | IAction | IFolder | IStructure | IStructureAttribute;

export type TAllResourceTypes = IProject['type'] | IPage['type'] | IComponent['type'] | IAction['type'] | IFolder['type'] | IStructure['type'] | IStructureAttribute['type']
