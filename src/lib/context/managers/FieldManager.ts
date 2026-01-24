import { TSerializableFieldViewItem } from '../../shared/components/field-view-item/TFieldViewItem';
import { FieldsDescriptor } from '../../shared/descriptors/FieldsDescriptor';
import { EventLink } from '../../shared/services/EventLink';


export class FieldManager {
  #fieldsDescriptors: Set<FieldsDescriptor> = new Set([]);
  #fields: Map<string, Set<((fields: TSerializableFieldViewItem[]) => void)>> = new Map();


  constructor() {
    EventLink.addEventListener('fields:subscription', async (key, fieldsChanged) => this.#fields.get(key as string)?.forEach(listener => listener(fieldsChanged as TSerializableFieldViewItem[])));
    EventLink.addEventListener('fields:get', async (key: string) => {
      return await Promise
        .all(
          Array
            .from(this.#fieldsDescriptors)
            .map(async fieldsDescriptor => {
              const fields = await fieldsDescriptor.onGetFields(key);
              return fields;
            }),
        )
        .then(results => results.flatMap(result => result || []) || [])
    });
  }


  /**
 * Retrieves a list of fields for a specific resource.
 * @param key The resource key used to fetch the fields.
 * @returns {Promise<TSerializableFieldViewItem[]>} A promise resolving to the list of serializable fields.
 */
  public async get(key: string): Promise<TSerializableFieldViewItem[]> {
    return await EventLink.sendEvent(`fields:get`, key);
  }

  /**
 * Requests the platform to refresh all fields associated with the resource.
 * @param key The resource key to be refreshed.
 */
  public async refresh(key: string) {
    await EventLink.sendEvent(`fields:refresh`, key);
  }

  /**
 * Subscribes to updates on form fields for a specific resource.
 * @param key The resource key to watch.
 * @param listener Callback function triggered when fields are updated.
 * @returns {() => void} A function to unsubscribe the listener.
 */
  public subscribe(key: string, listener: ((fields: TSerializableFieldViewItem[]) => Promise<void>)): (() => void) {
    const listeners = this.#fields.get(key)

    if (listeners) {
      listeners.add(listener);
    } else {
      this.#fields.set(key, new Set([listener]))
    }

    return () => this.#fields.get(key)?.delete(listener);
  }

  /**
 * Registers a fields descriptor to the platform.
 * @param fieldsDescriptor The descriptor object containing field definitions.
 */
  public register(fieldsDescriptor: FieldsDescriptor) {
    this.#fieldsDescriptors.add(fieldsDescriptor);
  }

  /**
 * Unregisters a fields descriptor from the platform.
 * @param fieldsDescriptor The descriptor object to unregister.
 */
  public unregister(fieldsDescriptor: FieldsDescriptor) {
    fieldsDescriptor.unregister();
    this.#fieldsDescriptors.delete(fieldsDescriptor);
  }
}
