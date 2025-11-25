import { EventLink } from '../shared/services/EventLink';

// --- INTERFACES ---

/**
 * @interface ISubscription
 * Represents an active subscription to real-time data changes.
 */
export interface ISubscription {
  /**
   * Stops the listener from receiving further updates.
   * @example
   * const sub = provider.doc('project').field('name').onValue(() => {});
   * sub.unsubscribe();
   */
  unsubscribe(): void;
}

/**
 * @interface IField
 * Represents a reference to a specific field within a Document.
 * @template T The type of the field's value.
 */
export interface IField<T> {
  /**
   * Retrieves the current value of the field.
   * @returns A Promise that resolves with the field's value.
   * @example
   * const name = await provider.doc('project').field('name').value();
   */
  value(): Promise<T>;

  /**
   * Sets the value of the field.
   * @param newValue The new value to set.
   * @returns A Promise that resolves when the operation is complete.
   * @example
   * await provider.doc('project').field('name').set('New Name');
   */
  set(newValue: T): Promise<void>;

  /**
   * Subscribes to real-time updates for this field.
   * @param callback The function to call when the value changes.
   * @returns An object with an unsubscribe method.
   * @example
   * const sub = provider.doc('project').field('name').onValue(name => console.log(name));
   * sub.unsubscribe();
   */
  onValue(callback: (value: T) => void): ISubscription;
}

/**
 * @interface IDoc
 * Represents a reference to a single Document (e.g., 'project' or 'page-123').
 * @template T The type of the document data.
 */
export interface IDoc<T> {
  /**
   * Retrieves the current data of the Document.
   * @returns A Promise that resolves with the Document data.
   * @example
   * const project = await provider.doc<IProject>('project').value();
   */
  value(): Promise<T>;

  /**
   * Overwrites the Document with new data.
   * @param data The new data to set.
   * @returns A Promise that resolves when the operation is complete.
   * @example
   * await provider.doc<IProject>('project').set({ id: 'proj', name: 'New Project' });
   */
  set(data: T): Promise<void>;

  /**
   * Updates specific fields of the Document without overwriting the entire document.
   * Note: Implementation maps to 'set' in this model.
   * @param data The partial data to update.
   * @returns A Promise that resolves when the operation is complete.
   * @example
   * await provider.doc<IPage>('pages').doc('p1').update({ name: 'Updated Page Name' });
   */
  update(data: Partial<T>): Promise<void>;

  /**
   * Deletes the Document.
   * @returns A Promise that resolves when the operation is complete.
   * @example
   * await provider.doc<IPage>('pages').doc('p1').delete();
   */
  delete(): Promise<void>;

  /**
   * Subscribes to real-time updates for the entire Document.
   * @param callback The function to call when the Document data changes.
   * @returns An object with an unsubscribe method.
   * @example
   * const sub = provider.doc<IProject>('project').onValue(data => console.log('Project changed:', data));
   * sub.unsubscribe();
   */
  onValue(callback: (value: T) => void): ISubscription;

  /**
   * Gets a reference to a specific field within this Document.
   * @param key The key of the field.
   * @returns An IField reference.
   * @example
   * const nameField = provider.doc('project').field('name');
   */
  field<K extends keyof T>(key: K): IField<T[K]>;

  /**
   * Gets a reference to a sub-collection nested under this Document.
   * @param path The name of the sub-collection (e.g., 'pages').
   * @returns An ICollection reference.
   * @example
   * const pagesCollection = provider.doc('project').collection<IPage>('pages');
   */
  collection<U = any>(path: string): ICollection<U>;
}

/**
 * @interface ICollection
 * Represents a reference to a Collection of Documents.
 * @template T The type of the documents within the collection.
 */
export interface ICollection<T> {
  /**
   * Retrieves all Documents in the Collection.
   * @returns A Promise that resolves with an array of documents.
   * @example
   * const pages = await provider.collection<IPage>('pages').value();
   */
  value(): Promise<T[]>;

  /**
   * Adds a new Document to the Collection.
   * @param data The data for the new document.
   * @returns A Promise that resolves when the operation is complete.
   * @example
   * await provider.collection<IPage>('pages').add({ name: 'New Page', content: '...' });
   */
  add(data: T): Promise<void>;

  /**
   * Subscribes to real-time updates for the entire Collection (list changes).
   * @param callback The function to call when the list of documents changes.
   * @returns An object with an unsubscribe method.
   * @example
   * const sub = provider.collection<IPage>('pages').onValue(list => console.log('List updated:', list.length));
   * sub.unsubscribe();
   */
  onValue(callback: (value: T[]) => void): ISubscription;

  /**
   * Gets a reference to a specific Document within the Collection by its ID.
   * @param id The ID of the document.
   * @returns An IDoc reference.
   * @example
   * const pageDoc = provider.collection<IPage>('pages').doc('page-123');
   */
  doc(id: string): IDoc<T>;
}

// --- IMPLEMENTATION ---

/**
 * @class ResourceBase
 * Base class providing core logic for event string construction, CRUD calls, and subscriptions.
 * It manages the distinction between singletons (no docId) and collection items (with docId).
 * @template T The type of data this resource handles.
 */
class ResourceBase<T> {
  constructor(
    protected eventLink: EventLink,
    protected path: string,
    protected docId?: string
  ) { }

