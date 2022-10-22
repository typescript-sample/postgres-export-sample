import { createWriteStream, DelimiterFormatter, FileWriter } from 'io-one';
import { Pool } from 'pg';
import { Exporter, select, Statement } from 'pg-exporter';
import { User, userModel } from './user';

// Create a connection to the database
const pool = new Pool({
  host: 'ec2-34-199-68-114.compute-1.amazonaws.com',
  user: 'renhnmkhkoqvjr',
  database: 'd1mrc2lb73u081',
  password: '05b33690540167d997be040566dfcbc61a85bcdfad400e69cd76ed81aef7eeeb',
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

export class QueryBuilder {
  constructor() {
    this.buildQuery = this.buildQuery.bind(this);
  }
  buildQuery(cxt?: any): Promise<Statement> {
    const stmt: Statement = {query: select('users3', userModel)};
    return Promise.resolve(stmt);
  }
}

async function exportCSV() {
  const dir = './dest_dir/';
  const writeStream = createWriteStream(dir, 'export.csv');
  const writer = new FileWriter(writeStream);
  // (D) EXPORT TO CSV
  const transform = new DelimiterFormatter<User>(',', userModel);
  const queryBuilder = new QueryBuilder();
  // (D1) ON ERROR
  // const exporter = new ExportService<User>(pool, queryBuilder, transform, writer);
  const exporter = new Exporter<User>(pool, queryBuilder.buildQuery, transform.format, writer.write, writer.end, userModel);
  const total = await exporter.export();
  console.log(total);
}

exportCSV();
