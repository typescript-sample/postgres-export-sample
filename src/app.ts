import { merge } from "config-plus"
import { createWriteStream, CSVFormatter, FileWriter, getPrefix, LogWriter, timeToString, toString } from "export-kit"
import { createFileLogger } from "logger-core"
import path from "path"
import { Pool } from "pg"
import { ExportService, select, Statement } from "pg-exporter"
import { config, environments } from "./config"
import { User, userModel as userSchema } from "./user"

const cfg = merge(config, process.env, environments, process.env.ENV)

export class QueryBuilder {
  constructor() {
    this.buildQuery = this.buildQuery.bind(this)
  }
  buildQuery(cxt?: any): Promise<Statement> {
    const stmt: Statement = { query: select("export_users", userSchema) }
    return Promise.resolve(stmt)
  }
}

async function exportData() {
  const now = new Date()
  const errorWriter = new LogWriter(`${getPrefix(cfg.error.prefix, now)}_${timeToString(now)}${cfg.error.suffix}`, cfg.error.directory)
  const logWriter = new LogWriter(`${getPrefix(cfg.info.prefix, now)}_${timeToString(now)}${cfg.info.suffix}`, cfg.info.directory)

  const logger = createFileLogger(cfg.log, errorWriter.write, logWriter.write)

  const pool = new Pool(cfg.db)
  const queryBuilder = new QueryBuilder()
  const formatter = new CSVFormatter<User>(userSchema, ",")

  const dir = cfg.file.path
  const filename = `${getPrefix(cfg.file.prefix, now)}_${timeToString(now)}.csv`
  const writeStream = createWriteStream(dir, filename)
  const writer = new FileWriter(writeStream)

  try {
    logger.info(`Start to export "${path.join(dir, filename)}" file`)
    writer.write(cfg.file.header)
    const exporter = new ExportService<User>(pool, filename, queryBuilder, formatter, writer, userSchema, logger.info, 10000)
    const total = await exporter.export()

    logger.info(`Export "${path.join(dir, filename)}" file. Total: ${total}`)
  } catch (err) {
    logger.error(`Error when export "${path.join(dir, filename)}" file. Details: ${toString(err)}`)
  } finally {
    await pool.end()
    errorWriter.end()
    logWriter.end()
  }
}

exportData()
