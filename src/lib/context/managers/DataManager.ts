import { DatabaseError, TQuery, TQueryResults, TWatchQuery } from '../../types/TQuery';
import { createDeterministicKey } from '../../shared/services/CreateDeterministicKey';
import { EventLink } from '../../shared/services/EventLink';


export class DataManager {
  #data: Map<string, Set<((data: any) => Promise<void>)>> = new Map();


  constructor() {
    EventLink.addEventListener('data:watch', async (key: string, dataChanged: any) => {
      const listenerTriggers = Array.from(
        this.#data
          .entries()
          .filter(([listenersKey]) => listenersKey === key)
          .flatMap(([, listeners]) => listeners)
          .map(listener => listener(dataChanged))
      );

      return await Promise.all(listenerTriggers)
    });
  }

  /**
   * Executes a query against the platform's data layer.
   * @param query The query object to be executed.
   * @returns {Promise<TQueryResults>} A promise resolving to the query results.
   */
  public async execute<T extends Record<string, any>, GQueryMode extends 'array' | 'object' = 'object'>(query: TQuery<T, GQueryMode>): Promise<TQueryResults<T, GQueryMode>> {
    const result: any = await EventLink.sendEvent('data:execute', query);
    if ('severity' in result) throw new DatabaseError(result);
    return result;
  }

  /**
   * Subscribes to a live data query, watching for real-time updates.
   * @template T The expected structure of the data being watched.
   * @param props The watch query configuration.
   * @returns {Promise<() => Promise<void>>} A promise resolving to an unsubscribe function.
   */
  public async subscribe<T extends Record<string, any>, GQueryMode extends 'array' | 'object'>({ query, listener }: TWatchQuery<T, GQueryMode>): Promise<() => Promise<void>> {
    const key = createDeterministicKey(query.sql, query.parameters as []);

    const listeners = this.#data.get(key);
    if (listeners) {
      listeners.add(listener);
    } else {
      await EventLink.sendEvent<any>('data:watch:add', key, query);
      this.#data.set(key, new Set([listener]))
    }

    return async () => {
      this.#data.get(key)?.delete(listener);

      if (this.#data.size === 0) {
        await EventLink.sendEvent<any>('data:watch:remove', key, query);
      }
    };
  }
}
