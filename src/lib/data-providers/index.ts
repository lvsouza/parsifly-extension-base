import { EventLink } from '../shared/services/EventLink';
import { IProject } from './interfaces/IProject';
import { TAllTypes } from './interfaces/TAllTypes';


/**
 * @interface ISubscription
 * Represents an active subscription to real-time data changes.
 */
export interface ISubscription {
  /**
   * Stops the listener from receiving further updates.
   * @example
   * const sub = await provider.doc('project').field('name').onValue(() => {});
   * await sub.unsubscribe();
   */
  unsubscribe(): Promise<void>;
}

/**
 * @interface IField
 * Represents a reference to a specific field within a Document.
 * @template T The type of the field's value.
 */
export interface IField<T> {
  /**
   * A reference to the Document that contains this field.
   * Returns null if this field was created as a root reference without a parent document.
   * @example
   * const docRef = field.parent;
   * if (docRef) { ... }
   */
  readonly parent: IDoc<any> | null;

  /**
   * Retrieves the current value of the field.
   * @returns A Promise that resolves with the field's value.
   */
  value(): Promise<T>;

  /**
   * Sets the value of the field.
   * @param newValue The new value to set.
   */
  set<GValue = T>(newValue: GValue): Promise<void>;

  /**
   * Subscribes to real-time updates for this field.
   * @param callback The function to call when the value changes.
   */
  onValue(callback: (value: T) => Promise<void>): Promise<ISubscription>;
}

/**
 * @interface IDoc
 * Represents a reference to a single Document.
 * @template T The type of the document data.
 */
export interface IDoc<T> {
  /**
   * A reference to the Collection that contains this Document.
   * Returns null if this document is a root-level reference.
   * @example
   * const collectionRef = doc.parent;
   */
  readonly parent: ICollection<T> | null;

  /**
   * Retrieves the current data of the Document.
   */
  value(): Promise<T>;

  /**
   * Overwrites the Document with new data.
   */
  set<GValue = T>(data: GValue): Promise<void>;

  /**
   * Updates specific fields of the Document without overwriting the entire document.
   */
  update(data: Partial<T>): Promise<void>;

  /**
   * Deletes the Document.
   */
  delete(): Promise<void>;

  /**
   * Gets a reference to a specific field within this Document.
   */
  field<K extends keyof T>(key: K | (string & {})): IField<T[K]>;

  /**
   * Gets a reference to a sub-collection nested under this Document.
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
   * A reference to the Document that contains this Collection (if it is a sub-collection).
   * Returns null if this is a root-level collection.
   * @example
   * const parentDoc = collection.parent;
   */
  readonly parent: IDoc<any> | null;

  /**
   * Retrieves all Documents in the Collection.
   */
  value(): Promise<T[]>;

  /**
   * Adds a new Document to the Collection.
   */
  add(data: T): Promise<void>;

  /**
   * Replace documents of the Collection.
   */
  set(data: T[]): Promise<void>;

  /**
   * Remove all documents of the Collection.
   */
  clear(): Promise<void>;

  /**
   * Subscribes to real-time updates for the entire Collection.
   */
  onValue(callback: (value: T[]) => Promise<void>): Promise<ISubscription>;

  /**
   * Gets a reference to a specific Document within the Collection by its ID.
   */
  doc(id: string): IDoc<T>;
}

// --- IMPLEMENTATION ---

/**
 * @class ResourceBase
 * Base class providing core logic for event string construction, CRUD calls, and subscriptions.
 */
class ResourceBase<T> {
  constructor(
    protected eventLink: EventLink,
    protected path: string,
    protected docId: string[]
  ) { }

  async onValue(callback: (value: T) => Promise<void>): Promise<ISubscription> {
    let method = 'onValue';
    let params = [...this.docId];

    const eventString = `${this.path}:${method}`;
    const subscriptionKey = crypto.randomUUID();

    this.eventLink.setExtensionEvent(subscriptionKey, callback as any);
    await this.eventLink.callStudioEvent<any, any>('subscribe-to-get-data', subscriptionKey, eventString, ...params);

    return {
      unsubscribe: async () => {
        await this.eventLink.callStudioEvent<any, any>('unsubscribe-to-get-data', subscriptionKey);
        this.eventLink.removeExtensionEvent(subscriptionKey);
      }
    };
  }

  protected async callEvent(actionSuffix: string, ...args: any[]) {
    let method = actionSuffix;
    let params = args;

    if (this.docId && this.docId.length > 0) {
      if (actionSuffix === 'get') method = 'getById';
      else if (actionSuffix === 'set') method = 'setById';
      else if (actionSuffix === 'del') method = 'delById';

      params = [...this.docId, ...args];
    }

    const eventString = `${this.path}:${method}`;
    return this.eventLink.callStudioEvent<any, any>('get-or-set-data', eventString, ...params);
  }
}

/**
 * @class FieldRef
 * Implements IField interface.
 * Can be instantiated with parent as null for root fields.
 */
class FieldRef<T> extends ResourceBase<T> implements IField<T> {
  public readonly parent: IDoc<any> | null;