  /**
   * Generates the unique event string for subscription.
   * If a docId is present, it is appended to ensure listener uniqueness.
   * @returns The event string used for setExtensionEvent.
   */
  protected getSubscriptionEventName(): string {
    const action = 'onChange';
    if (this.docId) {
      // Ex: project.pages:onChange:page-123 or project.pages.name:onChange:page-123
      return `${this.path}:${action}:${this.docId}`;
    }

    // Ex: project:onChange or project.pages:onChange (for list updates)
    return `${this.path}:${action}`;
  }

  /**
   * Implements the subscription logic using eventLink.
   * @param callback The function to be called on updates.
   * @returns An ISubscription object.
   */
  onValue(callback: (value: T) => void): ISubscription {
    const eventString = this.getSubscriptionEventName();

    // The callback type casting is often necessary when dealing with generic types in event emitters
    this.eventLink.setExtensionEvent(eventString, callback as any);

    return {
      unsubscribe: () => {
        this.eventLink.removeExtensionEvent(eventString);
      }
    };
  }

  /**
   * Executes the remote command via callStudioEvent, handling the parameter array correctly.
   * The docId is correctly inserted as the first parameter when required.
   * @param actionSuffix The base action (e.g., 'get', 'set', 'del', 'getAll').
   * @param args Additional arguments for the action (e.g., the data payload).
   * @returns A Promise resolving with the result of the remote call.
   */
  protected async callEvent(actionSuffix: string, ...args: any[]) {
    let method = actionSuffix;
    let params = args;

    if (this.docId) {
      // Map base actions to specific collection item actions
      if (actionSuffix === 'get') method = 'getById';
      else if (actionSuffix === 'set') method = 'setById';
      else if (actionSuffix === 'del') method = 'delById';

      // CRITICAL CHANGE: Prepend the docId to the parameters list
      params = [this.docId, ...args];
    }

    const eventString = `${this.path}:${method}`;
    // Pass the combined array (including docId if necessary) as parameters
    return this.eventLink.callStudioEvent<any, any>(eventString, ...params);
  }
}

/**
 * @class FieldRef
 * Implements IField interface for field-level operations.
 * @template T The type of the field's value.
 */
class FieldRef<T> extends ResourceBase<T> implements IField<T> {
  async value(): Promise<T> {
    // callEvent handles using getById if docId is present
    return this.callEvent('get');
  }

  async set(newValue: T): Promise<void> {
    // callEvent handles using setById if docId is present
    return this.callEvent('set', newValue);
  }

  // onValue is inherited from ResourceBase
}

/**
 * @class DocRef
 * Implements IDoc interface for document-level operations.
 * @template T The type of the document data.
 */
class DocRef<T> extends ResourceBase<T> implements IDoc<T> {
  async value(): Promise<T> {
    return this.callEvent('get');
  }

  async set(data: T): Promise<void> {
    return this.callEvent('set', data);
  }

  async update(data: Partial<T>): Promise<void> {
    // Uses 'set' action and expects the backend to handle the partial update/merge
    return this.callEvent('set', data);
  }

  async delete(): Promise<void> {
    return this.callEvent('del');
  }

  /**
   * @inheritdoc
   * Creates a FieldRef, passing its current docId to maintain context.
   */
  field<K extends keyof T>(key: K): IField<T[K]> {
    return new FieldRef<T[K]>(this.eventLink, `${this.path}.${String(key)}`, this.docId);
  }

  /**
   * @inheritdoc
   * Creates a CollectionRef, appending the sub-collection name to the path.
   * The docId is discarded since the collection itself is a list, not an item.
   */
  collection<U>(subCollectionName: string): ICollection<U> {
    return new CollectionRef<U>(this.eventLink, `${this.path}.${subCollectionName}`);
  }

  // onValue is inherited from ResourceBase
}

/**
 * @class CollectionRef
 * Implements ICollection interface for collection-level operations.
 * @template T The type of the documents within the collection.
 */
class CollectionRef<T> extends ResourceBase<T[]> implements ICollection<T> {
  constructor(eventLink: EventLink, path: string) {
    super(eventLink, path);
  }

  async value(): Promise<T[]> {
    // Uses 'getAll' action (e.g., project.pages:getAll). No ID required.
    return this.callEvent('getAll');
  }

  async add(data: T): Promise<void> {
    // Uses 'add' action (e.g., project.pages:add). No ID required, data is the payload.
    return this.callEvent('add', data);
  }

  /**
   * @inheritdoc
   * Creates a DocRef, passing the ID so that subsequent operations use the 'ById' suffix and include the ID in params.
   */
  doc(id: string): IDoc<T> {
    return new DocRef<T>(this.eventLink, this.path, id);
  }

  // onValue is inherited from ResourceBase
}

/**
 * @function createDataProviders
 * Factory function to create the root Data Provider object.
 * @param eventLink The underlying communication service for studio events.
 * @returns The root Data Provider object.
 */
export const createDataProviders = (eventLink: EventLink) => {
  return {
    /**
     * Gets a reference to a root Document (Singleton or starting point).
     * @example provider.doc<IProject>('project').value()
     */
    doc: <T = any>(path: string): IDoc<T> => {
      // Path example: 'project', 'settings'
      return new DocRef<T>(eventLink, path);
    },
    /**
     * Gets a reference to a root Collection.
     * @example provider.collection<IUser>('users').value()
     */
    collection: <T = any>(path: string): ICollection<T> => {
      // Path example: 'users', 'global_assets'
      return new CollectionRef<T>(eventLink, path);
    }
  };
};

