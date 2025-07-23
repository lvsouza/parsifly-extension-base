import { IBase } from './IBase';
export interface IService extends IBase<'service'> {
    /**
     * Allow us to this in folders
     */
    folders: string[];
}
