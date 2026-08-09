var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { merge } from "config-plus";
import { createWriteStream, CSVFormatter, FileWriter, getPrefix, LogWriter, timeToString } from "export-kit";
import { createFileLogger } from "logger-core";
import path from "path";
import { Pool } from "pg";
import { config, environments } from "./config";
import { Exporter, select } from "./pg-exporter";
import { userModel } from "./user";
const cfg = merge(config, process.env, environments, process.env.ENV);
export class QueryBuilder {
    constructor() {
        this.buildQuery = this.buildQuery.bind(this);
    }
    buildQuery(cxt) {
        const stmt = { query: select("export_users", userModel) };
        return Promise.resolve(stmt);
    }
}
function exportData() {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = new Pool(cfg.db);
        const now = new Date();
        const errorWriter = new LogWriter(getPrefix(cfg.error.prefix, now) + "_" + timeToString(now) + cfg.error.suffix, cfg.error.directory);
        const logWriter = new LogWriter(getPrefix(cfg.info.prefix, now) + "_" + timeToString(now) + cfg.info.suffix, cfg.info.directory);
        const logger = createFileLogger(cfg.log, errorWriter.write, logWriter.write);
        const dir = cfg.file.path;
        const filename = getPrefix(cfg.file.prefix, now) + "_" + timeToString(now) + ".csv";
        const writeStream = createWriteStream(dir, filename);
        const writer = new FileWriter(writeStream);
        const formatter = new CSVFormatter(",", userModel);
        const queryBuilder = new QueryBuilder();
        logger.info(`Export "${path.join(dir, filename)}" file`);
        const exporter = new Exporter(pool, queryBuilder.buildQuery, formatter.format, writer.write, writer.end, userModel);
        const total = yield exporter.export();
        logger.info(`Export "${path.join(dir, filename)}" file. Total: ${total}`);
        console.log(total);
    });
}
exportData();
