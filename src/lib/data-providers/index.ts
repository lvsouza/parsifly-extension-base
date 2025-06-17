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
          async (): Promise<IPage[]> => {
            return await eventLink.callStudioEvent<void, IPage[]>('project.pages:get');
          },
          async (index: number): Promise<IPage> => {
            return await eventLink.callStudioEvent<number, IPage>('project.pages:get', index);
          },
          {
            set: async (page: IPage, index: number): Promise<void> => {
              return await eventLink.callStudioEvent<IPage | number, void>('project.pages:set', page, index);
            },
            add: Object.assign(
              async (page: IPage): Promise<void> => {
                return await eventLink.callStudioEvent<IPage, void>('project.pages:add', page);
              },
              async (page: IPage, index: number): Promise<void> => {
                return await eventLink.callStudioEvent<IPage | number, void>('project.pages:add', page, index);
              },
            ),
            del: Object.assign(
              async (): Promise<void> => {
                return await eventLink.callStudioEvent<void, void>('project.pages:del');
              },
              async (index: number): Promise<void> => {
                return await eventLink.callStudioEvent<number, void>('project.pages:del', index);
              },
            )
          }
        ),
        components: Object.assign(
          async (): Promise<IComponent[]> => {
            return await eventLink.callStudioEvent<void, IComponent[]>('project.components:get');
          },
          async (index: number): Promise<IComponent> => {
            return await eventLink.callStudioEvent<number, IComponent>('project.components:get', index);
          },
          {
            set: async (component: IComponent, index: number): Promise<void> => {
              return await eventLink.callStudioEvent<IComponent | number, void>('project.components:set', component, index);
            },
            add: Object.assign(
              async (component: IComponent): Promise<void> => {
                return await eventLink.callStudioEvent<IComponent, void>('project.components:add', component);
              },
              async (component: IComponent, index: number): Promise<void> => {
                return await eventLink.callStudioEvent<IComponent | number, void>('project.components:add', component, index);
              },
            ),
            del: Object.assign(
              async (): Promise<void> => {
                return await eventLink.callStudioEvent<void, void>('project.components:del');
              },
              async (index: number): Promise<void> => {
                return await eventLink.callStudioEvent<number, void>('project.components:del', index);
              },
            )
          }
        ),
        services: Object.assign(
          async (): Promise<IService[]> => {
            return await eventLink.callStudioEvent<void, IService[]>('project.services:get');
          },
          async (index: number): Promise<IService> => {
            return await eventLink.callStudioEvent<number, IService>('project.services:get', index);
          },
          {
            set: async (service: IService, index: number): Promise<void> => {
              return await eventLink.callStudioEvent<IService | number, void>('project.services:set', service, index);
            },
            add: Object.assign(
              async (service: IService): Promise<void> => {
                return await eventLink.callStudioEvent<IService, void>('project.services:add', service);
              },
              async (service: IService, index: number): Promise<void> => {
                return await eventLink.callStudioEvent<IService | number, void>('project.services:add', service, index);
              },
            ),
            del: Object.assign(
              async (): Promise<void> => {
                return await eventLink.callStudioEvent<void, void>('project.services:del');
              },
              async (index: number): Promise<void> => {
                return await eventLink.callStudioEvent<number, void>('project.services:del', index);
              },
            )
          }
        ),
      }
    ),
  } as const;
}
