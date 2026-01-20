import { TListItemMountContext, TListViewItem, TSerializableListViewItem } from './TListViewItem';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { TDropEvent } from '../../../types/TDropEvent';
import { EventLink } from '../../services/EventLink';
import { Action } from '../actions/Actions';


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


  #createContext(mountId: string, abortController: AbortController): TListItemMountContext {
    return {
      refetchChildren: async () => {
        if (abortController.signal.aborted) return;
        if (!this.internalValue.children) return;
        try {
          return await EventLink.sendEvent(`listItem:${mountId}:refetchChildren`);
        } catch (error) {
          console.log(this, error);
          return
        }
      },
      set: async <GKey extends keyof TListViewItem>(property: GKey, newValue: TListViewItem[GKey]) => {
        if (abortController.signal.aborted) return;

        switch (property) {
          case 'getItems':
          case 'onDidDrop':
          case 'onItemClick':
          case 'onItemDoubleClick':
          case 'getContextMenuItems':
            this.internalValue[property] = newValue;
            return;
          case 'editing':
            this.internalValue.editing = this.internalValue.disableEdit ? false : newValue as TListViewItem['editing'];
            return await EventLink.sendEvent(`listItem:${mountId}:set`, { property, newValue: this.internalValue.editing });
          case 'selected':
            this.internalValue.selected = this.internalValue.disableSelect ? false : newValue as TListViewItem['selected'];
            return await EventLink.sendEvent(`listItem:${mountId}:set`, { property, newValue: this.internalValue.selected });

          default:
            this.internalValue[property] = newValue;
            try {
              return await EventLink.sendEvent(`listItem:${mountId}:set`, { property, newValue });
            } catch (error) {
              console.log(abortController.signal.aborted, this, error);
              return
            }
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const abortController = new AbortController();

    const context = this.#createContext(mountId, abortController);

    EventLink.addEventListener(`listItem:${mountId}:onItemClick`, async () => this.internalValue.onItemClick?.(context));
    EventLink.addEventListener(`listItem:${mountId}:onItemDoubleClick`, async () => this.internalValue.onItemDoubleClick?.(context));
    EventLink.addEventListener(`listItem:${mountId}:onDidDrop`, async (event: TDropEvent) => this.internalValue.onDidDrop?.(context, event));

    const registeredChildren = new Set<ListViewItem>();
    EventLink.addEventListener(`listItem:${mountId}:getItems`, async () => {
      const items = await this.internalValue.getItems?.(context) || [];

      registeredChildren.forEach((item) => item.unregister());
      registeredChildren.clear();

      for (const item of items) {
        item.register();
        registeredChildren.add(item);
      }

      return items.map(item => item.serialize());
    });

    const registeredContextMenuItems = new Set<Action>();
    EventLink.addEventListener(`listItem:${mountId}:getContextMenuItems`, async () => {
      const items = await this.internalValue.getContextMenuItems?.(context) || [];

      registeredContextMenuItems.forEach((item) => item.unregister());
      registeredContextMenuItems.clear();

      items.forEach(item => {
        item.register();
        registeredContextMenuItems.add(item);
      });

      return items.map(item => item.serialize());
    });


    const onDidUnmount = await this.onDidMount?.(context);

    EventLink.addEventListener(`listItem:${mountId}:onDidUnmount`, async () => {
      abortController.abort();

      await onDidUnmount?.();

      registeredChildren.forEach((item) => item.unregister());
      registeredChildren.clear();

      registeredContextMenuItems.forEach((item) => item.unregister());
      registeredContextMenuItems.clear();

      EventLink.removeEventListener(`listItem:${mountId}:getItems`);
      EventLink.removeEventListener(`listItem:${mountId}:onDidDrop`);
      EventLink.removeEventListener(`listItem:${mountId}:onItemClick`);
      EventLink.removeEventListener(`listItem:${mountId}:onDidUnmount`);
      EventLink.removeEventListener(`listItem:${mountId}:onItemDoubleClick`);
      EventLink.removeEventListener(`listItem:${mountId}:getContextMenuItems`);
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
      editing: this.internalValue.editing,
      selected: this.internalValue.selected,
      children: this.internalValue.children,
      dropAccepts: this.internalValue.dropAccepts,
      description: this.internalValue.description,
      disableEdit: this.internalValue.disableEdit,
      dragProvides: this.internalValue.dragProvides,
      disableSelect: this.internalValue.disableSelect,
    };
  }
}
