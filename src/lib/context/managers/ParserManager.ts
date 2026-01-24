import { Parser } from '../../shared/components/parsers/Parser';
import { EventLink } from '../../shared/services/EventLink';


export class ParserManager {
  #parsers: Set<Parser> = new Set([]);


  constructor() {
    EventLink.addEventListener('parsers:load', async () => Array.from(this.#parsers).map(item => item.serialize()));
  }


  /**
   * Reloads the parsers registry.
   */
  public async reload() {
    return await EventLink.sendEvent(`parsers:change`, Array.from(this.#parsers).map(item => item.serialize()));
  }

  /**
   * Registers a new parser.
   * @param parser The parser instance to register.
   */
  public async register(item: Parser) {
    item.register();
    this.#parsers.add(item);
    await EventLink.sendEvent(`parsers:change`, Array.from(this.#parsers).map(item => item.serialize()));
  }

  /**
   * Unregisters an existing parser.
   * @param parser The parser instance to unregister.
   */
  public async unregister(item: Parser) {
    item.unregister();
    this.#parsers.delete(item);
    await EventLink.sendEvent(`parsers:change`, Array.from(this.#parsers).map(item => item.serialize()));
  }
}
