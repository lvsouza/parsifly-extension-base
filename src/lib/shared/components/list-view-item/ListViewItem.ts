import { TListItemMountContext, TListViewItem, TSerializableListViewItem } from './TListViewItem';
import { PlatformAction } from '../platform-actions/PlatformActions';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { TDropEvent } from '../../../types/TDropEvent';
import { EventLink } from '../../services/EventLink';


export type TListViewItemConstructor = {
  key: string;
  initialValue?: Partial<TListViewItem>;
  onDidMount?: TOnDidMount<TListItemMountContext>;
}
export class ListViewItem {
  public readonly key: TListViewItemConstructor['key'];
  public readonly onDidMount: TListViewItemConstructor['onDidMount'];
  public readonly internalValue: NonNullable<Partial<TListViewItemConstructor['initialValue']>>;


  constructor(props: TListViewItemConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
  }


  readonly #context: TListItemMountContext = {
    edit: async (value) => {
      return await EventLink.sendEvent(`listItem:${this.key}:edit`, value);
    },
    select: async (value) => {
      return await EventLink.sendEvent(`listItem:${this.key}:select`, value);
    },
    refetchChildren: async () => {
      return await EventLink.sendEvent(`listItem:${this.key}:refetchChildren`);
    },
    set: async <GKey extends keyof TListViewItem>(property: GKey, newValue: TListViewItem[GKey]) => {
      switch (property) {
        case 'getItems':
        case 'onDidDrop':
        case 'onItemClick':
        case 'onItemDoubleClick':
        case 'getContextMenuItems':
          this.internalValue[property] = newValue;
          return;

        default:
          this.internalValue[property] = newValue;
          return await EventLink.sendEvent(`listItem:${this.key}:set`, { property, newValue });
      }
    },
  };


  async #onDidMount(_mountId: string): Promise<void> {
    EventLink.addEventListener(`listItem:${this.key}:onItemClick`, async () => this.internalValue.onItemClick?.(this.#context));
    EventLink.addEventListener(`listItem:${this.key}:onItemDoubleClick`, async () => this.internalValue.onItemDoubleClick?.(this.#context));
    EventLink.addEventListener(`listItem:${this.key}:onDidDrop`, async (event: TDropEvent) => this.internalValue.onDidDrop?.(this.#context, event));

    const registeredChildren = new Set<ListViewItem>();
    EventLink.addEventListener(`listItem:${this.key}:getItems`, async () => {
      const items = await this.internalValue.getItems?.(this.#context) || [];

      registeredChildren.forEach((item) => item.unregister());
      registeredChildren.clear();

      for (const item of items) {
        item.register();
        registeredChildren.add(item);
      }

      return items.map(item => item.serialize());
    });

    const registeredContextMenuItems = new Set<PlatformAction>();
    EventLink.addEventListener(`listItem:${this.key}:getContextMenuItems`, async () => {
      const items = await this.internalValue.getContextMenuItems?.(this.#context) || [];

      registeredContextMenuItems.forEach((item) => item.unregister());
      registeredContextMenuItems.clear();

      items.forEach(item => {
        item.register();
        registeredContextMenuItems.add(item);
      });

      return items.map(item => item.serialize());
    });


    const onDidUnmount = await this.onDidMount?.(this.#context);

    EventLink.addEventListener(`listItem:${this.key}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      registeredChildren.forEach((item) => item.unregister());
      registeredChildren.clear();

      registeredContextMenuItems.forEach((item) => item.unregister());
      registeredContextMenuItems.clear();

      EventLink.removeEventListener(`listItem:${this.key}:getItems`);
      EventLink.removeEventListener(`listItem:${this.key}:onDidDrop`);
      EventLink.removeEventListener(`listItem:${this.key}:onItemClick`);
      EventLink.removeEventListener(`listItem:${this.key}:onDidUnmount`);
      EventLink.removeEventListener(`listItem:${this.key}:onItemDoubleClick`);
      EventLink.removeEventListener(`listItem:${this.key}:getContextMenuItems`);
    });
  }


  public register() {
    EventLink.addEventListener(`listItem:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeEventListener(`listItem:${this.key}:onDidMount`);
  }

  public serialize(): TSerializableListViewItem {
    return {
      key: this.key,
      icon: this.internalValue.icon,
      label: this.internalValue.label,
      extra: this.internalValue.extra,
      title: this.internalValue.title,
      opened: this.internalValue.opened,
      children: this.internalValue.children,
      dropAccepts: this.internalValue.dropAccepts,
      description: this.internalValue.description,
      dragProvides: this.internalValue.dragProvides,
      disableSelect: this.internalValue.disableSelect,
    };
  }
}
