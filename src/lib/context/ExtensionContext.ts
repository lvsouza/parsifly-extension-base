import { CompletionsDescriptor, ICompletionsDescriptorIntent } from '../shared/descriptors/CompletionsDescriptor';
import { TSerializableCompletionViewItem } from '../shared/components/completion-view-item/TCompletionViewItem';
import { TSerializableDiagnosticViewItem } from '../shared/components/diagnostic-view-item/TDiagnosticViewItem';
import { DiagnosticAnalyzer, TAnalyzerMode, TAnalyzerResource } from '../shared/analyzers/DiagnosticAnalyzer';
import { ProjectDescriptor, TSerializableProjectDescriptor } from '../shared/descriptors/ProjectDescriptor';
import { TSerializableFieldViewItem } from '../shared/components/field-view-item/TFieldViewItem';
import { StatusBarItem } from '../shared/components/status-bar-items/StatusBarItems';
import { createDeterministicKey } from '../shared/services/CreateDeterministicKey';
import { FieldsDescriptor } from '../shared/descriptors/FieldsDescriptor';
import { TViewContentDefault } from '../shared/components/views/TView';
import { Action } from '../shared/components/actions/Actions';
import { Parser } from '../shared/components/parsers/Parser';
import { EventLink } from '../shared/services/EventLink';
import { TExtensionContext } from './TExtensionContext';
import { TFileOrFolder } from '../types/TFileOrFolder';
import { View } from '../shared/components/views/View';
import { TQuickPick } from '../types/TQuickPick';
import { DatabaseError } from '../types/TQuery';


