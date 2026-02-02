import { TSerializableFieldViewItem } from '../components/field-view-item/TFieldViewItem';
import { FieldViewItem } from '../components/field-view-item/FieldViewItem';

/**
 * Identifies a single target affected by the inspector.
 *
 * A target represents a concrete resource selected by the user,
 * but descriptors must treat it only as a semantic reference.
 */
export type TFieldTarget = {
  /**
   * Semantic kind of the target.
   *
   * Examples:
   * - 'structure'
   * - 'action'
   * - 'component'
   */
  kind: string
  /**
   * Unique identifier of the target instance.
   *
   * Descriptors may use this value to reason about
   * consistency, equality, or divergence between targets,
   * but should never rely on it to enumerate resources.
   */
  id: string
}

/**
 * Describes where the inspector interaction is happening.
 *
 * From a FieldsDescriptor point of view, this answers:
 * “In which structural context is this edit taking place?”
 */
export type TFieldVisibilityIntent = {
  /**
   * Identifier of the current structural element.
   *
   * This value is optional and should be treated as a hint,
   * not as a strict reference.
   */
  id?: string
  /**
   * Semantic role of the structural context.
   *
   * Examples:
   * - 'global'
   * - 'page'
   * - 'component'
   * - 'action'
   */
  kind: string
  /**
   * Parent visibility context.
   *
   * Allows descriptors to infer hierarchy without querying
   * the application model directly.
   */
  parent?: TFieldVisibilityIntent
}

/**
 * Describes the intent of the inspector when requesting fields.
 *
 * This object expresses *why* and *where* the inspector
 * is requesting editable fields, not *what* fields exist.
 */
export interface IFieldsDescriptorIntent {
  /**
   * Targets affected by the inspector.
   *
   * - Single selection: targets.length === 1
   * - Multi-selection: targets.length > 1
   *
   * Multi-selection is not a special case; it is a natural
   * consequence of providing multiple targets.
   */
  targets: TFieldTarget[]
  /**
   * Semantic purpose of the inspector.
   *
   * This value communicates how the inspector should behave,
   * allowing descriptors to adapt which fields they expose
   * and whether those fields are editable.
   */
  purpose?: 'edit' | 'view'
  /**
   * Structural context where the inspector is being used.
   *
   * Descriptors may use this information to adapt behavior
   * based on scope or hierarchy, without knowing concrete
   * resources or querying the core.
   */
  visibility?: TFieldVisibilityIntent
}

export interface IFieldsDescriptorProps {
  /**
   * Unique identifier for this fields descriptor context.
   * Used to request and group fields belonging to the same logical scope.
   */
  key: string;
  /**
   * Loader function responsible for returning all field descriptors
   * associated with the provided key.
   *
   * The returned descriptors may contain runtime handlers such as
   * `getValue` or `onDidChange`, which will be registered internally.
   *
   * @param intent Intent used to retrieve the fields.
   * @returns A Promise resolving to the full list of field descriptors.
   */
  onGetFields: (intent: IFieldsDescriptorIntent) => Promise<FieldViewItem[]>;
}

/**
 * Provides a descriptor for a dynamic collection of fields.
 *
 * This class handles:
 * - Loading field descriptors on demand
 * - Registering and maintaining runtime handlers (value retrieval, change events)
 * - Exposing sanitized descriptors for external consumers
 *
 * Consumers are expected to instantiate this class with a `key` and an
 * `onGetFields` loader, then call `onGetFields` whenever fresh field data
 * is needed.
 *
 * Returned fields have runtime handler functions removed from the final
 * object shape, as those are exposed through event mechanisms defined by the system.
 */
export class FieldsDescriptor {
  /**
   * Static descriptor type used for system-level identification.
   */
  public readonly type = 'fields';
  public readonly key: IFieldsDescriptorProps['key'];
  public readonly onGetFields: (intent: IFieldsDescriptorIntent) => Promise<TSerializableFieldViewItem[]>;

  #registered: Set<FieldViewItem> = new Set();

  constructor(props: IFieldsDescriptorProps) {
    this.key = props.key;
    this.unregister = this.unregister;
    this.onGetFields = async (intent): Promise<any[]> => {
      const fields = await props.onGetFields(intent);

      this.#registered.forEach((item) => item.unregister());
      this.#registered.clear();

      for (const field of fields) {
        field.register();
        this.#registered.add(field);
      }

      return fields.map(field => field.serialize());
    };
  }

  public unregister() {
    this.#registered.forEach((item) => item.unregister());
    this.#registered.clear();
  }
}
