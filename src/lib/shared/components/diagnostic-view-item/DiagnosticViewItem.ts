import { TDiagnosticViewItemMountContext, TDiagnosticViewItem, TSerializableDiagnosticViewItem } from './TDiagnosticViewItem';
import { ContextMenuItem } from '../context-menu-items/ContextMenuItem';
import { TOnDidMount } from '../../../types/TOnDidMount';
import { EventLink } from '../../services/EventLink';


export type TDiagnosticItemConstructor = {
  key: string;
  initialValue?: Partial<TDiagnosticViewItem>;
  onDidMount?: TOnDidMount<TDiagnosticViewItemMountContext>;
}
export class DiagnosticViewItem {
  #registered: Set<DiagnosticViewItem | ContextMenuItem> = new Set();

  public readonly key: TDiagnosticItemConstructor['key'];
  public readonly onDidMount: TDiagnosticItemConstructor['onDidMount'];
  public readonly internalValue: NonNullable<Partial<TDiagnosticItemConstructor['initialValue']>>;


  constructor(props: TDiagnosticItemConstructor) {
    this.key = props.key;
    this.unregister = this.unregister;
    this.onDidMount = props.onDidMount;
    this.internalValue = props.initialValue || {};
  }


  readonly #context: TDiagnosticViewItemMountContext = {
    select: async (value) => {
      return await EventLink.callStudioEvent(`diagnosticViewItem:${this.key}:select`, value);
    },
    refetchChildren: async () => {
      return await EventLink.callStudioEvent(`diagnosticViewItem:${this.key}:refetchRelated`);
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
          return await EventLink.callStudioEvent(`diagnosticViewItem:${this.key}:set`, { property, newValue });
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

    EventLink.setExtensionEvent(`diagnosticViewItem:${this.key}:onItemClick`, async () => this.internalValue.onItemClick?.(this.#context));
    EventLink.setExtensionEvent(`diagnosticViewItem:${this.key}:onItemDoubleClick`, async () => this.internalValue.onItemDoubleClick?.(this.#context));
    EventLink.setExtensionEvent(`diagnosticViewItem:${this.key}:getRelated`, async () => {
      const items = await this.internalValue.getRelated?.(this.#context) || [];

      for (const item of items) {
        item.register();
        this.#registered.add(item);
      }

      return items.map(field => field.serialize());
    });
    EventLink.setExtensionEvent(`diagnosticViewItem:${this.key}:getActions`, async () => {
      const items = await this.internalValue.getActions?.(this.#context) || [];

      items.forEach(item => {
        item.register();
        this.#registered.add(item);
      });

      return items.map(item => item.serialize());
    });


    if (this.onDidMount) {
      this.onDidMount?.({
        ...this.#context,
        onDidUnmount: (didUnmount) => {
          this.#onDidUnmount = async (checkMountId) => {
            if (checkMountId !== this.#mountId) return;
            this.#mountId = undefined;

            await didUnmount();

            this.#registered.forEach((item) => item.unregister());
            this.#registered.clear();

            EventLink.removeExtensionEvent(`diagnosticViewItem:${this.key}:getRelated`);
            EventLink.removeExtensionEvent(`diagnosticViewItem:${this.key}:getActions`);
            EventLink.removeExtensionEvent(`diagnosticViewItem:${this.key}:onItemClick`);
            EventLink.removeExtensionEvent(`diagnosticViewItem:${this.key}:onDidUnmount`);
            EventLink.removeExtensionEvent(`diagnosticViewItem:${this.key}:onItemDoubleClick`);
          }

          EventLink.setExtensionEvent(`diagnosticViewItem:${this.key}:onDidUnmount`, this.#onDidUnmount);
        },
      });
    } else {
      EventLink.setExtensionEvent(`diagnosticViewItem:${this.key}:onDidUnmount`, async () => { });
    }
  }


  public register() {
    EventLink.setExtensionEvent(`diagnosticViewItem:${this.key}:onDidMount`, this.#onDidMount.bind(this));
  }

  public unregister() {
    EventLink.removeExtensionEvent(`diagnosticViewItem:${this.key}:getRelated`);
    EventLink.removeExtensionEvent(`diagnosticViewItem:${this.key}:onDidMount`);
    EventLink.removeExtensionEvent(`diagnosticViewItem:${this.key}:getActions`);
    EventLink.removeExtensionEvent(`diagnosticViewItem:${this.key}:onItemClick`);
    EventLink.removeExtensionEvent(`diagnosticViewItem:${this.key}:onDidUnmount`);
    EventLink.removeExtensionEvent(`diagnosticViewItem:${this.key}:onItemDoubleClick`);

    this.#registered.forEach((item) => item.unregister());
    this.#registered.clear();
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
