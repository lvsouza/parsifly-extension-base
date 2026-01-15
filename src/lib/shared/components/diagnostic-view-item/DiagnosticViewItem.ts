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
  public readonly internalValue: NonNullable<Partial<TDiagnosticItemConstructor['initialValue']>>;


  constructor(props: TDiagnosticItemConstructor) {
    this.key = props.key;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
  }


  readonly #context: TDiagnosticViewItemMountContext = {
    select: async (value) => {
      return await EventLink.sendEvent(`diagnosticViewItem:${this.key}:select`, value);
    },
    refetchChildren: async () => {
      return await EventLink.sendEvent(`diagnosticViewItem:${this.key}:refetchRelated`);
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
          return await EventLink.sendEvent(`diagnosticViewItem:${this.key}:set`, { property, newValue });
      }
    },
  };


  async #onDidMount(_mountId: string): Promise<void> {
    EventLink.addEventListener(`diagnosticViewItem:${this.key}:onItemClick`, async () => this.internalValue.onItemClick?.(this.#context));
    EventLink.addEventListener(`diagnosticViewItem:${this.key}:onItemDoubleClick`, async () => this.internalValue.onItemDoubleClick?.(this.#context));

    const registeredRelatedDiagnosticItems = new Set<DiagnosticViewItem>();
    EventLink.addEventListener(`diagnosticViewItem:${this.key}:getRelated`, async () => {
      const items = await this.internalValue.getRelated?.(this.#context) || [];

      registeredRelatedDiagnosticItems.forEach((item) => item.unregister());
      registeredRelatedDiagnosticItems.clear();

      for (const item of items) {
        item.register();
        registeredRelatedDiagnosticItems.add(item);
      }

      return items.map(item => item.serialize());
    });

    const registeredActions = new Set<Action>();
    EventLink.addEventListener(`diagnosticViewItem:${this.key}:getActions`, async () => {
      const items = await this.internalValue.getActions?.(this.#context) || [];

      registeredActions.forEach((item) => item.unregister());
      registeredActions.clear();

      for (const item of items) {
        item.register();
        registeredActions.add(item);
      }

      return items.map(item => item.serialize());
    });


    const onDidUnmount = await this.onDidMount?.(this.#context);

    EventLink.addEventListener(`diagnosticViewItem:${this.key}:onDidUnmount`, async () => {
      await onDidUnmount?.();

      registeredActions.forEach((item) => item.unregister());
      registeredActions.clear();

      EventLink.removeEventListener(`diagnosticViewItem:${this.key}:getRelated`);
      EventLink.removeEventListener(`diagnosticViewItem:${this.key}:getActions`);
      EventLink.removeEventListener(`diagnosticViewItem:${this.key}:onItemClick`);
      EventLink.removeEventListener(`diagnosticViewItem:${this.key}:onDidUnmount`);
      EventLink.removeEventListener(`diagnosticViewItem:${this.key}:onItemDoubleClick`);
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
