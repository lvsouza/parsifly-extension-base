import { CompletionsDescriptor, ICompletionsDescriptorIntent } from './shared/descriptors/CompletionsDescriptor';
import { TSerializableCompletionViewItem } from './shared/components/completion-view-item/TCompletionViewItem';
import { ProjectDescriptor, TSerializableProjectDescriptor } from './shared/descriptors/ProjectDescriptor';
import { FieldViewItem } from './shared/components/field-view-item/FieldViewItem';
import { FieldsDescriptor } from './shared/descriptors/FieldsDescriptor';
import { PlatformAction } from './shared/components/PlatformActions';
import { Editor } from './shared/components/editors/Editor';
import { EventLink } from './shared/services/EventLink';
import { createDataProviders } from './data-providers';
import { View } from './shared/components/views/View';
import { TFileOrFolder } from './types/TFileOrFolder';
import { Parser } from './shared/components/Parser';
import { TApplication } from './types/TApplication';
import { TQuickPick } from './types/TQuickPick';


export abstract class ExtensionBase {
  #eventLink: EventLink = new EventLink();

  #platformActions: Set<PlatformAction> = new Set([]);
  #parsers: Set<Parser> = new Set([]);
  #editors: Set<Editor> = new Set([]);
  #views: Set<View> = new Set([]);

  #selection: Set<((key: string[]) => void)> = new Set([]);
  #edition: Set<((key: string | undefined) => void)> = new Set([]);
  #fields: Map<string, Set<((fields: FieldViewItem[]) => void)>> = new Map();

  #fieldsDescriptors: Set<FieldsDescriptor> = new Set([]);
  #projectsDescriptors: Set<ProjectDescriptor> = new Set([]);
  #completionsDescriptors: Set<CompletionsDescriptor> = new Set([]);


  constructor() {
    this.#eventLink.setExtensionEvent('activate', this.activate.bind(this));
    this.#eventLink.setExtensionEvent('deactivate', this.deactivate.bind(this));

    this.#eventLink.setExtensionEvent('selection:subscription', async keys => this.#selection.forEach(listener => listener(keys as string[])));
    this.#eventLink.setExtensionEvent('edition:subscription', async key => this.#edition.forEach(listener => listener(key as string | undefined)));
    this.#eventLink.setExtensionEvent('fields:subscription', async (key, fields) => this.#fields.get(key as string)?.forEach(listener => listener(fields as FieldViewItem[])));

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
      /**
       * Allow you to select a item
       * 
       * @param key Identifier of a item to be selected
       */
      select: async (key: string) => {
        await this.#eventLink.callStudioEvent(`selection:select`, key);
      },
      /**
       * Allow you to unselect a item
       * 
       * @param key Identifier of a item to be unselected
       */
      unselect: async (key: string) => {
        await this.#eventLink.callStudioEvent(`selection:unselect`, key);
      },
      /**
       * Returns a list of selected items in the platform
       * 
       * @returns {Promise<string[]>} List of selected items
       */
      get: async (): Promise<string[]> => {
        return await this.#eventLink.callStudioEvent(`selection:get`);
      },
      /**
       * Subscribe to selection item key change
       * 
       * @returns {() => void} Unsubscribe function
       */
      subscribe: (listener: ((key: string[]) => Promise<void>)): (() => void) => {
        this.#selection.add(listener);
        return () => this.#selection.delete(listener);
      },
    },
    edition: {
      /**
       * Allow you to open a item in a editor based on the item type
       * 
       * @param key Identifier of a item to be opened for some editor
       */
      open: async (key: string) => {
        await this.#eventLink.callStudioEvent(`edition:open`, key);
      },
      /**
       * Allow you to close a item if it is opened in the editor
       * 
       * @param key Identifier of a item to be closed
       */
      close: async (key: string) => {
        await this.#eventLink.callStudioEvent(`edition:close`, key);
      },
      /**
       * Returns a edited item id in the platform
       * 
       * @returns {Promise<string>} Edited item id
       */
      get: async (): Promise<string> => {
        return await this.#eventLink.callStudioEvent(`edition:get`);
      },
      /**
       * Subscribe to edition item key change
       * 
       * @returns {() => void} Unsubscribe function
       */
      subscribe: (listener: ((key: string | undefined) => Promise<void>)): (() => void) => {
        this.#edition.add(listener);
        return () => this.#edition.delete(listener);
      },
    },
    fields: {
      /**
       * Returns a list of fields
       * 
       * @param key Resource key to be refreshed
       * @returns {Promise<FieldViewItem[]>} List of fields
       */
      get: async (key: string): Promise<FieldViewItem[]> => {
        return await this.#eventLink.callStudioEvent(`fields:get`, key);
      },
      /**
       * Request the platform to get again all fields for this resource
       * 
       * @param key Resource key to be refreshed
       */
      refresh: async (key: string) => {
        await this.#eventLink.callStudioEvent(`fields:refresh`, key);
      },
      /**
       * Subscribe to form fields
       * 
       * @returns {() => void} Unsubscribe function
       */
      subscribe: (key: string, listener: ((fields: FieldViewItem[]) => Promise<void>)): (() => void) => {
        const listeners = this.#fields.get(key)

        if (listeners) {
          listeners.add(listener);
        } else {
          this.#fields.set(key, new Set([listener]))
        }

        return () => this.#fields.get(key)?.delete(listener);
      },
      /**
       * Register a fields descriptor to platform.
       * 
       * @param fieldsDescriptor Descriptor to be registered
       */
      register: (fieldsDescriptor: FieldsDescriptor) => {
        this.#fieldsDescriptors.add(fieldsDescriptor);
      },
      /**
       * Unregister the descriptor
       * 
       * @param fieldsDescriptor Descriptor to be unregistered
       */
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
    dataProviders: createDataProviders(this.#eventLink),
  } as const;
}
