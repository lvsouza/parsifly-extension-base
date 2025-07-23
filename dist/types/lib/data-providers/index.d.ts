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
        pages: (() => Promise<IPage[]>) & ((index: number) => Promise<IPage>) & {
            set: (page: IPage, index: number) => Promise<void>;
            add: ((page: IPage) => Promise<void>) & ((page: IPage, index: number) => Promise<void>);
            del: (() => Promise<void>) & ((index: number) => Promise<void>);
        };
        components: (() => Promise<IComponent[]>) & ((index: number) => Promise<IComponent>) & {
            set: (component: IComponent, index: number) => Promise<void>;
            add: ((component: IComponent) => Promise<void>) & ((component: IComponent, index: number) => Promise<void>);
            del: (() => Promise<void>) & ((index: number) => Promise<void>);
        };
        services: (() => Promise<IService[]>) & ((index: number) => Promise<IService>) & {
            set: (service: IService, index: number) => Promise<void>;
            add: ((service: IService) => Promise<void>) & ((service: IService, index: number) => Promise<void>);
            del: (() => Promise<void>) & ((index: number) => Promise<void>);
        };
    };
};
