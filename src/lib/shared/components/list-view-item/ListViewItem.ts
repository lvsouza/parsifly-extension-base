import { ContextMenuItem, TContextMenuItem } from '../ContextMenuItem';
import { TListItemMountContext, TListViewItem } from './TListViewItem';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { TDropEvent } from '../../../types/TDropEvent';
import { EventLink } from '../../services/EventLink';


export type TListViewItemConstructor = {
  key: string;
  initialValue?: Partial<TListViewItem>;
  onDidMount?: TOnDidMount<TListItemMountContext>;
}
export class ListViewItem {
  #registered: Set<ListViewItem | ContextMenuItem> = new Set();

  public readonly key: TListViewItemConstructor['key'];
  public readonly onDidMount: TListViewItemConstructor['onDidMount'];
  public readonly internalValue: NonNullable<Partial<TListViewItemConstructor['initialValue']>>;


  constructor(props: TListViewItemConstructor) {
    this.key = props.key;
    this.unregister = this.unregister;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
  }


  readonly #context: TListItemMountContext = {
    edit: async (value) => {
      return await EventLink.callStudioEvent(`listItem:${this.key}:edit`, value);
    },
    select: async (value) => {
      return await EventLink.callStudioEvent(`listItem:${this.key}:select`, value);
    },
    refetchChildren: async () => {
      return await EventLink.callStudioEvent(`listItem:${this.key}:refetchChildren`);
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
          return await EventLink.callStudioEvent(`listItem:${this.key}:set`, { property, newValue });
      }
    },
  };

  #mountId: string | undefined;
  #onDidUnmount: ((checkMountId: string) => Promise<void>) = async () => { };

  async #onDidMount(mountId: string): Promise<void> {
    if (this.#mountId) {
      await this.#onDidUnmount(this.#mountId);
      this.#mountId = mountId;
    }

    EventLink.setExtensionEvent(`listItem:${this.key}:onItemClick`, async () => this.internalValue.onItemClick?.(this.#context));
    EventLink.setExtensionEvent(`listItem:${this.key}:onItemDoubleClick`, async () => this.internalValue.onItemDoubleClick?.(this.#context));
    EventLink.setExtensionEvent(`listItem:${this.key}:onDidDrop`, async (event: TDropEvent) => this.internalValue.onDidDrop?.(this.#context, event));
    EventLink.setExtensionEvent(`listItem:${this.key}:getItems`, async () => {
      const items = await this.internalValue.getItems?.(this.#context) || [];

      for (const item of items) {
        item.register();
        this.#registered.add(item);
      }

      return items.map(field => field.serialize());
    });
    EventLink.setExtensionEvent(`listItem:${this.key}:getContextMenuItems`, async () => {
      const items = await this.internalValue.getContextMenuItems?.(this.#context) || [];

      items.forEach(item => {
        if (item.onClick) EventLink.setExtensionEvent(`contextMenuItem:${item.key}:onClick`, item.onClick);
        this.#registered.add(item);
      });

      return items.map(item => ({
        ...item,
        onClick: undefined,
        unregister: undefined,
        _registeredItems: undefined,
      })) as Partial<TContextMenuItem>[];
    });


    if (this.onDidMount) {
      this.onDidMount?.({
        ...this.#context,
        onDidUnmount: (didUnmount) => {
          this.#onDidUnmount = async (checkMountId) => {
            if (checkMountId !== this.#mountId) return;
            this.#mountId = undefined;

            await didUnmount();

            EventLink.removeExtensionEvent(`listItem:${this.key}:getItems`);
            EventLink.removeExtensionEvent(`listItem:${this.key}:onDidDrop`);
            EventLink.removeExtensionEvent(`listItem:${this.key}:onItemClick`);
            EventLink.removeExtensionEvent(`listItem:${this.key}:onDidUnmount`);
            EventLink.removeExtensionEvent(`listItem:${this.key}:onItemDoubleClick`);
            EventLink.removeExtensionEvent(`listItem:${this.key}:getContextMenuItems`);
          }

          EventLink.setExtensionEvent(`listItem:${this.key}:onDidUnmount`, this.#onDidUnmount);
        },
      });
    } else {
      EventLink.setExtensionEvent(`listItem:${this.key}:onDidUnmount`, async () => { });
    }
  }


  public register() {
    EventLink.setExtensionEvent(`listItem:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeExtensionEvent(`listItem:${this.key}:getItems`);
    EventLink.removeExtensionEvent(`listItem:${this.key}:onDidDrop`);
    EventLink.removeExtensionEvent(`listItem:${this.key}:onDidMount`);
    EventLink.removeExtensionEvent(`listItem:${this.key}:onItemClick`);
    EventLink.removeExtensionEvent(`listItem:${this.key}:onDidUnmount`);
    EventLink.removeExtensionEvent(`listItem:${this.key}:onItemDoubleClick`);
    EventLink.removeExtensionEvent(`listItem:${this.key}:getContextMenuItems`);

    this.#registered.forEach((field) => {
      if (field instanceof ListViewItem) {
        field.unregister();
      } else {
        EventLink.removeExtensionEvent(`contextMenuItem:${field.key}:onClick`);
      }
    });

    this.#registered.clear();
  }

  public serialize() {
    return {
      key: this.key,
      instanceId: this.key,
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
