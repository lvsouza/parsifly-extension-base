import { CompletionsDescriptor, ICompletionsDescriptorIntent } from './shared/descriptors/CompletionsDescriptor';
import { TSerializableCompletionViewItem } from './shared/components/completion-view-item/TCompletionViewItem';
import { TSerializableDiagnosticViewItem } from './shared/components/diagnostic-view-item/TDiagnosticViewItem';
import { DiagnosticAnalyzer, TAnalyzerMode, TAnalyzerResource } from './shared/analyzers/DiagnosticAnalyzer';
import { ProjectDescriptor, TSerializableProjectDescriptor } from './shared/descriptors/ProjectDescriptor';
import { TSerializableFieldViewItem } from './shared/components/field-view-item/TFieldViewItem';
import { createDeterministicKey } from './shared/services/CreateDeterministicKey';
import { FieldsDescriptor } from './shared/descriptors/FieldsDescriptor';
import { PlatformAction } from './shared/components/PlatformActions';
import { StatusBarItem } from './shared/components/StatusBarItems';
import { Editor } from './shared/components/editors/Editor';
import { EventLink } from './shared/services/EventLink';
import { View } from './shared/components/views/View';
import { TFileOrFolder } from './types/TFileOrFolder';
import { Parser } from './shared/components/Parser';
import { TApplication } from './types/TApplication';
import { TQuickPick } from './types/TQuickPick';
import { DatabaseError } from './types/TQuery';


export abstract class ExtensionBase {
  #eventLink: EventLink = new EventLink();

  #platformActions: Set<PlatformAction> = new Set([]);
  #statusBarItems: Set<StatusBarItem> = new Set([]);
  #parsers: Set<Parser> = new Set([]);
  #editors: Set<Editor> = new Set([]);
  #views: Set<View> = new Set([]);

  #selection: Set<((key: string[]) => void)> = new Set([]);
  #edition: Set<((key: string | undefined) => void)> = new Set([]);
  #data: Map<string, Set<((data: any) => Promise<void>)>> = new Map();
  #fields: Map<string, Set<((fields: TSerializableFieldViewItem[]) => void)>> = new Map();
  #diagnostics: Set<((diagnostics: Record<string, TSerializableDiagnosticViewItem[]>) => void)> = new Set();

  #fieldsDescriptors: Set<FieldsDescriptor> = new Set([]);
  #projectsDescriptors: Set<ProjectDescriptor> = new Set([]);
  #completionsDescriptors: Set<CompletionsDescriptor> = new Set([]);

  #diagnosticAnalyzers: Set<DiagnosticAnalyzer> = new Set([]);


