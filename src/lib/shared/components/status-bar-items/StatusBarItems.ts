import { TSerializableStatusBarItem, TStatusBarItem, TStatusBarItemMountContext } from './TStatusBarItems';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';


export type TStatusBarItemConstructor = {
  key: string;
  initialValue?: Partial<TStatusBarItem>;
  onDidMount?: TOnDidMount<TStatusBarItemMountContext>;
}

export class StatusBarItem {
  public readonly key: TStatusBarItemConstructor['key'];
  public readonly onDidMount: TStatusBarItemConstructor['onDidMount'];
  public readonly internalValue: NonNullable<Partial<TStatusBarItemConstructor['initialValue']>>;


  constructor(props: TStatusBarItemConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
  }


  #createContext(mountId: string): TStatusBarItemMountContext {
    return {
      set: async <GKey extends keyof TStatusBarItem>(property: GKey, newValue: TStatusBarItem[GKey]) => {
        switch (property) {
          case 'action':
            this.internalValue[property] = newValue;
            return;

          default:
            this.internalValue[property] = newValue;
            return await EventLink.sendEvent(`statusBarItem:${mountId}:set`, { property, newValue });
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const context = this.#createContext(mountId);

    EventLink.addEventListener(`statusBarItem:${mountId}:action`, async () => 'action' in this.internalValue ? this.internalValue.action?.(context) : {});


    const onDidUnmount = await this.onDidMount?.(context);

    EventLink.addEventListener(`statusBarItem:${mountId}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      EventLink.removeEventListener(`statusBarItem:${mountId}:action`);
      EventLink.removeEventListener(`statusBarItem:${mountId}:onDidUnmount`);
    });
  }


  public register() {
    EventLink.addEventListener(`statusBarItem:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeEventListener(`statusBarItem:${this.key}:onDidMount`);
  }

  public serialize(): TSerializableStatusBarItem {
    if (!this.internalValue.label) throw new Error(`Label not defined for "${this.key}" status bar item`);
    if (!this.internalValue.side) throw new Error(`Side not defined for "${this.key}" status bar item`);

    return {
      key: this.key,
      icon: this.internalValue.icon,
      side: this.internalValue.side,
      label: this.internalValue.label,
      description: this.internalValue.description,
    };
  }
}
