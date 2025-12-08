


export type TInternalImageIcon = {
  /**
   * A Image icon loaded from a public domain
   * 
   * @example
   * ```JS
   * icon: { path: '/dist/assets/icon.png' } 
   * ```
   * 
   */
  path: string;
  url?: undefined;
  name?: undefined;
}

export type TExternalImageIcon = {
  /**
   * A Image icon loaded from a public domain
   * 
   * @example
   * ```JS
   * icon: { url: 'https://externaldomain.com/icon.png' } 
   * ```
   * 
   */
  url: string;
  name?: undefined;
  path?: undefined;
}

export type TVisualStudioCodeIcon = {
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
}

export type TIcon = TVisualStudioCodeIcon | TExternalImageIcon | TInternalImageIcon;
