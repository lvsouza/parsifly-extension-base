import { FieldsDescriptor, IFieldsDescriptorIntent, TFieldVisibilityIntent } from '../../shared/descriptors/FieldsDescriptor';
import { TSerializableFieldViewItem } from '../../shared/components/field-view-item/TFieldViewItem';
import { EventLink } from '../../shared/services/EventLink';


export class FieldManager {
  #fieldsDescriptors: Set<FieldsDescriptor> = new Set([]);
  #fields: Map<string, Set<((fields: TSerializableFieldViewItem[]) => void)>> = new Map();


  constructor() {
    EventLink.addEventListener('fields:subscription', async (key, fieldsChanged) => this.#fields.get(key as string)?.forEach(listener => listener(fieldsChanged as TSerializableFieldViewItem[])));
    EventLink.addEventListener('fields:get', async (intent: IFieldsDescriptorIntent) => {
      return await Promise
        .all(
          Array
            .from(this.#fieldsDescriptors)
            .map(async fieldsDescriptor => {
              const fields = await fieldsDescriptor.onGetFields(intent);
              return fields;
            }),
        )
        .then(results => results.flatMap(result => result || []) || [])
    });
  }


  /**
   * Retrieves a list of fields for a specific resource.
   * @param intent The intent of what fields is returned.
   * @returns {Promise<TSerializableFieldViewItem[]>} A promise resolving to the list of serializable fields.
   */
  public async get(intent: IFieldsDescriptorIntent): Promise<TSerializableFieldViewItem[]> {
    return await EventLink.sendEvent(`fields:get`, intent);
  }

  /**
   * Requests the platform to refresh all fields associated with the resource.
   * @param intent The intent of what fields is returned.
   */
  public async refresh(intent: IFieldsDescriptorIntent) {
    await EventLink.sendEvent(`fields:refresh`, intent);
  }

  /**
   * Subscribes to updates on form fields for a specific resource.
   * @param intent The intent of what fields is returned.
   * @param listener Callback function triggered when fields are updated.
   * @returns {() => void} A function to unsubscribe the listener.
   */
  public subscribe(intent: IFieldsDescriptorIntent, listener: ((fields: TSerializableFieldViewItem[]) => Promise<void>)): (() => void) {
    const key = this.#createIntentKey(intent);

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


  #createIntentKey(intent: IFieldsDescriptorIntent): string {
    const normalizeVisibility = (visibility?: TFieldVisibilityIntent): any => {
      if (!visibility) return null

      return {
        kind: visibility.kind,
        id: visibility.id ?? null,
        parent: visibility.parent ? normalizeVisibility(visibility.parent) : null,
      }
    }

    return JSON.stringify({
      purpose: intent.purpose ?? 'edit',

      targets: intent.targets
        .map(t => `${t.kind}:${t.id}`)
        .sort(),

      visibility: normalizeVisibility(intent.visibility),
    })
  }
}
