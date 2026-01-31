import { EventLink } from '../../shared/services/EventLink';


export class LocalStorageManager {
  #cache = new Map<string, unknown>();


  private parse = <T>(value: unknown): T | null => {
    if (typeof value !== 'string') return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  };

  private stringify = (value: unknown): string => {
    return JSON.stringify(value);
  };


  public getItem = async <T>(key: string): Promise<T | null> => {
    if (this.#cache.has(key)) {
      return this.#cache.get(key) as T;
    }

    const raw = await EventLink.sendEvent('localStorage:getItem', key);
    const parsed = this.parse<T>(raw);

    this.#cache.set(key, parsed);

    return parsed;
  };

  public setItem = async <T>(key: string, data: T | ((oldData: T | null) => T)): Promise<void> => {
    let newValue: T;

    if (typeof data === 'function') {
      let oldValue: T | null;

      if (this.#cache.has(key)) {
        oldValue = this.#cache.get(key) as T;
      } else {
        const raw = await EventLink.sendEvent('localStorage:getItem', key);
        oldValue = this.parse<T>(raw);

        if (oldValue !== null) {
          this.#cache.set(key, oldValue);
        }
      }

      newValue = (data as ((old: T | null) => T))(oldValue);
    } else {
      newValue = data;
    }

    await EventLink.sendEvent('localStorage:setItem', key, this.stringify(newValue));
    this.#cache.set(key, newValue);
  };

  public removeItem = async (key: string): Promise<void> => {
    await EventLink.sendEvent('localStorage:removeItem', key);
    this.#cache.delete(key);
  };

  public clear = async (): Promise<void> => {
    await EventLink.sendEvent('localStorage:clear');
    this.#cache.clear();
  };
}
