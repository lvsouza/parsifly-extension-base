

export type TQueryResults<T = Record<string, any>> = {
  rows: T[];
  affectedRows?: number;
  fields: { name: string; dataTypeID: number; }[];
};

export type TQuery = {
  sql: string;
  parameters: ReadonlyArray<unknown>
}

export type TWatchQuery = {
  query: TQuery;
  listener: (data: TQueryResults) => Promise<void>;
}
