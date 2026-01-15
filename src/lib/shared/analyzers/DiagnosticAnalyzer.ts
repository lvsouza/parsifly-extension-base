import { DiagnosticViewItem } from '../components/diagnostic-view-item/DiagnosticViewItem';
import { TExtensionContext } from '../../context/TExtensionContext';
import { EventLink } from '../services/EventLink';
import { TQuery } from '../../types/TQuery';


export type TAnalyzerMode = 'perResource' | 'collection';

export type TAnalyzerResource = Record<string, any>;

export type TExecutionProps<GMode extends TAnalyzerMode, GResource extends TAnalyzerResource> =
  & { addDiagnostic: (diagnostic: DiagnosticViewItem) => void }
  & (
    GMode extends 'perResource'
    ? { resource: GResource }
    : { resources: GResource[] }
  )

export interface IDiagnosticAnalyzerProps<GMode extends TAnalyzerMode, GResource extends TAnalyzerResource> {
  key: string;
  mode: GMode;
  query: TQuery;
  execute: (props: TExecutionProps<GMode, GResource>) => Promise<void>;
}

export class DiagnosticAnalyzer<GMode extends TAnalyzerMode = TAnalyzerMode, GResource extends TAnalyzerResource = TAnalyzerResource> {
  public readonly type = 'analyzer';
  public readonly key: IDiagnosticAnalyzerProps<GMode, GResource>['key'];
  public readonly mode: IDiagnosticAnalyzerProps<GMode, GResource>['mode'];
  public readonly query: IDiagnosticAnalyzerProps<GMode, GResource>['query'];
  public readonly execute: IDiagnosticAnalyzerProps<GMode, GResource>['execute'];

  #diagnostics = new Set<DiagnosticViewItem>();
  #queryUnsubscribe: (() => Promise<void>) | null = null;
  #registrationController: AbortController | null = null;

  constructor(props: IDiagnosticAnalyzerProps<GMode, GResource>) {
    this.key = props.key;
    this.mode = props.mode;
    this.query = props.query;
    this.execute = props.execute;
  }

  public register(extensionContext: TExtensionContext) {
    this.unregister();

    const controller = new AbortController();
    this.#registrationController = controller;

    extensionContext
      .data
      .subscribe<GResource>({
        query: this.query,
        listener: async (data) => {
          if (controller.signal.aborted) return;

          const addDiagnostic = (diagnostic: DiagnosticViewItem) => { this.#diagnostics.add(diagnostic); }
          this.#diagnostics.forEach(diagnostic => diagnostic.unregister());
          this.#diagnostics.clear();

          try {
            if (this.mode === 'collection') {
              await this.execute({ resources: data.rows, addDiagnostic } as unknown as TExecutionProps<GMode, GResource>);
            } else {
              await Promise.all(
                data.rows.map(row => (
                  this.execute({ resource: row, addDiagnostic } as unknown as TExecutionProps<GMode, GResource>)
                )),
              );
            }

            await EventLink.sendEvent(`diagnostics:change`, { [this.key]: this.diagnostics() });
          } catch (error) {
            console.error(`Error executing analyzer ${this.key}:`, error);
          }
        }
      })
      .then((unsubscribeFn) => {
        if (controller.signal.aborted) {
          unsubscribeFn().catch(console.error);
          return;
        }

        this.#queryUnsubscribe = unsubscribeFn;
      })
      .catch((error) => {
        console.error(`Failed to subscribe analyzer ${this.key}:`, error);
      });
  }

  public unregister() {
    this.#diagnostics.forEach(diagnostic => diagnostic.unregister());
    this.#diagnostics.clear();

    this.#registrationController?.abort();
    this.#registrationController = null;

    if (this.#queryUnsubscribe) {
      this.#queryUnsubscribe().catch(console.error);
      this.#queryUnsubscribe = null;
    }
  }

  public diagnostics() {
    return Array.from(this.#diagnostics.values()).map(diagnostic => diagnostic.serialize())
  }
}
