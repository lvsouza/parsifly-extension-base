

type TImageTypes =
  | 'project' | 'project-folder'
  | 'page' | 'page-folder'
  | 'component' | 'component-folder'
  | 'action-local' | 'action-local-folder'
  | 'variable-local' | 'variable-local-folder'
  | 'action-global' | 'action-global-folder'
  | 'variable-global' | 'variable-global-folder'
  | 'structure' | 'structure-folder' | 'structure-attribute' | 'substructure'
  | 'rest-api' | 'rest-api-folder'
  | 'theme' | 'theme-folder'
  | 'shared' | 'shared-folder'
  | 'integrations' | 'integrations-folder'
  | 'file' | 'file-folder'
  | 'external-logic' | 'external-logic-folder'
  | 'dependency' | 'dependency-folder'
  | 'attachment' | 'attachment-folder'

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
