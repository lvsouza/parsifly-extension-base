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
  public readonly registerId: string;
  public readonly key: TListViewItemConstructor['key'];
  public readonly onDidMount: TListViewItemConstructor['onDidMount'];
  public readonly defaultValue: NonNullable<Partial<TListViewItemConstructor['initialValue']>>;


  constructor(props: TListViewItemConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.registerId = crypto.randomUUID();
    this.defaultValue = props.initialValue || {};
  }


  #createContext(internalValue: typeof this.defaultValue, mountId: string): TListItemMountContext {
    return {
      currentValue: internalValue as TListViewItem,
      refetchChildren: async () => {
        return await EventLink.sendEvent(`listItem:${mountId}:refetchChildren`);
      },
      set: async <GKey extends keyof TListViewItem>(property: GKey, newValue: TListViewItem[GKey]) => {
        switch (property) {
          case 'getItems':
          case 'onDidDrop':
          case 'onItemClick':
          case 'onItemToggle':
          case 'onItemDoubleClick':
          case 'getContextMenuItems':
            internalValue[property] = newValue;
            return;
          case 'editing':
            internalValue.editing = internalValue.disableEdit ? false : newValue as TListViewItem['editing'];
            return await EventLink.sendEvent(`listItem:${mountId}:set`, { property, newValue: internalValue.editing });
          case 'selected':
            internalValue.selected = internalValue.disableSelect ? false : newValue as TListViewItem['selected'];
            return await EventLink.sendEvent(`listItem:${mountId}:set`, { property, newValue: internalValue.selected });

          default:
            internalValue[property] = newValue;
            return await EventLink.sendEvent(`listItem:${mountId}:set`, { property, newValue });
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const internalValue = this.defaultValue;

    const context = this.#createContext(internalValue, mountId);

    EventLink.addEventListener(`listItem:${mountId}:onItemClick`, async () => await internalValue.onItemClick?.(context));
    EventLink.addEventListener(`listItem:${mountId}:onItemToggle`, async () => await internalValue.onItemToggle?.(context));
    EventLink.addEventListener(`listItem:${mountId}:onItemDoubleClick`, async () => await internalValue.onItemDoubleClick?.(context));
    EventLink.addEventListener(`listItem:${mountId}:onDidDrop`, async (event: TDropEvent) => await internalValue.onDidDrop?.(context, event));

    const registeredChildren = new Set<ListViewItem>();
    EventLink.addEventListener(`listItem:${mountId}:getItems`, async () => {
      const items = await internalValue.getItems?.(context) || [];

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
      const items = await internalValue.getContextMenuItems?.(context) || [];

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
    EventLink.addEventListener(`listItem:${this.registerId}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeEventListener(`listItem:${this.registerId}:onDidMount`);
  }

  public serialize(): TSerializableListViewItem {
    return {
      key: this.key,
      registerId: this.registerId,
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
