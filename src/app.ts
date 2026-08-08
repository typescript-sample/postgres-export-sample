import { merge } from "config-plus";
import { createWriteStream, DelimiterFormatter, FileWriter, getPrefix, LogWriter, timeToString } from "io-one";
import { createLogger } from "logger-core";
import path from "path";
import { Pool } from "pg";
import { config, environments } from "./config";
import { Exporter, select, Statement } from "./pg-exporter";
import { User, userModel } from "./user";

const cfg = merge(config, process.env, environments, process.env.ENV)

export class QueryBuilder {
  constructor() {
    this.buildQuery = this.buildQuery.bind(this);
  }
  buildQuery(cxt?: any): Promise<Statement> {
    const stmt: Statement = { query: select("export_users", userModel) };
    return Promise.resolve(stmt);
  }
}

async function exportData() {
  const pool = new Pool(cfg.db)

  const now = new Date()
  const errorWriter = new LogWriter(getPrefix(cfg.error.prefix, now) + "_" + timeToString(now) + cfg.error.suffix, cfg.error.directory)
  const logWriter = new LogWriter(getPrefix(cfg.info.prefix, now) + "_" + timeToString(now) + cfg.info.suffix, cfg.info.directory)

  const logger = createLogger(cfg.log, undefined, undefined, errorWriter.write, logWriter.write)

  const dir = "./dest_dir/";
  const filename = "export.csv"
  const writeStream = createWriteStream(dir, "export.csv");
  const writer = new FileWriter(writeStream);

  const formatter = new DelimiterFormatter<User>(",", userModel);
  const queryBuilder = new QueryBuilder();

  logger.info(`Export "${path.join(dir, filename)}" file`)
  // const exporter = new ExportService<User>(pool, queryBuilder, transform, writer);
  const exporter = new Exporter<User>(pool, queryBuilder.buildQuery, formatter.format, writer.write, writer.end, userModel);
  const total = await exporter.export();

  logger.info(`Export "${path.join(dir, filename)}" file. Total: ${total}`)
  console.log(total);
}

exportData();
