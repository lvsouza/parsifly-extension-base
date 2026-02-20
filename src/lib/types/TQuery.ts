

export type TQueryResults<T extends Record<string, any>, GQueryMode extends 'array' | 'object' = 'object'> = {
  rows: GQueryMode extends 'object' ? T[] : T[string][][];
  affectedRows?: number;
  fields: { name: string; dataTypeID: number; }[];
};

export type TQuery<_GResult = unknown, GQueryMode extends 'array' | 'object' = 'object'> = {
  sql: string;
  mode?: GQueryMode;
  parameters: ReadonlyArray<unknown>;
}

export type TWatchQuery<T extends Record<string, any>, GQueryMode extends 'array' | 'object' = 'object'> = {
  query: TQuery<T, GQueryMode>;
  listener: (data: TQueryResults<T, GQueryMode>) => Promise<void>;
}

export class DatabaseError {
  public message: string | undefined;
  public severity: string | undefined;
  public code: string | undefined;
  public detail: string | undefined;
  public hint: string | undefined;
  public position: string | undefined;
  public internalPosition: string | undefined;
  public internalQuery: string | undefined;
  public where: string | undefined;
  public schema: string | undefined;
  public table: string | undefined;
  public column: string | undefined;
  public dataType: string | undefined;
  public constraint: string | undefined;
  public file: string | undefined;
  public line: string | undefined;
  public routine: string | undefined;

  constructor(error: Record<string, any>) {
    this.message = error.message;
    this.severity = error.severity;
    this.code = error.code;
    this.detail = error.detail;
    this.hint = error.hint;
    this.position = error.position;
    this.internalPosition = error.internalPosition;
    this.internalQuery = error.internalQuery;
    this.where = error.where;
    this.schema = error.schema;
    this.table = error.table;
    this.column = error.column;
    this.dataType = error.dataType;
    this.constraint = error.constraint;
    this.file = error.file;
    this.line = error.line;
    this.routine = error.routine;
  }

  /**
   * Force DatabaseError for the given unknown error 
   * 
   * @param error Unknown error 
   * @returns error as DatabaseError
   */
  public static as(error: unknown) {
    return error as DatabaseError
  }
}
