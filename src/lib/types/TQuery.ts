


export type TQuery = {
  sql: string;
  parameters: ReadonlyArray<unknown>
}

export type TWatchQuery = {
  query: TQuery;
  listener: (data: any) => Promise<void>;
}
