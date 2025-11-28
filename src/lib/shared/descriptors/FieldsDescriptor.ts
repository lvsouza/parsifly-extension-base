import { FieldDescriptor } from './FieldDescriptor';
import { EventLink } from '../services/EventLink';


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
   * @param key - Identifier used to retrieve the fields.
   * @returns A Promise resolving to the full list of field descriptors.
   */
  onGetFields: (key: string) => Promise<FieldDescriptor[]>;
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

  /**
   * Unique identifier for this descriptor instance.
   * Mirrors the key provided in the constructor props.
   */
  public readonly key: IFieldsDescriptorProps['key'];

  /**
   * Loads all fields for a given key and prepares them for external use.
   *
   * Each call refreshes the descriptor's internal registry and ensures
   * that only the current fields for the given key remain active.
   *
   * Returned field objects will not include runtime callback handlers.
   *
   * @param key - Identifier representing the field group to load.
   * @returns A Promise resolving to the sanitized list of field descriptors.
   */
  public readonly onGetFields: IFieldsDescriptorProps['onGetFields'];

  /**
   * Internal registry of field descriptors keyed by field group.
   *
   * @private
   */
  private _registeredFields: Map<string, Set<FieldDescriptor>> = new Map();


  constructor(props: IFieldsDescriptorProps) {
    this.key = props.key;
    this.unregisterFields = this.unregisterFields;
    this.onGetFields = async (key: string) => {
      const registeredFieldsByKey = this._registeredFields.get(key) || new Set();
      this._registeredFields.set(key, registeredFieldsByKey);

      registeredFieldsByKey.forEach((field) => {
        EventLink.removeExtensionEvent(`fieldDescriptor:${field.key}:getValue`);
        EventLink.removeExtensionEvent(`fieldDescriptor:${field.key}:onDidChange`);
      });
      registeredFieldsByKey.clear();

      const fields = await props.onGetFields(key);

      fields.forEach(field => {
        if (field.getValue) EventLink.setExtensionEvent(`fieldDescriptor:${field.key}:getValue`, field.getValue);
        if (field.onDidChange) EventLink.setExtensionEvent(`fieldDescriptor:${field.key}:onDidChange`, field.onDidChange);
        registeredFieldsByKey.add(field);
      });


      return fields.map(field => ({
        ...field,
        getValue: undefined,
        onDidChange: undefined,
      }));
    };
  }

  /**
   * Unregisters all fields and their associated runtime handlers.
   * Intended for lifecycle cleanup when the descriptor instance
   * is no longer needed.
   *
   * @private
   */
  private unregisterFields() {
    for (const [, registeredFieldsByKey] of this._registeredFields) {
      registeredFieldsByKey.forEach((field) => {
        EventLink.removeExtensionEvent(`fieldDescriptor:${field.key}:getValue`);
        EventLink.removeExtensionEvent(`fieldDescriptor:${field.key}:onDidChange`);
      });
      registeredFieldsByKey.clear();
    }

    this._registeredFields.clear();
  }
}
