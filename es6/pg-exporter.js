var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import QueryStream from 'pg-query-stream';
export class Exporter {
    constructor(pool, buildQuery, format, write, end, attributes) {
        this.pool = pool;
        this.buildQuery = buildQuery;
        this.format = format;
        this.write = write;
        this.end = end;
        this.attributes = attributes;
        if (attributes) {
            this.map = buildMap(attributes);
        }
        this.export = this.export.bind(this);
    }
    export(ctx) {
        var e_1, _a, e_2, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let i = 0;
            const stmt = yield this.buildQuery(ctx);
            const query = new QueryStream(stmt.query, stmt.params);
            yield this.pool.connect();
            this.pool.query(query);
            if (this.map) {
                try {
                    for (var query_1 = __asyncValues(query), query_1_1; query_1_1 = yield query_1.next(), !query_1_1.done;) {
                        const data = query_1_1.value;
                        i++;
                        const obj = mapOne(data, this.map);
                        const str = this.format(obj);
                        this.write(str);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (query_1_1 && !query_1_1.done && (_a = query_1.return)) yield _a.call(query_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            else {
                try {
                    for (var query_2 = __asyncValues(query), query_2_1; query_2_1 = yield query_2.next(), !query_2_1.done;) {
                        const data = query_2_1.value;
                        i++;
                        const str = this.format(data);
                        this.write(str);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (query_2_1 && !query_2_1.done && (_b = query_2.return)) yield _b.call(query_2);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            this.pool.end();
            this.end();
            return i;
        });
    }
}
export class ExportService {
    constructor(pool, queryBuilder, formatter, writer, attributes) {
        this.pool = pool;
        this.queryBuilder = queryBuilder;
        this.formatter = formatter;
        this.writer = writer;
        this.attributes = attributes;
        if (attributes) {
            this.map = buildMap(attributes);
        }
        this.export = this.export.bind(this);
    }
    export(ctx) {
        var e_3, _a, e_4, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let i = 0;
            const stmt = yield this.queryBuilder.buildQuery(ctx);
            const query = new QueryStream(stmt.query, stmt.params);
            yield this.pool.connect();
            this.pool.query(query);
            if (this.map) {
                try {
                    for (var query_3 = __asyncValues(query), query_3_1; query_3_1 = yield query_3.next(), !query_3_1.done;) {
                        const data = query_3_1.value;
                        i++;
                        const obj = mapOne(data, this.map);
                        const str = this.formatter.format(obj);
                        this.writer.write(str);
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (query_3_1 && !query_3_1.done && (_a = query_3.return)) yield _a.call(query_3);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            }
            else {
                try {
                    for (var query_4 = __asyncValues(query), query_4_1; query_4_1 = yield query_4.next(), !query_4_1.done;) {
                        const data = query_4_1.value;
                        i++;
                        const str = this.formatter.format(data);
                        this.writer.write(str);
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (query_4_1 && !query_4_1.done && (_b = query_4.return)) yield _b.call(query_4);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            }
            this.pool.end();
            if (this.writer.end) {
                this.writer.end();
            }
            else if (this.writer.flush) {
                this.writer.flush();
            }
            return i;
        });
    }
}
export function mapOne(results, m) {
    const obj = results;
    if (!m) {
        return obj;
    }
    const mkeys = Object.keys(m);
    if (mkeys.length === 0) {
        return obj;
    }
    const obj2 = {};
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
export function buildMap(attrs) {
    const mp = {};
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
export function param(i) {
    return '$' + i;
}
export function select(table, attrs) {
    const cols = [];
    const ks = Object.keys(attrs);
    for (const k of ks) {
        const attr = attrs[k];
        attr.name = k;
        const field = (attr.column ? attr.column : k);
        const s = field.toLowerCase();
        cols.push(s);
    }
    return `select ${cols.join(',')} from ${table}`;
}