export const defineExtensionContext = (): TExtensionContext => {
  const platformActions: Set<Action> = new Set([]);
  const statusBarItems: Set<StatusBarItem> = new Set([]);
  const parsers: Set<Parser> = new Set([]);
  const views: Set<View<TViewContentDefault>> = new Set([]);
  const selection: Set<((key: string[]) => void)> = new Set([]);
  const edition: Set<((key: string | undefined) => void)> = new Set([]);
  const data: Map<string, Set<((data: any) => Promise<void>)>> = new Map();
  const fields: Map<string, Set<((fields: TSerializableFieldViewItem[]) => void)>> = new Map();
  const diagnostics: Set<((diagnostics: Record<string, TSerializableDiagnosticViewItem[]>) => void)> = new Set();
  const fieldsDescriptors: Set<FieldsDescriptor> = new Set([]);
  const projectsDescriptors: Set<ProjectDescriptor> = new Set([]);
  const completionsDescriptors: Set<CompletionsDescriptor> = new Set([]);
  const diagnosticAnalyzers: Set<DiagnosticAnalyzer> = new Set([]);


  EventLink.addEventListener('selection:subscription', async keys => selection.forEach(listener => listener(keys as string[])));
  EventLink.addEventListener('edition:subscription', async key => edition.forEach(listener => listener(key as string | undefined)));
  EventLink.addEventListener('fields:subscription', async (key, fieldsChanged) => fields.get(key as string)?.forEach(listener => listener(fieldsChanged as TSerializableFieldViewItem[])));
  EventLink.addEventListener('diagnostics:subscription', async (diagnostic) => diagnostics.forEach(listener => listener(diagnostic as Record<string, TSerializableDiagnosticViewItem[]>)));

  EventLink.addEventListener('parsers:load', async () => Array.from(parsers).map(parser => parser.serialize()));
  EventLink.addEventListener('platformActions:load', async () => Array.from(platformActions).map(platformAction => platformAction.serialize()));
  EventLink.addEventListener('statusBarItems:load', async () => Array.from(statusBarItems).map(statusBarItem => statusBarItem.serialize()));
  EventLink.addEventListener('views:load', async () => Array.from(views).map(view => view.serialize()));
  EventLink.addEventListener('fields:get', async (key: string) => {
    return await Promise
      .all(
        Array
          .from(fieldsDescriptors)
          .map(async fieldsDescriptor => {
            const fields = await fieldsDescriptor.onGetFields(key);
            return fields;
          }),
      )
      .then(results => results.flatMap(result => result || []) || [])
  });
  EventLink.addEventListener('completions:get', async (intent: ICompletionsDescriptorIntent) => {
    return await Promise
      .all(
        Array
          .from(completionsDescriptors)
          .map(async completionsDescriptor => {
            const completions = await completionsDescriptor.onGetCompletions(intent);
            return completions;
          }),
      )
      .then(results => results.flatMap(result => result || []) || [])
  });
  EventLink.addEventListener('projects:get', async () => {
    return Array
      .from(projectsDescriptors)
      .map(projectDescriptor => projectDescriptor.serialize())
  });
  EventLink.addEventListener('diagnostics:get', async () => {
    return Array
      .from(diagnosticAnalyzers)
      .reduce((current, projectDescriptor) => {
        current[projectDescriptor.key] = projectDescriptor.diagnostics();
        return current;
      }, {} as Record<string, TSerializableDiagnosticViewItem[]>)
  });
  EventLink.addEventListener('data:watch', async (key: string, dataChanged: any) => {
    const listenerTriggers = Array.from(
      data
        .entries()
        .filter(([listenersKey]) => listenersKey === key)
        .flatMap(([, listeners]) => listeners)
        .map(listener => listener(dataChanged))
    );

    return await Promise.all(listenerTriggers)
  });


  const context: TExtensionContext = {
    quickPick: {
      show: async <T = unknown>(props: TQuickPick): Promise<T> => {
        await EventLink.sendEvent(`quickPick:show`, props);

        return new Promise(resolve => {
          EventLink.addEventListener('quickPick:onConfirm', async (result: T) => {
            EventLink.removeEventListener('quickPick:onConfirm');
            EventLink.removeEventListener('quickPick:onCancel');
            resolve(result);
            return;
          });
          EventLink.addEventListener('quickPick:onCancel', async (result: T) => {
            EventLink.removeEventListener('quickPick:onConfirm');
            EventLink.removeEventListener('quickPick:onCancel');
            resolve(result);
            return;
          });
        })
      },
    },
    platformActions: {
      reload: async () => {
        return await EventLink.sendEvent(`platformActions:change`, Array.from(platformActions).map(platformAction => platformAction.serialize()));
      },
      register: async (platformAction: Action) => {
        platformAction.register();
        platformActions.add(platformAction);
        await EventLink.sendEvent(`platformActions:change`, Array.from(platformActions).map(platformActions => platformActions.serialize()));
      },
      unregister: async (platformAction: Action) => {
        platformAction.unregister();
        platformActions.delete(platformAction);
        await EventLink.sendEvent(`platformActions:change`, Array.from(platformActions).map(platformAction => platformAction.serialize()));
      },
    },
    statusBarItems: {
      reload: async () => {
        return await EventLink.sendEvent(`statusBarItems:change`, Array.from(statusBarItems).map(statusBarItem => statusBarItem.serialize()));
      },
      register: async (statusBarItem: StatusBarItem) => {
        statusBarItem.register();
        statusBarItems.add(statusBarItem);
        await EventLink.sendEvent(`statusBarItems:change`, Array.from(statusBarItems).map(statusBarItem => statusBarItem.serialize()));
      },
      unregister: async (statusBarItem: StatusBarItem) => {
        statusBarItem.unregister();
        statusBarItems.delete(statusBarItem);
        await EventLink.sendEvent(`statusBarItems:change`, Array.from(statusBarItems).map(statusBarItem => statusBarItem.serialize()));
      },
    },
    parsers: {
      reload: async () => {
        return await EventLink.sendEvent(`parsers:change`, Array.from(parsers).map(parser => parser.serialize()));
      },
      register: async (parser: Parser) => {
        parser.register();
        parsers.add(parser);
        await EventLink.sendEvent(`parsers:change`, Array.from(parsers).map(parser => parser.serialize()));
      },
      unregister: async (parser: Parser) => {
        parser.unregister();
        parsers.delete(parser);
        await EventLink.sendEvent(`parsers:change`, Array.from(parsers).map(parser => parser.serialize()));
      },
    },
    views: {
      reload: async () => {
        return await EventLink.sendEvent(`views:change`, Array.from(views).map(view => view.serialize()));
      },
      register: async (view: View<TViewContentDefault>) => {
        view.register();
        views.add(view);
        await EventLink.sendEvent(`views:change`, Array.from(views).map(view => view.serialize()));
      },
      unregister: async (view: View<TViewContentDefault>) => {
        view.unregister();
        views.delete(view);
        await EventLink.sendEvent(`views:change`, Array.from(views).map(view => view.serialize()));
      },
      showPrimarySideBarByKey: async (key: string): Promise<void> => {
        return await EventLink.sendEvent<string, void>('views:primarySideBar:showByKey', key);
      },
      showSecondarySideBarByKey: async (key: string): Promise<void> => {
        return await EventLink.sendEvent<string, void>('views:secondarySideBar:showByKey', key);
      },
      showPanelByKey: async (key: string): Promise<void> => {
        return await EventLink.sendEvent<string, void>('views:panel:showByKey', key);
      },
    },
    selection: {
      select: async (key: string) => {
        await EventLink.sendEvent(`selection:select`, key);
      },
      unselect: async (key: string) => {
        await EventLink.sendEvent(`selection:unselect`, key);
      },
      get: async (): Promise<string[]> => {
        return await EventLink.sendEvent(`selection:get`);
      },
      subscribe: (listener: ((key: string[]) => Promise<void>)): (() => void) => {
        selection.add(listener);
        return () => selection.delete(listener);
      },
    },
    edition: {
      open: async (type: string, customData: any) => {
        await EventLink.sendEvent(`edition:open`, type, customData);
      },
      close: async () => {
        await EventLink.sendEvent(`edition:close`);
      },
      get: async (): Promise<string> => {
        return await EventLink.sendEvent(`edition:get`);
      },
      subscribe: (listener: ((key: string | undefined) => Promise<void>)): (() => void) => {
        edition.add(listener);
        return () => edition.delete(listener);
      },
    },
    fields: {
      get: async (key: string): Promise<TSerializableFieldViewItem[]> => {
        return await EventLink.sendEvent(`fields:get`, key);
      },
      refresh: async (key: string) => {
        await EventLink.sendEvent(`fields:refresh`, key);
      },
      subscribe: (key: string, listener: ((fields: TSerializableFieldViewItem[]) => Promise<void>)): (() => void) => {
        const listeners = fields.get(key)

        if (listeners) {
          listeners.add(listener);
        } else {
          fields.set(key, new Set([listener]))
        }

        return () => fields.get(key)?.delete(listener);
      },
      register: (fieldsDescriptor: FieldsDescriptor) => {
        fieldsDescriptors.add(fieldsDescriptor);
      },
      unregister: (fieldsDescriptor: FieldsDescriptor) => {
        fieldsDescriptor.unregister();
        fieldsDescriptors.delete(fieldsDescriptor);
      },
    },
    completions: {
      get: async (intent): Promise<TSerializableCompletionViewItem[]> => {
        return await EventLink.sendEvent(`completions:get`, intent);
      },
      register: (completionsDescriptor) => {
        completionsDescriptors.add(completionsDescriptor);
      },
      unregister: (completionsDescriptor) => {
        completionsDescriptor.unregister();
        completionsDescriptors.delete(completionsDescriptor);
      },
    },
    projects: {
      get: async (): Promise<TSerializableProjectDescriptor[]> => {
        return await EventLink.sendEvent(`projects:get`);
      },
      register: (projectsDescriptor) => {
        projectsDescriptors.add(projectsDescriptor);
      },
      unregister: (projectsDescriptor) => {
        projectsDescriptor.unregister();
        projectsDescriptors.delete(projectsDescriptor);
      },
    },
    download: {
      downloadFile: async (fileName: string, fileType: string, fileContent: string): Promise<void> => {
        return await EventLink.sendEvent<string, void>('download:file', fileName, fileType, fileContent);
      },
      downloadFiles: async (downloadName: string, files: TFileOrFolder[]): Promise<void> => {
        return await EventLink.sendEvent<string | TFileOrFolder[], void>('download:files', downloadName, files);
      },
    },
    feedback: {
      info: async (message: string): Promise<void> => {
        return await EventLink.sendEvent('feedback:show', message, 'info');
      },
      warning: async (message: string): Promise<void> => {
        return await EventLink.sendEvent('feedback:show', message, 'warning');
      },
      success: async (message: string): Promise<void> => {
        return await EventLink.sendEvent('feedback:show', message, 'success');
      },
      error: async (message: string): Promise<void> => {
        return await EventLink.sendEvent('feedback:show', message, 'error');
      },
    },
    data: {
      execute: async (query) => {
        const result: any = await EventLink.sendEvent('data:execute', query);
        if ('severity' in result) throw new DatabaseError(result);
        return result;
      },
      subscribe: async ({ listener, query }) => {
        const key = createDeterministicKey(query.sql, query.parameters as []);

        const listeners = data.get(key);
        if (listeners) {
          listeners.add(listener);
        } else {
          await EventLink.sendEvent<any>('data:watch:add', key, query);
          data.set(key, new Set([listener]))
        }

        return async () => {
          data.get(key)?.delete(listener);

          if (data.size === 0) {
            await EventLink.sendEvent<any>('data:watch:remove', key, query);
          }
        };
      },
    },
    diagnostics: {
      get: async (): Promise<Record<string, TSerializableDiagnosticViewItem[]>> => {
        return await EventLink.sendEvent(`diagnostics:get`);
      },
      subscribe: (listener: ((diagnostic: Record<string, TSerializableDiagnosticViewItem[]>) => Promise<void>)): (() => void) => {
        diagnostics.add(listener);
        return () => diagnostics.delete(listener);
      },
      register: <GMode extends TAnalyzerMode, GResource extends TAnalyzerResource>(analyzer: DiagnosticAnalyzer<GMode, GResource>) => {
        analyzer.register(context);
        diagnosticAnalyzers.add(analyzer as DiagnosticAnalyzer);
      },
      unregister: <GMode extends TAnalyzerMode, GResource extends TAnalyzerResource>(analyzer: DiagnosticAnalyzer<GMode, GResource>) => {
        analyzer.unregister();
        diagnosticAnalyzers.delete(analyzer as DiagnosticAnalyzer);
      },
    },
  };


  return context;
}
