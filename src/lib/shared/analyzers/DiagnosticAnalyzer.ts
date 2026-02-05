import { DiagnosticViewItem } from '../components/diagnostic-view-item/DiagnosticViewItem';
import { TExtensionContext } from '../../context/TExtensionContext';
import { EventLink } from '../services/EventLink';
import { TQuery } from '../../types/TQuery';


export type TAnalyzerMode = 'perResource' | 'collection';

export type TAnalyzerResource = Record<string, any>;

export type TBaseExecutionProps = {
  addDiagnostic: (diagnostic: DiagnosticViewItem) => void;
};

export type TPerResourceExecutionProps<GResource extends TAnalyzerResource> = TBaseExecutionProps & {
  resource: GResource;
  resources: GResource[];
};

export type TCollectionExecutionProps<GResource extends TAnalyzerResource> = TBaseExecutionProps & {
  resources: GResource[];
};

export type TPerResourceDiagnosticAnalyzerProps<GResource extends TAnalyzerResource> = {
  key: string;
  mode: 'perResource';
  query: TQuery<GResource>;
  execute: (props: TPerResourceExecutionProps<GResource>) => Promise<void>;
};

export type TCollectionDiagnosticAnalyzerProps<GResource extends TAnalyzerResource> = {
  key: string;
  mode: 'collection';
  query: TQuery<GResource>;
  execute: (props: TCollectionExecutionProps<GResource>) => Promise<void>;
};

export type TDiagnosticAnalyzerProps<GResource extends TAnalyzerResource> =
  | TPerResourceDiagnosticAnalyzerProps<GResource>
  | TCollectionDiagnosticAnalyzerProps<GResource>;


export class DiagnosticAnalyzer<GResource extends TAnalyzerResource> {
  public readonly type = 'analyzer';
  public readonly key: string;
  public readonly mode: TAnalyzerMode;
  public readonly query: TQuery<GResource>;
  public readonly execute: TDiagnosticAnalyzerProps<GResource>['execute'];

  #diagnostics = new Set<DiagnosticViewItem>();
  #queryUnsubscribe: (() => Promise<void>) | null = null;
  #registrationController: AbortController | null = null;

  constructor(props: TDiagnosticAnalyzerProps<GResource>) {
    this.key = props.key;
    this.mode = props.mode;
    this.query = props.query;
    this.execute = props.execute;
  }

  public async register(extensionContext: TExtensionContext) {
    await this.unregister();

    const controller = new AbortController();
    this.#registrationController = controller;

    extensionContext
      .data
      .subscribe<GResource>({
        query: this.query,
        listener: async (data) => {
          if (controller.signal.aborted) return;

          const addDiagnostic = (diagnostic: DiagnosticViewItem) => { this.#diagnostics.add(diagnostic); };

          this.#diagnostics.forEach(diagnostic => diagnostic.unregister());
          this.#diagnostics.clear();

          try {
            if (this.mode === 'collection') {
              const executeFn = this.execute as (props: TCollectionExecutionProps<GResource>) => Promise<void>;
              await executeFn({ resources: data.rows, addDiagnostic });
            } else {
              const executeFn = this.execute as (props: TPerResourceExecutionProps<GResource>) => Promise<void>;
              await Promise.all(
                data.rows.map(row => (
                  executeFn({ resource: row, resources: data.rows, addDiagnostic })
                )),
              );
            }

            await EventLink.sendEvent(`diagnostics:change`, { [this.key]: this.diagnostics() });
          } catch (error) {
            console.error(`Error executing analyzer ${this.key}:`, error);
          }
        }
      })
      .then(async (unsubscribeFn) => {
        if (controller.signal.aborted) {
          await unsubscribeFn().catch(console.error);
          return;
        }

        this.#queryUnsubscribe = unsubscribeFn;
      })
      .catch((error) => {
        console.error(`Failed to subscribe analyzer ${this.key}:`, error);
      });
  }

  public async unregister() {
    this.#diagnostics.forEach(diagnostic => diagnostic.unregister());
    this.#diagnostics.clear();

    this.#registrationController?.abort();
    this.#registrationController = null;

    if (this.#queryUnsubscribe) {
      await this.#queryUnsubscribe().catch(console.error);
      this.#queryUnsubscribe = null;
    }
  }

  public diagnostics() {
    return Array.from(this.#diagnostics.values()).map(diagnostic => diagnostic.serialize());
  }
}