  constructor() {
    this.#eventLink.setExtensionEvent('activate', this.activate.bind(this));
    this.#eventLink.setExtensionEvent('deactivate', this.deactivate.bind(this));

    this.#eventLink.setExtensionEvent('selection:subscription', async keys => this.#selection.forEach(listener => listener(keys as string[])));
    this.#eventLink.setExtensionEvent('edition:subscription', async key => this.#edition.forEach(listener => listener(key as string | undefined)));
    this.#eventLink.setExtensionEvent('fields:subscription', async (key, fields) => this.#fields.get(key as string)?.forEach(listener => listener(fields as TSerializableFieldViewItem[])));
    this.#eventLink.setExtensionEvent('diagnostics:subscription', async (diagnostic) => this.#diagnostics.forEach(listener => listener(diagnostic as Record<string, TSerializableDiagnosticViewItem[]>)));

    this.#eventLink.setExtensionEvent('parsers:load', async () => Array.from(this.#parsers).map(parser => ({
      key: parser.key,
      icon: parser.internalValue.icon,
      label: parser.internalValue.label,
      description: parser.internalValue.description,
    })));
    this.#eventLink.setExtensionEvent('platformActions:load', async () => Array.from(this.#platformActions).map(platformAction => ({
      key: platformAction.key,
      icon: platformAction.internalValue.icon,
      label: platformAction.internalValue.label,
      children: platformAction.internalValue.children,
      description: platformAction.internalValue.description,
    })));
    this.#eventLink.setExtensionEvent('statusBarItems:load', async () => Array.from(this.#statusBarItems).map(statusBarItem => statusBarItem.serialize()));
    this.#eventLink.setExtensionEvent('views:load', async () => Array.from(this.#views).map(view => ({
      key: view.key,
      icon: view.internalValue.icon,
      type: view.internalValue.type,
      title: view.internalValue.title,
      position: view.internalValue.position,
      description: view.internalValue.description,
      dataProvider: {
        key: view.internalValue.dataProvider?.key,
        type: view.internalValue.dataProvider?.type,
      }
    })));
    this.#eventLink.setExtensionEvent('editors:load', async () => Array.from(this.#editors).map(editor => ({
      key: editor.key,
      icon: editor.internalValue.icon,
      type: editor.internalValue.type,
      title: editor.internalValue.title,
      position: editor.internalValue.position,
      selector: editor.internalValue.selector,
      description: editor.internalValue.description,
      entryPoint: {
        basePath: editor.internalValue.entryPoint?.basePath,
        file: editor.internalValue.entryPoint?.file,
      },
    })));
    this.#eventLink.setExtensionEvent('fields:get', async (key: string) => {
      return await Promise
        .all(
          Array
            .from(this.#fieldsDescriptors)
            .map(async fieldsDescriptor => {
              const fields = await fieldsDescriptor.onGetFields(key);
              return fields;
            }),
        )
        .then(results => results.flatMap(result => result || []) || [])
    });
    this.#eventLink.setExtensionEvent('completions:get', async (intent: ICompletionsDescriptorIntent) => {
      return await Promise
        .all(
          Array
            .from(this.#completionsDescriptors)
            .map(async completionsDescriptor => {
              const completions = await completionsDescriptor.onGetCompletions(intent);
              return completions;
            }),
        )
        .then(results => results.flatMap(result => result || []) || [])
    });
    this.#eventLink.setExtensionEvent('projects:get', async () => {
      return Array
        .from(this.#projectsDescriptors)
        .map(projectDescriptor => projectDescriptor.serialize())
    });
    this.#eventLink.setExtensionEvent('diagnostics:get', async () => {
      return Array
        .from(this.#diagnosticAnalyzers)
        .reduce((current, projectDescriptor) => {
          current[projectDescriptor.key] = projectDescriptor.diagnostics();
          return current;
        }, {} as Record<string, TSerializableDiagnosticViewItem[]>)
    });
    this.#eventLink.setExtensionEvent('data:watch', async (key: string, data: any) => {
      const listenerTriggers = Array.from(
        this
          .#data
          .entries()
          .filter(([listenersKey]) => listenersKey === key)
          .flatMap(([, listeners]) => listeners)
          .map(listener => listener(data))
      );

      return await Promise.all(listenerTriggers)
    });
  }


  /**
   * Automatically called when the extension start.
   */
  async activate(): Promise<void> {
    console.log('Extension activated (base implementation).');
  }

  /**
   * Automatically called when the extension stop.
   */
  async deactivate(): Promise<void> {
    console.log('Extension deactivated (base implementation).');
  }

  public readonly application: TApplication = {
    quickPick: {
      show: async <T = unknown>(props: TQuickPick): Promise<T> => {
        await this.#eventLink.callStudioEvent(`quickPick:show`, props);

        return new Promise(resolve => {
          this.#eventLink.setExtensionEvent('quickPick:onConfirm', async (result: T) => {
            this.#eventLink.removeExtensionEvent('quickPick:onConfirm');
            this.#eventLink.removeExtensionEvent('quickPick:onCancel');
            resolve(result);
            return;
          });
          this.#eventLink.setExtensionEvent('quickPick:onCancel', async (result: T) => {
            this.#eventLink.removeExtensionEvent('quickPick:onConfirm');
            this.#eventLink.removeExtensionEvent('quickPick:onCancel');
            resolve(result);
            return;
          });
        })
      },
    },
    platformActions: {
      reload: async () => {
        return await this.#eventLink.callStudioEvent(
          `platformActions:change`,
          Array.from(this.#platformActions).map(platformAction => ({
            key: platformAction.key,
            icon: platformAction.internalValue.icon,
            label: platformAction.internalValue.label,
            children: platformAction.internalValue.children,
            description: platformAction.internalValue.description,
          })),
        );
      },
      register: (platformAction: PlatformAction) => {
        platformAction.register();
        this.#platformActions.add(platformAction);
        this.#eventLink.callStudioEvent(
          `platformActions:change`,
          Array.from(this.#platformActions).map(platformActions => ({
            key: platformActions.key,
            icon: platformActions.internalValue.icon,
            label: platformActions.internalValue.label,
            children: platformAction.internalValue.children,
            description: platformActions.internalValue.description,
          })),
        );
      },
      unregister: (platformAction: PlatformAction) => {
        platformAction.unregister();
        this.#platformActions.delete(platformAction);
        this.#eventLink.callStudioEvent(
          `platformActions:change`,
          Array.from(this.#platformActions).map(platformAction => ({
            key: platformAction.key,
            icon: platformAction.internalValue.icon,
            label: platformAction.internalValue.label,
            children: platformAction.internalValue.children,
            description: platformAction.internalValue.description,
          })),
        );
      },
    },
    statusBarItems: {
      reload: async () => {
        return await this.#eventLink.callStudioEvent(`statusBarItems:change`, Array.from(this.#statusBarItems).map(statusBarItem => statusBarItem.serialize()));
      },
      register: (statusBarItem: StatusBarItem) => {
        statusBarItem.register();
        this.#statusBarItems.add(statusBarItem);
        this.#eventLink.callStudioEvent(`statusBarItems:change`, Array.from(this.#statusBarItems).map(statusBarItem => statusBarItem.serialize()));
      },
      unregister: (statusBarItem: StatusBarItem) => {
        statusBarItem.unregister();
        this.#statusBarItems.delete(statusBarItem);
        this.#eventLink.callStudioEvent(`statusBarItems:change`, Array.from(this.#statusBarItems).map(statusBarItem => statusBarItem.serialize()));
      },
    },
    parsers: {
      reload: async () => {
        return await this.#eventLink.callStudioEvent(
          `parsers:change`,
          Array.from(this.#parsers).map(parser => ({
            key: parser.key,
            icon: parser.internalValue.icon,
            label: parser.internalValue.label,
            description: parser.internalValue.description,
          })),
        );
      },
      register: (parser: Parser) => {
        parser.register();
        this.#parsers.add(parser);
        this.#eventLink.callStudioEvent(
          `parsers:change`,
          Array.from(this.#parsers).map(parser => ({
            key: parser.key,
            icon: parser.internalValue.icon,
            label: parser.internalValue.label,
            description: parser.internalValue.description,
          })),
        );
      },
      unregister: (parser: Parser) => {
        parser.unregister();
        this.#parsers.delete(parser);
        this.#eventLink.callStudioEvent(
          `parsers:change`,
          Array.from(this.#parsers).map(parser => ({
            key: parser.key,
            icon: parser.internalValue.icon,
            label: parser.internalValue.label,
            description: parser.internalValue.description,
          })),
        );
      },
    },
    views: {
      reload: async () => {
        return await this.#eventLink.callStudioEvent(
          `views:change`,
          Array.from(this.#views).map(view => ({
            key: view.key,
            icon: view.internalValue.icon,
            type: view.internalValue.type,
            title: view.internalValue.title,
            position: view.internalValue.position,
            description: view.internalValue.description,
            dataProvider: {
              key: view.internalValue.dataProvider?.key,
              type: view.internalValue.dataProvider?.type,
            }
          })),
        );
      },
      register: (view: View) => {
        view.register();
        this.#views.add(view);
        this.#eventLink.callStudioEvent(
          `views:change`,
          Array.from(this.#views).map(view => ({
            key: view.key,
            icon: view.internalValue.icon,
            type: view.internalValue.type,
            title: view.internalValue.title,
            position: view.internalValue.position,
            description: view.internalValue.description,
            dataProvider: {
              key: view.internalValue.dataProvider?.key,
              type: view.internalValue.dataProvider?.type,
            }
          })),
        );
      },
      unregister: (view: View) => {
        view.unregister();
        this.#views.delete(view);
        this.#eventLink.callStudioEvent(
          `views:change`,
          Array.from(this.#views).map(view => ({
            key: view.key,
            icon: view.internalValue.icon,
            type: view.internalValue.type,
            title: view.internalValue.title,
            position: view.internalValue.position,
            description: view.internalValue.description,
            dataProvider: {
              key: view.internalValue.dataProvider?.key,
              type: view.internalValue.dataProvider?.type,
            }
          })),
        );
      },
      showPrimarySideBarByKey: async (key: string): Promise<void> => {
        return await this.#eventLink.callStudioEvent<string, void>('views:primarySideBar:showByKey', key);
      },
      showSecondarySideBarByKey: async (key: string): Promise<void> => {
        return await this.#eventLink.callStudioEvent<string, void>('views:secondarySideBar:showByKey', key);
      },
    },
    selection: {
      select: async (key: string) => {
        await this.#eventLink.callStudioEvent(`selection:select`, key);
      },
      unselect: async (key: string) => {
        await this.#eventLink.callStudioEvent(`selection:unselect`, key);
      },
      get: async (): Promise<string[]> => {
        return await this.#eventLink.callStudioEvent(`selection:get`);
      },
      subscribe: (listener: ((key: string[]) => Promise<void>)): (() => void) => {
        this.#selection.add(listener);
        return () => this.#selection.delete(listener);
      },
    },
    edition: {
      open: async (type: string, key: string) => {
        await this.#eventLink.callStudioEvent(`edition:open`, type, key);
      },
      close: async (key: string) => {
        await this.#eventLink.callStudioEvent(`edition:close`, key);
      },
      get: async (): Promise<string> => {
        return await this.#eventLink.callStudioEvent(`edition:get`);
      },
      subscribe: (listener: ((key: string | undefined) => Promise<void>)): (() => void) => {
        this.#edition.add(listener);
        return () => this.#edition.delete(listener);
      },
    },
    fields: {
      get: async (key: string): Promise<TSerializableFieldViewItem[]> => {
        return await this.#eventLink.callStudioEvent(`fields:get`, key);
      },
      refresh: async (key: string) => {
        await this.#eventLink.callStudioEvent(`fields:refresh`, key);
      },
      subscribe: (key: string, listener: ((fields: TSerializableFieldViewItem[]) => Promise<void>)): (() => void) => {
        const listeners = this.#fields.get(key)

        if (listeners) {
          listeners.add(listener);
        } else {
          this.#fields.set(key, new Set([listener]))
        }

        return () => this.#fields.get(key)?.delete(listener);
      },
      register: (fieldsDescriptor: FieldsDescriptor) => {
        this.#fieldsDescriptors.add(fieldsDescriptor);
      },
      unregister: (fieldsDescriptor: FieldsDescriptor) => {
        fieldsDescriptor.unregister();
        this.#fieldsDescriptors.delete(fieldsDescriptor);
      },
    },
    completions: {
      get: async (intent): Promise<TSerializableCompletionViewItem[]> => {
        return await this.#eventLink.callStudioEvent(`completions:get`, intent);
      },
      register: (completionsDescriptor) => {
        this.#completionsDescriptors.add(completionsDescriptor);
      },
      unregister: (completionsDescriptor) => {
        completionsDescriptor.unregister();
        this.#completionsDescriptors.delete(completionsDescriptor);
      },
    },
    projects: {
      get: async (): Promise<TSerializableProjectDescriptor[]> => {
        return await this.#eventLink.callStudioEvent(`projects:get`);
      },
      register: (projectsDescriptor) => {
        this.#projectsDescriptors.add(projectsDescriptor);
      },
      unregister: (projectsDescriptor) => {
        projectsDescriptor.unregister();
        this.#projectsDescriptors.delete(projectsDescriptor);
      },
    },
    editors: {
      reload: async () => {
        return await this.#eventLink.callStudioEvent(
          `editors:change`,
          Array.from(this.#editors).map(editor => ({
            key: editor.key,
            icon: editor.internalValue.icon,
            type: editor.internalValue.type,
            title: editor.internalValue.title,
            position: editor.internalValue.position,
            selector: editor.internalValue.selector,
            description: editor.internalValue.description,
            entryPoint: {
              basePath: editor.internalValue.entryPoint?.basePath,
              file: editor.internalValue.entryPoint?.file,
            },
          })),
        );
      },
      register: (editor: Editor) => {
        editor.register();
        this.#editors.add(editor);
        this.#eventLink.callStudioEvent(
          `editors:change`,
          Array.from(this.#editors).map(editor => ({
            key: editor.key,
            icon: editor.internalValue.icon,
            type: editor.internalValue.type,
            title: editor.internalValue.title,
            position: editor.internalValue.position,
            selector: editor.internalValue.selector,
            description: editor.internalValue.description,
            entryPoint: {
              basePath: editor.internalValue.entryPoint?.basePath,
              file: editor.internalValue.entryPoint?.file,
            },
          })),
        );
      },
      unregister: (editor: Editor) => {
        editor.unregister();
        this.#editors.delete(editor);
        this.#eventLink.callStudioEvent(
          `editors:change`,
          Array.from(this.#editors).map(editor => ({
            key: editor.key,
            icon: editor.internalValue.icon,
            type: editor.internalValue.type,
            title: editor.internalValue.title,
            position: editor.internalValue.position,
            selector: editor.internalValue.selector,
            description: editor.internalValue.description,
            entryPoint: {
              basePath: editor.internalValue.entryPoint?.basePath,
              file: editor.internalValue.entryPoint?.file,
            },
          })),
        );
      },
    },
    download: {
      downloadFile: async (fileName: string, fileType: string, fileContent: string): Promise<void> => {
        return await this.#eventLink.callStudioEvent<string, void>('download:file', fileName, fileType, fileContent);
      },
      downloadFiles: async (downloadName: string, files: TFileOrFolder[]): Promise<void> => {
        return await this.#eventLink.callStudioEvent<string | TFileOrFolder[], void>('download:files', downloadName, files);
      },
    },
    feedback: {
      info: async (message: string): Promise<void> => {
        return await this.#eventLink.callStudioEvent('feedback:show', message, 'info');
      },
      warning: async (message: string): Promise<void> => {
        return await this.#eventLink.callStudioEvent('feedback:show', message, 'warning');
      },
      success: async (message: string): Promise<void> => {
        return await this.#eventLink.callStudioEvent('feedback:show', message, 'success');
      },
      error: async (message: string): Promise<void> => {
        return await this.#eventLink.callStudioEvent('feedback:show', message, 'error');
      },
    },
    data: {
      execute: async (query) => {
        const result: any = await this.#eventLink.callStudioEvent('data:execute', query);
        if ('severity' in result) throw new DatabaseError(result);
        return result;
      },
      subscribe: async ({ listener, query }) => {
        const key = createDeterministicKey(query.sql, query.parameters as []);

        const listeners = this.#data.get(key);
        if (listeners) {
          listeners.add(listener);
        } else {
          await this.#eventLink.callStudioEvent<any>('data:watch:add', key, query);
          this.#data.set(key, new Set([listener]))
        }

        return async () => {
          this.#data.get(key)?.delete(listener);

          if (this.#data.size === 0) {
            await this.#eventLink.callStudioEvent<any>('data:watch:remove', key, query);
          }
        };
      },
    },
    diagnostics: {
      get: async (): Promise<Record<string, TSerializableDiagnosticViewItem[]>> => {
        return await this.#eventLink.callStudioEvent(`diagnostics:get`);
      },
      subscribe: (listener: ((diagnostic: Record<string, TSerializableDiagnosticViewItem[]>) => Promise<void>)): (() => void) => {
        this.#diagnostics.add(listener);
        return () => this.#diagnostics.delete(listener);
      },
      register: <GMode extends TAnalyzerMode, GResource extends TAnalyzerResource>(analyzer: DiagnosticAnalyzer<GMode, GResource>) => {
        analyzer.register(this.application);
        this.#diagnosticAnalyzers.add(analyzer as DiagnosticAnalyzer);
      },
      unregister: <GMode extends TAnalyzerMode, GResource extends TAnalyzerResource>(analyzer: DiagnosticAnalyzer<GMode, GResource>) => {
        analyzer.unregister();
        this.#diagnosticAnalyzers.delete(analyzer as DiagnosticAnalyzer);
      },
    },
  } as const;
}
