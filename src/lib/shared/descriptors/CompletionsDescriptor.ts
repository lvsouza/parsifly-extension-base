import { CompletionViewItem } from '../components/completion-view-item/CompletionViewItem';
import { TDataType } from '../../data-providers/interfaces/IStructureAttribute';
import { TAllResourceTypes } from '../../data-providers/interfaces/TAllTypes';
import { TSerializableCompletionViewItem } from '../components/completion-view-item/TCompletionViewItem';


export type TCompletionRequestKind =
  | 'type'
  | 'value'
  | 'reference'
  | 'callable'

/**
 * Describes the type information that can be used by a CompletionsDescriptor
 * to decide whether a suggestion is appropriate to return.
 *
 * From the descriptor’s point of view, this object answers the question:
 * “What kind of value would make sense to suggest here?”
 *
 * It should be treated as guidance, not as a strict contract. A descriptor
 * may use it to filter, prioritize, or adapt its suggestions, or ignore it
 * entirely if it is not relevant.
 */
export type TCompletionTypeDescriptor = {
  /**
   * Indicates the general category of type expected by the field.
   *
   * Descriptors can use this information to avoid returning suggestions
   * that are fundamentally incompatible, such as suggesting textual values
   * where a numeric result is expected.
   *
   * This value expresses intent, not validation rules.
   */
  type: TDataType

  /**
   * Identifies an external type definition when the expected type is not
   * self-contained.
   *
   * Descriptors may use this reference to match suggestions that originate
   * from the same type definition, such as values or results associated with
   * a specific structure. If absent, the descriptor should assume a
   * self-contained type.
   */
  referenceId?: string
}

/**
 * Provides structural information that helps a CompletionsDescriptor
 * understand where the request is happening.
 *
 * From the descriptor’s perspective, this context answers:
 * “In which part of the application is this completion being requested?”
 *
 * It can be used to adapt suggestions based on scope or hierarchy, but it
 * should never be treated as an instruction to list or expose resources.
 */
export type TCompletionVisibilityIntent = {
  /**
   * Optional identifier of the current structural element.
   *
   * Descriptors may use this value to correlate the request with a known
   * element or to perform localized reasoning, such as prioritizing
   * suggestions related to the current node.
   */
  key?: string

  /**
   * Describes the role of the current structural element.
   *
   * This allows a descriptor to change its behavior depending on whether
   * the request originates inside an action, a component, or another
   * conceptual area of the application.
   */
  type: TAllResourceTypes

  /**
   * Reference to the parent structural intent.
   *
   * Descriptors can traverse this chain to infer broader scope, such as
   * determining whether the request is nested within another element,
   * without directly querying the application model.
   */
  parent?: TCompletionVisibilityIntent
}

/**
 * Intent object received by a CompletionsDescriptor when generating suggestions.
 *
 * This object represents the intent of the field enriched with optional
 * semantic and structural signals. Each property is independent, and
 * descriptors are expected to use only what makes sense for their logic.
 */
export interface ICompletionsDescriptorIntent {
  /**
   * Primary semantic intent of the field.
   *
   * Answers the question:
   * "What kind of thing makes sense to be suggested here?"
   */
  kind: TCompletionRequestKind

  /**
   * Indicates the semantic domain the field is operating in.
   *
   * Descriptors can use this value to decide whether they are relevant
   * to the request and to avoid returning suggestions that are conceptually
   * unrelated, even if they might be technically compatible.
   */
  domain?: string

  /**
   * Communicates the expected type of the result.
   *
   * Descriptors may use this information to filter or rank suggestions,
   * ensuring that returned completions are reasonable candidates for
   * assignment or usage in the current field.
   */
  expectedType?: TCompletionTypeDescriptor

  /**
   * Provides information about where the request occurs in the application.
   *
   * This allows descriptors to tailor their suggestions based on scope
   * or hierarchy, while remaining decoupled from the core and from
   * concrete resource inventories.
   */
  visibility?: TCompletionVisibilityIntent
}

export interface ICompletionsDescriptorProps {
  /**
   * Unique identifier for this completions descriptor context.
   * Used to request and group completions belonging to the same logical scope.
   */
  key: string;

  /**
   * Loader function responsible for returning all completion descriptors
   * associated with the provided key.
   *
   * The returned descriptors may contain runtime handlers such as
   * `getValue` or `onDidChange`, which will be registered internally.
   *
   * @param intent - Identifier representing the completion group to load.
   * @returns A Promise resolving to the full list of completion descriptors.
   */
  onGetCompletions: (intent: ICompletionsDescriptorIntent) => Promise<CompletionViewItem[]>;
}

/**
 * Provides a descriptor for a dynamic collection of completions.
 *
 * This class handles:
 * - Loading completion descriptors on demand
 * - Registering and maintaining runtime handlers (value retrieval, change events)
 * - Exposing sanitized descriptors for external consumers
 *
 * Consumers are expected to instantiate this class with a `key` and an
 * `onGetCompletions` loader, then call `onGetCompletions` whenever fresh completion data
 * is needed.
 *
 * Returned completions have runtime handler functions removed from the final
 * object shape, as those are exposed through event mechanisms defined by the system.
 */
export class CompletionsDescriptor {
  /**
   * Static descriptor type used for system-level identification.
   */
  public readonly type = 'completions';
  /**
   * Unique identifier for this descriptor instance.
   * Mirrors the key provided in the constructor props.
   */
  public readonly key: ICompletionsDescriptorProps['key'];
  /**
   * Loads all completions for a given key and prepares them for external use.
   *
   * Each call refreshes the descriptor's internal registry and ensures
   * that only the current completions for the given key remain active.
   *
   * Returned completion objects will not include runtime callback handlers.
   *
   * @param intent - Identifier representing the completion group to load.
   * @returns A Promise resolving to the sanitized list of completion descriptors.
   */
  public readonly onGetCompletions: (intent: ICompletionsDescriptorIntent) => Promise<TSerializableCompletionViewItem[]>;

  #registered: Set<CompletionViewItem> = new Set();

  constructor(props: ICompletionsDescriptorProps) {
    this.key = props.key;
    this.unregister = this.unregister;
    this.onGetCompletions = async (intent): Promise<TSerializableCompletionViewItem[]> => {
      const completions = await props.onGetCompletions(intent);

      for (const completion of completions) {
        completion.register();
        this.#registered.add(completion)
      }

      return completions.map(completion => completion.serialize());
    };
  }

  /**
   * Unregisters all completions and their associated runtime handlers.
   * Intended for lifecycle cleanup when the descriptor instance
   * is no longer needed.
   */
  public unregister() {
    this.#registered.forEach((completion) => completion.unregister());
    this.#registered.clear();
  }
}
