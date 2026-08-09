# postgres-export-sample

**A complete PostgreSQL export application built with the core-ts ecosystem.**

`postgres-export-sample` demonstrates how to build a production-ready export application by composing small, focused libraries. It streams data from PostgreSQL, formats records as CSV, writes the output to disk, and generates progress and application logs.

The sample intentionally contains very little application logic. Most of the work is delegated to reusable infrastructure libraries.

---

# Features

* PostgreSQL streaming export
* CSV file generation
* Schema-driven formatting
* Automatic field mapping
* Progress logging
* File logging
* Environment-based configuration
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
 pg-exporter
      │
      ▼
 CSVFormatter
      │
      ▼
 FileWriter
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

Responsible for:

* configuration
* environment overrides

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

---

## pg-exporter

Responsible for exporting data from PostgreSQL.

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

In addition, `pg-exporter` reports export progress at configurable intervals, making long-running batch jobs easier to monitor.

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

* Composition over monolithic frameworks
* Single responsibility
* Metadata-driven configuration
* Streaming instead of buffering
* Reusable infrastructure libraries
* Thin application layer

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
