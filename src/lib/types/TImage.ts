

type TImageTypes =
  | 'folder' | 'folder-add' | 'delete'
  | 'project' | 'project-folder' | 'project-folder-add'
  | 'page' | 'page-folder' | 'page-add'
  | 'component' | 'component-folder' | 'component-add'
  | 'action-local' | 'action-local-folder' | 'action-local-add'
  | 'action-global' | 'action-global-folder' | 'action-global-add'
  | 'variable-local' | 'variable-local-folder' | 'variable-local-add' | 'variable-local-attribute' | 'variable-local-substructure-attribute'
  | 'variable-global' | 'variable-global-folder' | 'variable-global-add' | 'variable-global-attribute' | 'variable-global-substructure-attribute'
  | 'structure' | 'structure-folder' | 'structure-add' | 'structure-attribute' | 'structure-substructure-attribute'
  | 'shared' | 'shared-folder'
  | 'integrations' | 'integrations-folder'
  | 'attachment' | 'attachment-folder' | 'attachment-add'
  | 'rest-api' | 'rest-api-folder' | 'rest-api-add'
  | 'external-logic' | 'external-logic-folder' | 'external-logic-add'
  | 'theme' | 'theme-folder' | 'theme-add'
  | 'file' | 'file-folder' | 'file-add'
  | 'dependency' | 'dependency-folder' | 'dependency-add'
  | 'event' | 'event-folder' | 'event-add' | 'listen-only-event' | 'listen-only-event-folder'
  | 'listener' | 'listener-folder' | 'listener-add'
  | 'emitter' | 'emitter-folder' | 'listener-add'
  | 'advanced' | 'advanced-folder'

export type TTypeImage = {
  /**
   * A default resource image
   * 
   * @example
   * ```JS
   * icon: { type: 'page' } 
   * ```
   */
  type: TImageTypes;
  path?: string;
  url?: undefined;
  name?: undefined;
}

export type TPublicFolderImage = {
  /**
   * A image loaded from your public folder
   * 
   * @example
   * ```JS
   * icon: { path: '/dist/assets/icon.png' } 
   * ```
   */
  path: string;
  url?: undefined;
  name?: undefined;
  type?: undefined;
}

export type TPublicUrlImage = {
  /**
   * A image from a public url from anywhere on internet
   * 
   * @example
   * ```JS
   * icon: { url: 'https://externaldomain.com/icon.png' } 
   * ```
   */
  url: string;
  name?: undefined;
  path?: undefined;
  type?: undefined;
}

export type TVisualStudioCode = {
  /**
   * A VSCode icon, use the value based in this site.
   * 
   * @example
   * ```JS
   * icon: { name: "VscAdd" }
   * ```
   * 
   *  @link https://react-icons.github.io/react-icons/icons/vsc/
   */
  name: string;
  url?: undefined;
  path?: undefined;
  type?: undefined;
}

export type TImage = TVisualStudioCode | TPublicUrlImage | TPublicFolderImage | TTypeImage;
