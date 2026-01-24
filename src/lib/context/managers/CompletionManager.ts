import { TSerializableCompletionViewItem } from '../../shared/components/completion-view-item/TCompletionViewItem';
import { CompletionsDescriptor, ICompletionsDescriptorIntent } from '../../shared/descriptors/CompletionsDescriptor';
import { EventLink } from '../../shared/services/EventLink';


export class CompletionManager {
  #completionsDescriptors: Set<CompletionsDescriptor> = new Set([]);


  constructor() {
    EventLink.addEventListener('completions:get', async (intent: ICompletionsDescriptorIntent) => {
      return await Promise
        .all(
          Array
            .from(this.#completionsDescriptors)
            .map(async completionsDescriptor => {
              const completions = await completionsDescriptor.onGetCompletions(intent);
              return completions;
            }),
        )
        .then(results => results.flatMap(result => result || []) || [])
    });
  }

  /**
   * Retrieves a list of code completion suggestions based on user intent.
   * @param intent Contextual information about what needs completion (cursor position, file type, etc.).
   * @returns {Promise<TSerializableCompletionViewItem[]>} A promise resolving to the list of completion items.
   */
  public async get(intent: ICompletionsDescriptorIntent): Promise<TSerializableCompletionViewItem[]> {
    return await EventLink.sendEvent(`completions:get`, intent);
  }
  /**
   * Registers a completions descriptor to the platform provider.
   * @param completionsDescriptor The descriptor defining how completions are generated.
   */
  public register(completionsDescriptor: CompletionsDescriptor): void {
    this.#completionsDescriptors.add(completionsDescriptor);
  }
  /**
   * Unregisters a completions descriptor.
   * @param completionsDescriptor The descriptor to remove.
   */
  public unregister(completionsDescriptor: CompletionsDescriptor): void {
    completionsDescriptor.unregister();
    this.#completionsDescriptors.delete(completionsDescriptor);
  }
}
