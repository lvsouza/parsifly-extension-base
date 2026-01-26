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
  public readonly defaultValue: NonNullable<Partial<TListViewItemConstructor['initialValue']>>;


  constructor(props: TListViewItemConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.defaultValue = props.initialValue || {};
  }


  #createContext(mountId: string): TListItemMountContext {
    return {
      currentValue: this.defaultValue as TListViewItem,
      refetchChildren: async () => {
        try {
          return await EventLink.sendEvent(`listItem:${mountId}:refetchChildren`);
        } catch (error) {
          console.log(this, error);
          return
        }
      },
      set: async <GKey extends keyof TListViewItem>(property: GKey, newValue: TListViewItem[GKey]) => {
        switch (property) {
          case 'getItems':
          case 'onDidDrop':
          case 'onItemClick':
          case 'onItemToggle':
          case 'onItemDoubleClick':
          case 'getContextMenuItems':
            this.defaultValue[property] = newValue;
            return;
          case 'editing':
            this.defaultValue.editing = this.defaultValue.disableEdit ? false : newValue as TListViewItem['editing'];
            return await EventLink.sendEvent(`listItem:${mountId}:set`, { property, newValue: this.defaultValue.editing });
          case 'selected':
            this.defaultValue.selected = this.defaultValue.disableSelect ? false : newValue as TListViewItem['selected'];
            return await EventLink.sendEvent(`listItem:${mountId}:set`, { property, newValue: this.defaultValue.selected });

          default:
            this.defaultValue[property] = newValue;
            return await EventLink.sendEvent(`listItem:${mountId}:set`, { property, newValue });
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const context = this.#createContext(mountId);

    EventLink.addEventListener(`listItem:${mountId}:onItemClick`, async () => await this.defaultValue.onItemClick?.(context));
    EventLink.addEventListener(`listItem:${mountId}:onItemToggle`, async () => await this.defaultValue.onItemToggle?.(context));
    EventLink.addEventListener(`listItem:${mountId}:onItemDoubleClick`, async () => await this.defaultValue.onItemDoubleClick?.(context));
    EventLink.addEventListener(`listItem:${mountId}:onDidDrop`, async (event: TDropEvent) => await this.defaultValue.onDidDrop?.(context, event));

    const registeredChildren = new Set<ListViewItem>();
    EventLink.addEventListener(`listItem:${mountId}:getItems`, async () => {
      const items = await this.defaultValue.getItems?.(context) || [];

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
      const items = await this.defaultValue.getContextMenuItems?.(context) || [];

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

      registeredChildren.forEach((item) => item.unregister());
      registeredChildren.clear();

      registeredContextMenuItems.forEach((item) => item.unregister());
      registeredContextMenuItems.clear();

      EventLink.removeEventListener(`listItem:${mountId}:getItems`);
      EventLink.removeEventListener(`listItem:${mountId}:onDidDrop`);
      EventLink.removeEventListener(`listItem:${mountId}:onItemClick`);
      EventLink.removeEventListener(`listItem:${mountId}:onItemToggle`);
      EventLink.removeEventListener(`listItem:${mountId}:onDidUnmount`);
      EventLink.removeEventListener(`listItem:${mountId}:onItemDoubleClick`);
      EventLink.removeEventListener(`listItem:${mountId}:getContextMenuItems`);

      await onDidUnmount?.();
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
      icon: this.defaultValue.icon,
      label: this.defaultValue.label,
      extra: this.defaultValue.extra,
      title: this.defaultValue.title,
      opened: this.defaultValue.opened,
      editing: this.defaultValue.editing,
      selected: this.defaultValue.selected,
      children: this.defaultValue.children,
      dropAccepts: this.defaultValue.dropAccepts,
      description: this.defaultValue.description,
      disableEdit: this.defaultValue.disableEdit,
      dragProvides: this.defaultValue.dragProvides,
      disableSelect: this.defaultValue.disableSelect,
    };
  }
}
