

export type TApplicationDataProviders = {
  /**
   * Allow you to call a custom command from application
   * 
   * @param key Name of the command
   * @param args List of arguments to be forwarded to the command call
   */
  readonly callCustomDataProvider: (key: string, ...args: unknown[]) => Promise<unknown>;
  /**
   * Allow you to get the entire project object
   */
  readonly project: {
    (): Promise<any>;
    pages(index?: number): Promise<any>;
    services(index?: number): Promise<any>;
    components(index?: number): Promise<any>;
  };
}
