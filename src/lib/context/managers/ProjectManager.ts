import { ProjectDescriptor, TSerializableProjectDescriptor } from '../../shared/descriptors/ProjectDescriptor';
import { EventLink } from '../../shared/services/EventLink';


export class ProjectManager {
  #projectsDescriptors: Set<ProjectDescriptor> = new Set([]);


  constructor() {
    EventLink.addEventListener('projects:get', async () => {
      return Array
        .from(this.#projectsDescriptors)
        .map(projectDescriptor => projectDescriptor.serialize())
    });
  }



  /**
 * Retrieves the list of available projects.
 * @returns {Promise<TSerializableProjectDescriptor[]>} A promise resolving to the list of project descriptors.
 */
  public async get(): Promise<TSerializableProjectDescriptor[]> {
    return await EventLink.sendEvent(`projects:get`);
  }

  /**
 * Registers a project descriptor to the platform.
 * @param projectDescriptor The project configuration to register.
 */
  public register(projectDescriptor: ProjectDescriptor): void {
    this.#projectsDescriptors.add(projectDescriptor);
  }

  /**
 * Unregisters a project descriptor.
 * @param projectDescriptor The project configuration to remove.
 */
  public unregister(projectDescriptor: ProjectDescriptor): void {
    projectDescriptor.unregister();
    this.#projectsDescriptors.delete(projectDescriptor);
  }

}
