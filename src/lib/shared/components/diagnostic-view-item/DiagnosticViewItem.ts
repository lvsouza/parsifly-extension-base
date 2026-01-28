import { TDiagnosticViewItemMountContext, TDiagnosticViewItem, TSerializableDiagnosticViewItem } from './TDiagnosticViewItem';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';
import { Action } from '../actions/Actions';


export type TDiagnosticItemConstructor = {
  key: string;
  initialValue?: Partial<TDiagnosticViewItem>;
  onDidMount?: TOnDidMount<TDiagnosticViewItemMountContext>;
}
export class DiagnosticViewItem {
  public readonly registerId: string;
  public readonly key: TDiagnosticItemConstructor['key'];
  public readonly onDidMount: TDiagnosticItemConstructor['onDidMount'];
  public readonly defaultValue: NonNullable<TDiagnosticItemConstructor['initialValue']>;


  constructor(props: TDiagnosticItemConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.registerId = crypto.randomUUID();
    this.defaultValue = props.initialValue || {};
  }


  #createContext(internalValue: typeof this.defaultValue, mountId: string): TDiagnosticViewItemMountContext {
    return {
      currentValue: internalValue as TDiagnosticViewItem,
      select: async (value) => {
        return await EventLink.sendEvent(`diagnosticViewItem:${mountId}:select`, value);
      },
      refetchChildren: async () => {
        return await EventLink.sendEvent(`diagnosticViewItem:${mountId}:refetchRelated`);
      },
      set: async <GKey extends keyof TDiagnosticViewItem>(property: GKey, newValue: TDiagnosticViewItem[GKey]) => {
        switch (property) {
          case 'getRelated':
          case 'getActions':
          case 'onItemClick':
          case 'onItemDoubleClick':
            internalValue[property] = newValue;
            return;

          default:
            internalValue[property] = newValue;
            return await EventLink.sendEvent(`diagnosticViewItem:${mountId}:set`, { property, newValue });
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const internalValue = this.defaultValue;

    const context = this.#createContext(internalValue, mountId);

    EventLink.addEventListener(`diagnosticViewItem:${mountId}:onItemClick`, async () => internalValue.onItemClick?.(context));
    EventLink.addEventListener(`diagnosticViewItem:${mountId}:onItemDoubleClick`, async () => internalValue.onItemDoubleClick?.(context));

    const registeredRelatedDiagnosticItems = new Set<DiagnosticViewItem>();
    EventLink.addEventListener(`diagnosticViewItem:${mountId}:getRelated`, async () => {
      const items = await internalValue.getRelated?.(context) || [];

      registeredRelatedDiagnosticItems.forEach((item) => item.unregister());
      registeredRelatedDiagnosticItems.clear();

      for (const item of items) {
        item.register();
        registeredRelatedDiagnosticItems.add(item);
      }

      return items.map(item => item.serialize());
    });

    const registeredActions = new Set<Action>();
    EventLink.addEventListener(`diagnosticViewItem:${mountId}:getActions`, async () => {
      const items = await internalValue.getActions?.(context) || [];

      registeredActions.forEach((item) => item.unregister());
      registeredActions.clear();

      for (const item of items) {
        item.register();
        registeredActions.add(item);
      }

      return items.map(item => item.serialize());
    });


    const onDidUnmount = await this.onDidMount?.(context);

    EventLink.addEventListener(`diagnosticViewItem:${mountId}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      registeredActions.forEach((item) => item.unregister());
      registeredActions.clear();

      EventLink.removeEventListener(`diagnosticViewItem:${mountId}:getRelated`);
      EventLink.removeEventListener(`diagnosticViewItem:${mountId}:getActions`);
      EventLink.removeEventListener(`diagnosticViewItem:${mountId}:onItemClick`);
      EventLink.removeEventListener(`diagnosticViewItem:${mountId}:onDidUnmount`);
      EventLink.removeEventListener(`diagnosticViewItem:${mountId}:onItemDoubleClick`);
    });
  }


  public register() {
    EventLink.addEventListener(`diagnosticViewItem:${this.registerId}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeEventListener(`diagnosticViewItem:${this.registerId}:onDidMount`);
  }

  public serialize(): TSerializableDiagnosticViewItem {
    if (!this.defaultValue.message) throw new Error(`Message not defined for "${this.key}" diagnostic`)
    if (!this.defaultValue.ruleId) throw new Error(`Rule not defined for "${this.key}" diagnostic`)
    if (!this.defaultValue.target) throw new Error(`Target not defined for "${this.key}" diagnostic`)
    if (!this.defaultValue.severity) throw new Error(`Severity not defined for "${this.key}" diagnostic`)

    return {
      key: this.key,
      registerId: this.registerId,
      icon: this.defaultValue.icon,
      code: this.defaultValue.code,
      opened: this.defaultValue.opened,
      ruleId: this.defaultValue.ruleId,
      message: this.defaultValue.message,
      children: this.defaultValue.children,
      category: this.defaultValue.category,
      severity: this.defaultValue.severity,
      disableSelect: this.defaultValue.disableSelect,
      documentation: !this.defaultValue.documentation ? undefined : {
        summary: this.defaultValue.documentation.summary,
        url: this.defaultValue.documentation.url,
      },
      target: {
        resourceType: this.defaultValue.target.resourceType,
        resourceId: this.defaultValue.target.resourceId,
        property: this.defaultValue.target.property,
      },
    };
  }
}
