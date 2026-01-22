

export type TViewContentWebViewContext = {
  reload(): Promise<void>;
  readonly currentValue: TViewContentWebView;
  sendMessage(...values: unknown[]): Promise<unknown>;
  set<GKey extends keyof TViewContentWebView>(property: GKey, value: TViewContentWebView[GKey]): Promise<void>;
}

export type TViewContentWebView = {
  type: 'viewContentWebView';
  onDidMessage: (context: TViewContentWebViewContext, ...values: unknown[]) => Promise<unknown>;
  entryPoint: {
    basePath: string;
    file: string;
  };
}

export type TSerializableViewContentWebView = {
  key: string;
  type: 'viewContentWebView';
  entryPoint: {
    basePath: string;
    file: string;
  };
}
