import { EventLink } from '../shared/services/EventLink';
import { IComponent } from './interfaces/IComponent';
import { IProject } from './interfaces/IProject';
import { IService } from './interfaces/IService';
import { IPage } from './interfaces/IPage';



export const createDataProviders = (eventLink: EventLink) => {
  return {
    /**
     * Allow you to call a custom command from application
     * 
     * @param key Name of the command
     * @param args List of arguments to be forwarded to the command call
     */
    callCustomDataProvider: async <GParam = unknown, GReturn = unknown>(key: string, ...args: GParam[]): Promise<GReturn> => {
      return await eventLink.callStudioEvent(key, ...args);
    },
    /**
     * Allow you to get the entire project object or get parts with ...project.pages(), .services(), .components() and more.
     */
    project: Object.assign(
      async (): Promise<IProject<'application' | 'package'>> => {
        return await eventLink.callStudioEvent<void, IProject<'application' | 'package'>>('project:get');
      },
      {
        set: async (project: IProject<'application' | 'package'>): Promise<void> => {
          return await eventLink.callStudioEvent<IProject<'application' | 'package'>, void>('project:set', project);
        },

        pages: Object.assign(
          async (index?: number): Promise<IPage | IPage[]> => {
            return await eventLink.callStudioEvent<number | undefined, IPage | IPage[]>('project.pages:get', index);
          },
          {
            set: async (page: IPage, index: number): Promise<void> => {
              return await eventLink.callStudioEvent<IPage | number | undefined, void>('project.pages:set', page, index);
            },
            add: async (page: IPage, index?: number): Promise<void> => {
              return await eventLink.callStudioEvent<IPage | number | undefined, void>('project.pages:add', page, index);
            },
            del: async (index?: number): Promise<void> => {
              return await eventLink.callStudioEvent<number | undefined, void>('project.pages:del', index);
            },
          }
        ),
        components: Object.assign(
          async (index?: number): Promise<IComponent | IComponent[]> => {
            return await eventLink.callStudioEvent<number | undefined, IComponent | IComponent[]>('project.components:get', index);
          },
          {
            set: async (component: IComponent, index: number): Promise<void> => {
              return await eventLink.callStudioEvent<IComponent | number | undefined, void>('project.components:set', component, index);
            },
            add: async (component: IComponent, index?: number): Promise<void> => {
              return await eventLink.callStudioEvent<IComponent | number | undefined, void>('project.components:add', component, index);
            },
            del: async (index?: number): Promise<void> => {
              return await eventLink.callStudioEvent<number | undefined, void>('project.components:del', index);
            },
          }
        ),
        services: Object.assign(
          async (index?: number): Promise<IService | IService[]> => {
            return await eventLink.callStudioEvent<number | undefined, IService | IService[]>('project.services:get', index);
          },
          {
            set: async (service: IService, index: number): Promise<void> => {
              return await eventLink.callStudioEvent<IService | number | undefined, void>('project.services:set', service, index);
            },
            add: async (service: IService, index?: number): Promise<void> => {
              return await eventLink.callStudioEvent<IService | number | undefined, void>('project.services:add', service, index);
            },
            del: async (index?: number): Promise<void> => {
              return await eventLink.callStudioEvent<number | undefined, void>('project.services:del', index);
            },
          }
        ),
      }
    ),
  } as const;
}
