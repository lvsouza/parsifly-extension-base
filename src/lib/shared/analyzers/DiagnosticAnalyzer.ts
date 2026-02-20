import { DiagnosticViewItem } from '../components/diagnostic-view-item/DiagnosticViewItem';
import { EventLink } from '../services/EventLink';


export type TAnalyzerMode = 'perResource' | 'collection';

export type TAnalyzerResource = Record<string, any>;

export type TAnalyzerData<GResource extends TAnalyzerResource> = {
  resources: GResource[];
};

export type TAnalyzerListener<GResource extends TAnalyzerResource> = (data: TAnalyzerData<GResource>) => Promise<void> | void;

export type TAnalyzerUnsubscribe = () => Promise<void> | void;

export type TAnalyzerSubscribe<GResource extends TAnalyzerResource> = (listener: TAnalyzerListener<GResource>) => Promise<TAnalyzerUnsubscribe> | TAnalyzerUnsubscribe;


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
  subscribe: TAnalyzerSubscribe<GResource>;
  execute: (props: TPerResourceExecutionProps<GResource>) => Promise<void>;
};

export type TCollectionDiagnosticAnalyzerProps<GResource extends TAnalyzerResource> = {
  key: string;
  mode: 'collection';
  subscribe: TAnalyzerSubscribe<GResource>;
  execute: (props: TCollectionExecutionProps<GResource>) => Promise<void>;
};

export type TDiagnosticAnalyzerProps<GResource extends TAnalyzerResource> =
  | TPerResourceDiagnosticAnalyzerProps<GResource>
  | TCollectionDiagnosticAnalyzerProps<GResource>;


export class DiagnosticAnalyzer<GResource extends TAnalyzerResource> {
  public readonly type = 'analyzer';
  public readonly key: string;
  public readonly mode: TAnalyzerMode;
  public readonly subscribeFn: TAnalyzerSubscribe<GResource>;
  public readonly execute: TDiagnosticAnalyzerProps<GResource>['execute'];

  #diagnostics = new Set<DiagnosticViewItem>();
  #unsubscribe: TAnalyzerUnsubscribe | null = null;
  #registrationController: AbortController | null = null;

  constructor(props: TDiagnosticAnalyzerProps<GResource>) {
    this.key = props.key;
    this.mode = props.mode;
    this.subscribeFn = props.subscribe;
    this.execute = props.execute;
  }

  public async register() {
    await this.unregister();

    const controller = new AbortController();
    this.#registrationController = controller;

    try {
      const unsubscribeFn = await this.subscribeFn(async (data) => {
        if (controller.signal.aborted) return;
        await this.#processData(data);
      });

      if (controller.signal.aborted) {
        await unsubscribeFn?.();
        return;
      }

      this.#unsubscribe = unsubscribeFn;
    } catch (error) {
      console.error(`Failed to subscribe analyzer ${this.key}:`, error);
    }
  }

  async #processData(data: TAnalyzerData<GResource>) {
    const addDiagnostic = (diagnostic: DiagnosticViewItem) => { this.#diagnostics.add(diagnostic); };

    this.#diagnostics.forEach(diagnostic => diagnostic.unregister());
    this.#diagnostics.clear();

    try {
      if (this.mode === 'collection') {
        const executeFn = this.execute as (props: TCollectionExecutionProps<GResource>) => Promise<void>;
        await executeFn({ resources: data.resources, addDiagnostic });
      } else {
        const executeFn = this.execute as (props: TPerResourceExecutionProps<GResource>) => Promise<void>;
        await Promise.all(
          data.resources.map(resource => (
            executeFn({ resource: resource, resources: data.resources, addDiagnostic })
          )),
        );
      }

      await EventLink.sendEvent(`diagnostics:change`, { [this.key]: this.diagnostics() });
    } catch (error) {
      console.error(`Error executing analyzer ${this.key}:`, error);
    }
  }

  public async unregister() {
    this.#diagnostics.forEach(diagnostic => diagnostic.unregister());
    this.#diagnostics.clear();

    this.#registrationController?.abort();
    this.#registrationController = null;

    if (this.#unsubscribe) {
      await this.#unsubscribe();
      this.#unsubscribe = null;
    }
  }

  public diagnostics() {
    return Array.from(this.#diagnostics.values()).map(diagnostic => diagnostic.serialize());
  }
}
