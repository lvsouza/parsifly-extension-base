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
  public readonly key: TDiagnosticItemConstructor['key'];
  public readonly onDidMount: TDiagnosticItemConstructor['onDidMount'];
  public readonly internalValue: NonNullable<TDiagnosticItemConstructor['initialValue']>;


  constructor(props: TDiagnosticItemConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
  }


  #createContext(mountId: string): TDiagnosticViewItemMountContext {
    return {
      currentValue: this.internalValue as TDiagnosticViewItem,
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
            this.internalValue[property] = newValue;
            return;

          default:
            this.internalValue[property] = newValue;
            return await EventLink.sendEvent(`diagnosticViewItem:${mountId}:set`, { property, newValue });
        }
      },
    };
  };


  async #onDidMount(mountId: string): Promise<void> {
    const context = this.#createContext(mountId);

    EventLink.addEventListener(`diagnosticViewItem:${mountId}:onItemClick`, async () => this.internalValue.onItemClick?.(context));
    EventLink.addEventListener(`diagnosticViewItem:${mountId}:onItemDoubleClick`, async () => this.internalValue.onItemDoubleClick?.(context));

    const registeredRelatedDiagnosticItems = new Set<DiagnosticViewItem>();
    EventLink.addEventListener(`diagnosticViewItem:${mountId}:getRelated`, async () => {
      const items = await this.internalValue.getRelated?.(context) || [];

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
      const items = await this.internalValue.getActions?.(context) || [];

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
    EventLink.addEventListener(`diagnosticViewItem:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeEventListener(`diagnosticViewItem:${this.key}:onDidMount`);
  }

  public serialize(): TSerializableDiagnosticViewItem {
    if (!this.internalValue.message) throw new Error(`Message not defined for "${this.key}" diagnostic`)
    if (!this.internalValue.ruleId) throw new Error(`Rule not defined for "${this.key}" diagnostic`)
    if (!this.internalValue.target) throw new Error(`Target not defined for "${this.key}" diagnostic`)
    if (!this.internalValue.severity) throw new Error(`Severity not defined for "${this.key}" diagnostic`)

    return {
      key: this.key,
      icon: this.internalValue.icon,
      code: this.internalValue.code,
      opened: this.internalValue.opened,
      ruleId: this.internalValue.ruleId,
      message: this.internalValue.message,
      children: this.internalValue.children,
      category: this.internalValue.category,
      severity: this.internalValue.severity,
      disableSelect: this.internalValue.disableSelect,
      documentation: !this.internalValue.documentation ? undefined : {
        summary: this.internalValue.documentation.summary,
        url: this.internalValue.documentation.url,
      },
      target: {
        resourceType: this.internalValue.target.resourceType,
        resourceId: this.internalValue.target.resourceId,
        property: this.internalValue.target.property,
      },
    };
  }
}
