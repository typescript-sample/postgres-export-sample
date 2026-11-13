# Project Overview

## What this application does

This is a Node.js/TypeScript batch application that reads data from PostgreSQL table `export_users`, converts the records to CSV, writes the CSV to the local filesystem, and writes application/error logs to files.

It is a thin composition layer over the core-ts ecosystem. It does not expose HTTP endpoints, a user interface, or a message consumer in the supplied source snapshot.

## Repository layout

```text
.
├── AGENTS.md
├── docs/
│   ├── PROJECT_OVERVIEW.md
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── EXPORT_PIPELINE.md
│   ├── FEATURE_GUIDE.md
│   └── KNOWN_ISSUES.md
├── src/
│   ├── app.ts              # Application composition and export lifecycle
│   ├── config.ts           # Default and environment-specific configuration
│   └── user/
│       └── index.ts        # User interface and onecore Attributes metadata
├── package.json
├── package-lock.json
├── tsconfig.json
├── webpack.config.js
└── .prettierrc.json
```

The uploaded archive also contains a local `.env` file. It is ignored by `.gitignore` and should remain untracked.

## Runtime stack

Versions below are read from the supplied `package-lock.json`, not inferred from package ranges:

| Package           | Locked version | Role in this project                                                        |
| ----------------- | -------------: | --------------------------------------------------------------------------- |
| `pg`              |         8.23.1 | PostgreSQL connection pool                                                  |
| `pg-query-stream` |         4.17.1 | PostgreSQL query streaming dependency used by the exporter ecosystem        |
| `pg-exporter`     |          0.3.5 | Export orchestration and PostgreSQL streaming                               |
| `export-kit`      |          0.2.6 | CSV formatting, file writer, stream and naming/log utilities                |
| `onecore`         |         0.6.15 | Shared `Attributes` metadata                                                |
| `config-plus`     |          0.1.2 | Merges default, environment-specific and environment-variable configuration |
| `logger-core`     |          0.5.3 | File logger                                                                 |
| `dotenv`          |        18.0.10 | Loads local `.env` variables                                                |
| `typescript`      |          6.0.3 | TypeScript compiler                                                         |
| `webpack`         |        5.112.2 | Bundles the application                                                     |

## Runtime configuration

`src/app.ts` performs the following configuration steps:

1. Calls `dotenv.config()` to load local `.env` values into `process.env`.
2. Calls `merge(config, process.env, environments, process.env.ENV)` from `config-plus`.
3. Passes the resulting database configuration to `new Pool(cfg.db)`.

The supplied `.env` has `ENV=dev` and `DB_CONNECTIONSTRING=...`. The defaults define `db.connectionString`; `config-plus` maps nested configuration names to uppercase underscore-separated environment variables, so `DB_CONNECTIONSTRING` targets `db.connectionString`.

`src/config.ts` defines explicit overrides only for `sit` and `prd`. `dev` therefore uses the default configuration plus environment-variable overrides. Do not assume that a `uat` profile exists.

## Output layout

The default configuration targets:

```text
out_dir/   CSV export files
log/       application and error log files
```

The CSV filename is built from `cfg.file.prefix`, the current time and the `.csv` suffix. The two log filenames are timestamped separately using `export-kit` helpers.

The source snapshot does not establish whether the installed `export-kit` helpers create missing directories. Verify this behavior or provision the directories before deploying to a clean filesystem.

## Build configuration

- `tsconfig.json` uses strict type checking, `module: "node16"`, `moduleResolution: "node16"`, `target: "es6"`, and emits compiled files to `es6/`.
- `webpack.config.js` targets Node and bundles `src/app.ts` to `dist/app.js`.
- `.prettierrc.json` configures two-space indentation, double quotes and no semicolons.

See [`KNOWN_ISSUES.md`](KNOWN_ISSUES.md) before depending on the supplied build and quality scripts.
