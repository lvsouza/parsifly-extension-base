import { EventLink } from '../shared/services/EventLink';
import { IComponent } from './interfaces/IComponent';
import { IProject } from './interfaces/IProject';
import { IService } from './interfaces/IService';
import { IPage } from './interfaces/IPage';
export declare const createDataProviders: (eventLink: EventLink) => {
    /**
     * Allow you to call a custom command from application
     *
     * @param key Name of the command
     * @param args List of arguments to be forwarded to the command call
     */
    readonly callCustomDataProvider: <GParam = unknown, GReturn = unknown>(key: string, ...args: GParam[]) => Promise<GReturn>;
    /**
     * Allow you to get the entire project object or get parts with ...project.pages(), .services(), .components() and more.
     */
    readonly project: (() => Promise<IProject<"application" | "package">>) & {
        set: (project: IProject<"application" | "package">) => Promise<void>;
        pages: ((index?: number) => Promise<IPage | IPage[]>) & {
            set: (page: IPage, index: number) => Promise<void>;
            add: (page: IPage, index?: number) => Promise<void>;
            del: (index?: number) => Promise<void>;
        };
        components: ((index?: number) => Promise<IComponent | IComponent[]>) & {
            set: (component: IComponent, index: number) => Promise<void>;
            add: (component: IComponent, index?: number) => Promise<void>;
            del: (index?: number) => Promise<void>;
        };
        services: ((index?: number) => Promise<IService | IService[]>) & {
            set: (service: IService, index: number) => Promise<void>;
            add: (service: IService, index?: number) => Promise<void>;
            del: (index?: number) => Promise<void>;
        };
    };
};
