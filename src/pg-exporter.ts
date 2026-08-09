import { Pool } from "pg";
import QueryStream from "pg-query-stream";

export interface SimpleMap {
  [key: string]: string | number | boolean | Date
}
export type DataType =
  | "ObjectId"
  | "date"
  | "datetime"
  | "time"
  | "boolean"
  | "number"
  | "integer"
  | "string"
  | "text"
  | "object"
  | "array"
  | "binary"
  | "primitives"
  | "booleans"
  | "numbers"
  | "integers"
  | "strings"
  | "dates"
  | "datetimes"
  | "times"

export interface Attribute {
  name?: string
  column?: string
}
export interface Attributes {
  [key: string]: Attribute
}

export interface StringMap {
  [key: string]: string;
}
export interface Statement {
  query: string;
  params?: any[];
}
export interface QueryBuilder {
  buildQuery(ctx?: any): Promise<Statement>;
}
export interface Formatter<T> {
  format: (row: T) => string;
}
export interface FileWriter {
  write(chunk: string): boolean;
  flush?(cb?: () => void): void;
  end?(cb?: () => void): void;
}
export class Exporter<T> {
  constructor(
    protected pool: Pool,
    protected filename: string,
    protected buildQuery: (ctx?: any) => Promise<Statement>,
    protected format: (row: T) => string,
    protected write: (chunk: string) => boolean,
    protected end: (cb?: () => void) => void,
    protected attributes?: Attributes,
    protected logInfo?: (msg: string, m?: SimpleMap) => void,
    protected progressSize: number = 10000,
  ) {
    if (attributes) {
      this.map = buildMap(attributes);
    }
    this.export = this.export.bind(this);
  }
  map?: StringMap;
  async export(ctx?: any): Promise<number> {
    const stmt = await this.buildQuery(ctx);
    const query = new QueryStream(stmt.query, stmt.params);
    await this.pool.connect();
    this.pool.query(query);
    let i = 0;
    let k = 0;
    if (this.map) {
      for await (const data of query) {
        i++;
        k++;
        const obj = mapOne<T>(data, this.map);
        const str = this.format(obj);
        this.write(str);
        if (k >= this.progressSize) {
          if (this.logInfo) {
            this.logInfo(`Progress: ${i} records processed of file '${this.filename}'`);
          }
          k = 0;
        }
      }
    } else {
      for await (const data of query) {
        i++;
        k++;
        const str = this.format(data);
        this.write(str);
        if (k >= this.progressSize) {
          if (this.logInfo) {
            this.logInfo(`Progress: ${i} records processed of file '${this.filename}'`);
          }
          k = 0;
        }
      }
    }
    this.pool.end();
    this.end();
    return i;
  }
}
// tslint:disable-next-line:max-classes-per-file
export class ExportService<T> {
  constructor(
    protected pool: Pool,
    protected filename: string,
    protected queryBuilder: QueryBuilder,
    protected formatter: Formatter<T>,
    protected writer: FileWriter,
    protected attributes?: Attributes,
    protected logInfo?: (msg: string, m?: SimpleMap) => void,
    protected progressSize: number = 10000,
  ) {
    if (attributes) {
      this.map = buildMap(attributes);
    }
    this.export = this.export.bind(this);
  }
  map?: StringMap;
  async export(ctx?: any): Promise<number> {
    
    const stmt = await this.queryBuilder.buildQuery(ctx);
    const query = new QueryStream(stmt.query, stmt.params);
    await this.pool.connect();
    this.pool.query(query);
    let i = 0;
    let k = 0;
    if (this.map) {
      for await (const data of query) {
        i++;
        k++;
        const obj = mapOne<T>(data, this.map);
        const str = this.formatter.format(obj);
        this.writer.write(str);
        if (k >= this.progressSize) {
          if (this.logInfo) {
            this.logInfo(`Progress: ${i} records processed of file '${this.filename}'`);
          }
          k = 0;
        }
      }
    } else {
      for await (const data of query) {
        i++;
        k++;
        const str = this.formatter.format(data);
        this.writer.write(str);
        if (k >= this.progressSize) {
          if (this.logInfo) {
            this.logInfo(`Progress: ${i} records processed of file '${this.filename}'`);
          }
          k = 0;
        }
      }
    }
    this.pool.end();
    if (this.writer.end) {
      this.writer.end();
    } else if (this.writer.flush) {
      this.writer.flush();
    }
    return i;
  }
}
// tslint:disable-next-line:ban-types
export function mapOne<T>(results: Object, m?: StringMap): T {
  const obj: any = results;
  if (!m) {
    return obj;
  }
  const mkeys = Object.keys(m as any);
  if (mkeys.length === 0) {
    return obj;
  }
  const obj2: any = {};
  const keys = Object.keys(obj);
  for (const key of keys) {
    let k0 = m[key];
    if (!k0) {
      k0 = key;
    }
    obj2[k0] = (obj)[key];
  }
  return obj2;
}
export function buildMap(attrs: Attributes): StringMap|undefined {
  const mp: StringMap = {};
  const ks = Object.keys(attrs);
  let isMap = false;
  for (const k of ks) {
    const attr = attrs[k];
    attr.name = k;
    const field = (attr.column ? attr.column : k);
    const s = field.toLowerCase();
    if (s !== k) {
      mp[s] = k;
      isMap = true;
    }
  }
  if (isMap) {
    return mp;
  }
  return undefined;
}
export function param(i: number): string {
  return "$" + i;
}
export function select(table: string, attrs: Attributes): string {
  const cols: string[] = [];
  const ks = Object.keys(attrs);
  for (const k of ks) {
    const attr = attrs[k];
    attr.name = k;
    const field = (attr.column ? attr.column : k);
    const s = field.toLowerCase();
    cols.push(s);
  }
  return `select ${cols.join(",")} from ${table}`;
}
