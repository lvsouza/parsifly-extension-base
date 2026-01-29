import { TSerializableDiagnosticViewItem } from '../../shared/components/diagnostic-view-item/TDiagnosticViewItem';
import { DiagnosticAnalyzer, TAnalyzerMode, TAnalyzerResource } from '../../shared/analyzers/DiagnosticAnalyzer';
import { EventLink } from '../../shared/services/EventLink';
import { TExtensionContext } from '../TExtensionContext';


export class DiagnosticManager {
  #diagnostics: Set<((diagnostics: Record<string, TSerializableDiagnosticViewItem[]>) => void)> = new Set();
  #diagnosticAnalyzers: Set<DiagnosticAnalyzer> = new Set([]);


  constructor(private getContext: () => TExtensionContext) {
    EventLink.addEventListener('diagnostics:subscription', async (diagnostic) => this.#diagnostics.forEach(listener => listener(diagnostic as Record<string, TSerializableDiagnosticViewItem[]>)));
    EventLink.addEventListener('diagnostics:get', async () => {
      return Array
        .from(this.#diagnosticAnalyzers)
        .reduce((current, projectDescriptor) => {
          current[projectDescriptor.key] = projectDescriptor.diagnostics();
          return current;
        }, {} as Record<string, TSerializableDiagnosticViewItem[]>)
    });
  }


  /**
   * Retrieves the current list of diagnostics (errors, warnings) grouped by resource key.
   * @returns {Promise<Record<string, TSerializableDiagnosticViewItem[]>>} A map of diagnostic items.
   */
  public async get(): Promise<Record<string, TSerializableDiagnosticViewItem[]>> {
    return await EventLink.sendEvent(`diagnostics:get`);
  }

  /**
   * Subscribes to diagnostic updates.
   * @param listener Function called when diagnostics change.
   * @returns {() => void} A function to unsubscribe the listener.
   */
  public subscribe(listener: ((diagnostic: Record<string, TSerializableDiagnosticViewItem[]>) => Promise<void>)): (() => void) {
    this.#diagnostics.add(listener);
    return () => this.#diagnostics.delete(listener);
  }

  /**
   * Registers a diagnostic analyzer for a specific mode and resource.
   * @template GMode The analyzer mode.
   * @template GResource The resource type being analyzed.
   * @param analyzer The analyzer instance to register.
   */
  public async register<GMode extends TAnalyzerMode, GResource extends TAnalyzerResource>(analyzer: DiagnosticAnalyzer<GMode, GResource>) {
    await analyzer.register(this.getContext());
    this.#diagnosticAnalyzers.add(analyzer as DiagnosticAnalyzer);
  }

  /**
   * Unregisters a diagnostic analyzer.
   * @template GMode The analyzer mode.
   * @template GResource The resource type being analyzed.
   * @param analyzer The analyzer instance to unregister.
   */
  public async unregister<GMode extends TAnalyzerMode, GResource extends TAnalyzerResource>(analyzer: DiagnosticAnalyzer<GMode, GResource>) {
    await analyzer.unregister();
    this.#diagnosticAnalyzers.delete(analyzer as DiagnosticAnalyzer);
  }
}