  constructor(eventLink: EventLink, path: string, docId: string[], parent: IDoc<any> | null = null) {
    super(eventLink, path, docId);
    this.parent = parent;
  }

  async value(): Promise<T> {
    return this.callEvent('get');
  }

  async set<GValue = T>(newValue: GValue): Promise<void> {
    return this.callEvent('set', newValue);
  }
}

/**
 * @class DocRef
 * Implements IDoc interface.
 * Can be instantiated with parent as null for root documents.
 */
class DocRef<T> extends ResourceBase<T> implements IDoc<T> {
  public readonly parent: ICollection<T> | null;

  constructor(eventLink: EventLink, path: string, docId: string[], parent: ICollection<T> | null = null) {
    super(eventLink, path, docId);
    this.parent = parent;
  }

  async value(): Promise<T> {
    return this.callEvent('get');
  }

  async set<GValue = T>(data: GValue): Promise<void> {
    return this.callEvent('set', data);
  }

  async update(data: Partial<T>): Promise<void> {
    return this.callEvent('set', data);
  }

  async delete(): Promise<void> {
    return this.callEvent('del');
  }

  field<K extends keyof T>(key: K | (string & {})): IField<T[K]> {
    return new FieldRef<T[K]>(
      this.eventLink,
      `${this.path}.${String(key)}`,
      this.docId,
      this as any // Parent is valid here
    );
  }

  collection<U>(subCollectionName: string): ICollection<U> {
    return new CollectionRef<U>(
      this.eventLink,
      `${this.path}.${subCollectionName}`,
      this.docId,
      this as any // Parent is valid here
    );
  }
}

/**
 * @class CollectionRef
 * Implements ICollection interface.
 * Can be instantiated with parent as null for root collections.
 */
class CollectionRef<T> extends ResourceBase<T[]> implements ICollection<T> {
  public readonly parent: IDoc<any> | null;

  constructor(eventLink: EventLink, path: string, docId: string[], parent: IDoc<any> | null = null) {
    super(eventLink, path, docId);
    this.parent = parent;
  }

  async value(): Promise<T[]> {
    return this.callEvent('getAll');
  }

  async add(data: T): Promise<void> {
    return this.callEvent('listAdd', data);
  }

  async set(data: T[]): Promise<void> {
    return this.callEvent('listSet', data);
  }

  async clear(): Promise<void> {
    return this.callEvent('listClear');
  }

  doc(id: string): IDoc<T> {
    return new DocRef<T>(
      this.eventLink,
      this.path,
      [...this.docId, id],
      this // Parent is valid here
    );
  }
}

/**
 * @function createDataProviders
 * Factory function to create the root Data Provider object.
 * @param eventLink The underlying communication service for studio events.
 * @returns The root Data Provider object.
 */
export const createDataProviders = (eventLink: EventLink) => {
  const deepSearch = <GResult extends TAllTypes>(base: ICollection<GResult>, key: string, items: GResult[]): [GResult | null, IDoc<GResult> | null] => {
    for (const item of items) {
      if (item.id === key) return [item, base.doc(item.id)];

      if (item.type === 'folder') {
        const [result, resultPath] = deepSearch(base.doc(item.id).collection('content'), key, item.content)
        if (result) return [result, resultPath];
      }
      if (item.type === 'structure') {
        const [result, resultPath] = deepSearch(base.doc(item.id).collection('attributes'), key, item.attributes)
        if (result) return [result, resultPath];
      }
      if (item.type === 'structure_attribute') {
        const [result, resultPath] = deepSearch(base.doc(item.id).collection('attributes'), key, item.attributes)
        if (result) return [result, resultPath];
      }
    }

    return [null, null];
  }


  return {
    /**
     * Gets a reference to a root Document (Singleton or starting point).
     * @example provider.project<IProject>().value()
     */
    project: (): IDoc<IProject> => {
      return new DocRef<IProject>(eventLink, 'project', [], null);
    },
    /**
     * Easy way to find a resource in the project by their key.
     * 
     * This will search in all resource to find the correct resource.
     * 
     * @param key The identification of the resource
     * @returns Returns the element searched or null if the resource was not found
     */
    async findAnyResourceByKey<GResult extends TAllTypes>(key: string): Promise<[GResult, IDoc<GResult> | null]> {
      const itemProject: any = await this.project().value();
      const pathProject: IDoc<any> = this.project();

      let item: any = itemProject;
      let path: IDoc<any> | null = pathProject;

      if (item.id !== key) {
        [item, path = pathProject] = deepSearch(pathProject.collection('pages'), key, itemProject.pages);
      }
      if (!item) {
        [item, path = pathProject] = deepSearch(pathProject.collection('components'), key, itemProject.components);
      }
      if (!item) {
        [item, path = pathProject] = deepSearch(pathProject.collection('actions'), key, itemProject.actions);
      }
      if (!item) {
        [item, path = pathProject] = deepSearch(pathProject.collection('structures'), key, itemProject.structures);
      }

      return [item, path];
    }
  };
};
