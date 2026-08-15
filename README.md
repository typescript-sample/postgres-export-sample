# postgres-export-sample

**A complete PostgreSQL export application built with the core-ts ecosystem.**

`postgres-export-sample` demonstrates how to build a production-ready export application by composing small, focused libraries. It streams data from PostgreSQL, formats records as CSV, writes the output to disk, and generates progress and application logs.

The sample intentionally contains very little application logic. Most of the work is delegated to reusable infrastructure libraries.

Instead of using a large framework, each library has a single responsibility and can be reused independently.

- [`config-plus`](https://www.npmjs.com/package/config-plus) — Configuration management
- [`logger-core`](https://www.npmjs.com/package/logger-core) — Logging
- [`pg-exporter`](https://www.npmjs.com/package/pg-exporter) — Streams data directly from PostgreSQL to CSV
- [`export-kit`](https://www.npmjs.com/package/export-kit) — File formatting and writing

The application itself contains almost no infrastructure code because those responsibilities are delegated to reusable libraries.

---

# Features

* Environment-based configuration
* PostgreSQL streaming export
* Schema-driven formatting
* Automatic field mapping
* CSV file generation
* Progress logging
* File logging
* Constant memory usage
* Modular architecture

---

# Architecture

```text
                    config-plus
                         │
                         ▼
                    Application
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   logger-core      pg-exporter      export-kit
        │                │                │
        │         PostgreSQL Stream       │
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
                     CSV File
```

Each library has a single responsibility.

---

# Export Pipeline

```text
   PostgreSQL
        │
        ▼
  QueryBuilder
        │
        ▼        
 Streaming Export
  (pg-exporter)
        │
        ▼
Application Objects
        │
        ▼
   CSVFormatter
   (export-kit)
        │
        ▼
   CSV Records
        │
        ▼
    FileWriter
   (export-kit)
        │
        ▼
user_YYYYMMDD_HHMMSS.csv
```

The application only assembles the pipeline and starts the export.

---

# Ecosystem Integration

This sample demonstrates how several [**core-ts**](https://github.com/core-ts) libraries work together.

| Library                                                    | Purpose                                      |
|------------------------------------------------------------|----------------------------------------------|
| [`onecore`](https://www.npmjs.com/package/onecore)         | Unified Metadata                             |
| [`config-plus`](https://www.npmjs.com/package/config-plus) | Configuration management                     |
| [`logger-core`](https://www.npmjs.com/package/logger-core) | Structured logging                           |
| [`pg-exporter`](https://www.npmjs.com/package/pg-exporter) | Streams data directly from PostgreSQL to CSV |
| [`export-kit`](https://www.npmjs.com/package/export-kit)   | File I/O, CSV and fixed-length formatting    |

Each library focuses on a single responsibility.

That demonstrates the intended layering very well.

---

# Libraries Used

## config-plus

Loads configuration and environment-specific settings.

```ts
const cfg = merge(config, process.env, environments, process.env.ENV)
```

Responsible for:

* configuration
* environment overrides

```text
          Default Configuration
                   │
                   ▼
Environment Configuration (SIT, UAT, PRD)
                   │
                   ▼
   Environment Variables (process.env)
                   │
                   ▼
          Final Configuration
```

---

## logger-core

Provides structured logging.

Responsible for:

* application logs
* error logs
* progress logging

---

## export-kit

Responsible for formatting and writing files.

Used components include:

* `CSVFormatter`
* `FileWriter`
* `LogWriter`
* `createWriteStream`

### Workflow Utilities

This sample also demonstrates why [**export-kit**](https://www.npmjs.com/package/export-kit) contains a small set of workflow utilities.

```ts
const filename = getPrefix("user_", now) + "_" + timeToString(now) + ".csv"
```

Instead of creating project-specific helper functions, these common batch-processing utilities are shared across applications.

---

## pg-exporter

Responsible for exporting data from PostgreSQL.

```ts
const exporter = new ExportService<User>(pool, filename, queryBuilder, formatter, writer, userModel, logger.info, 100);

const total = await exporter.export();
```

Features demonstrated:

* streaming queries
* query builders
* export pipeline
* progress reporting

---

# Query Builder

The SQL statement is isolated from the exporter.

```text
Application
      │
      ▼
QueryBuilder
      │
      ▼
SQL Statement
      │
      ▼
  Exporter
```

This separation makes SQL generation reusable and easy to test.

---

# Metadata-Driven Export

The sample defines a single model describing the exported data.

```text
User Model
      │
      ├────────► Database Mapping
      │
      ├────────► CSV Formatting
      │
      └────────► Column Mapping
```

Instead of duplicating metadata across multiple components, the same model is reused throughout the export pipeline.

---

# Streaming Export

Rows are processed one at a time.

```text
   Row
    │
    ▼
Formatter
    │
    ▼
  Writer
    │
    ▼
 Next Row
```

Memory usage remains nearly constant even when exporting very large tables.

---

# Logging

The sample demonstrates two kinds of logging:

* Application logs
* Error logs

Log files are automatically timestamped using the workflow utilities provided by [**export-kit**](https://www.npmjs.com/package/export-kit).

```ts
import { getPrefix, LogWriter, timeToString } from "export-kit"
import { createFileLogger } from "logger-core"

const now = new Date()

const errorWriter = new LogWriter(getPrefix("error_", now) + "_" + timeToString(now) + ".txt", "./log/")
const logWriter = new LogWriter(getPrefix("log_", now) + "_" + timeToString(now) + ".txt", "./log/")

const logger = createFileLogger(cfg.log, errorWriter.write, logWriter.write)
```

Example:

```text
log_20260809_214552.txt
error_20260809_214552.txt
```

In addition, `pg-exporter` reports export progress at configurable intervals, making long-running batch jobs easier to monitor.

---

# Running the Sample

```bash
npm install
npm start
```

After execution:

```text
out_dir/
  ├── user_20260809_214552.csv
log/
  ├── log_20260809_214552.txt
  └── error_20260809_214552.txt
```

---

# Project Structure

```text
src
├── app.ts
├── config.ts
└── user
    └── index.ts
```

* **app.ts** — Builds the export pipeline and starts the application.
* **config.ts** — Defines application and environment configuration.
* **user/** — Defines the domain model and export metadata.

---

# Design Principles

This sample follows a few simple principles:

* Single responsibility
* Metadata-driven configuration
* Streaming instead of buffering
* Reusable infrastructure libraries
* Thin application layer
* Composition over monolithic frameworks

---

# Typical Use Cases

The same architecture can be adapted for:

* Scheduled exports
* CSV report generation
* Data warehouse exports
* Banking files
* ETL pipelines
* Regulatory reporting
* Data migration
* Enterprise batch processing

---

# What This Sample Demonstrates

Rather than focusing on business logic, this project demonstrates how multiple core-ts libraries work together to build a complete export application.

It shows how to:

* Stream data from PostgreSQL
* Build SQL independently of export logic
* Format records using reusable formatters
* Write output files efficiently
* Log export progress
* Keep application code small and maintainable

This composition-first approach allows each library to evolve independently while keeping the application layer simple and focused.

# License

MIT
