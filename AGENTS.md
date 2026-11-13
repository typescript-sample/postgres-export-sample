# AI Agent Guide

## Purpose

This repository is a small Node.js/TypeScript batch application that exports rows from PostgreSQL table `export_users` to a CSV file. It is an integration sample for the core-ts libraries, not a web API or a general-purpose application framework.

Before changing code, read the relevant documents:

1. [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) — repository structure, runtime and dependencies.
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — responsibilities and dependency flow.
3. [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — authoritative database design and the current TypeScript/metadata mapping.
4. [`docs/EXPORT_PIPELINE.md`](docs/EXPORT_PIPELINE.md) — export execution sequence.
5. [`docs/FEATURE_GUIDE.md`](docs/FEATURE_GUIDE.md) — how to add an export feature in the existing style.
6. [`docs/KNOWN_ISSUES.md`](docs/KNOWN_ISSUES.md) — observed inconsistencies and verification gaps.

## Source-of-truth rules

- Treat the actual source code and the supplied PostgreSQL DDL as the current implementation contract. Documentation describes the checked-in snapshot; update it when implementation changes.
- Treat `package-lock.json` as the source of truth for installed dependency versions. Do not assume the latest API of a core-ts package is the API available to this project.
- The supplied table is `export_users`. Do not invent columns, constraints, status values, indexes, or business rules.
- Before changing a field, reconcile all four representations: PostgreSQL column, TypeScript interface, `onecore` `Attributes` metadata, and CSV header/formatting.
- Do not silently “correct” known schema mismatches. First determine the intended business meaning and make the database/model/output change consistently.
- This uploaded snapshot does not contain a test suite or `node_modules`. Do not claim that code or database behavior has been runtime-tested unless you actually run the relevant checks in the working environment.

## Architecture rules

- Keep `src/app.ts` as the composition/orchestration layer unless there is a clear reason to split it.
- Keep domain/export row types and their `onecore` metadata together in a domain folder, following `src/user/index.ts`.
- Reuse the existing core-ts components before introducing a new abstraction or a large framework:
  - `config-plus` for configuration merging.
  - `logger-core` for file logging.
  - `pg-exporter` for PostgreSQL export orchestration and streaming.
  - `export-kit` for CSV/file formatting and writing.
  - `onecore` for shared `Attributes` metadata.
- Keep SQL construction in a `QueryBuilder` implementation rather than embedding query logic throughout the export pipeline.
- Keep formatting independent of SQL execution. Use a formatter and writer supplied to `ExportService`.
- Preserve streaming for large exports. Do not replace the streaming exporter with `pool.query()` plus an in-memory array unless the requirement explicitly calls for bounded, small result sets and the memory trade-off is documented.

## TypeScript and formatting conventions

Follow `.prettierrc.json` and the existing `.ts` files:

- Double quotes for strings.
- No semicolons.
- Two-space indentation.
- Trailing commas where Prettier applies them.
- Maximum line width is configured as 260 characters.
- `camelCase` for variables, functions and properties.
- `PascalCase` for interfaces, classes and generic type names.
- `Attributes` schemas use `camelCase` property names and explicit metadata such as `key`, `required`, `type`, `length`, and `column` when needed.
- Prefer the current import style and named exports used by this repository.
- Keep TypeScript strictness enabled; do not weaken `strict` to make a feature compile.

## Database and SQL rules

- Use parameterized SQL for user-supplied or runtime filter values. Do not concatenate values into SQL text.
- `QueryBuilder.build(cxt?: any): Promise<Statement>` is the pattern used in the current application. When a query has parameters, return them through the `Statement` contract supported by the installed `pg-exporter` version.
- Keep database column names, model property names and `Attributes` mappings aligned. The current mapping for `createdDate` explicitly uses `column: "createddate"`.
- The provided DDL uses unquoted `createdDate`. PostgreSQL folds unquoted identifiers to lowercase, so the physical column name is `createddate`. Do not add SQL double quotes around camelCase column names unless the table was actually created with quoted identifiers.
- Do not guess the allowed values or meaning of `status`. The DDL says `varchar(45)`, while the current TypeScript metadata says `boolean`.

## Adding or changing an export

1. Read [`docs/FEATURE_GUIDE.md`](docs/FEATURE_GUIDE.md).
2. Define or update the exported TypeScript interface and its `Attributes` schema together.
3. Update the `QueryBuilder` so it selects/maps exactly the required columns.
4. Update the CSV header in `src/config.ts` and verify its order and names against the formatter schema.
5. Wire the formatter, writer, and `ExportService` using the existing composition style.
6. Add or update tests if a test framework is introduced; cover query construction, field mapping, formatting and failure behavior.
7. Check error handling and cleanup paths. Do not swallow a batch failure if the caller/scheduler needs a failing process exit code.
8. Update the relevant files under `docs/` when architecture, data mapping or commands change.

## Commands and verification

The package currently declares these scripts:

- `npm start` / `npm run dev`: start the TypeScript application through `nodemon` and `ts-node-dev`.
- `npm run build`: invoke webpack.
- `npm run prod`: start the built output.
- `npm run compile`: remove `./build` and run `tsc`.

Before relying on a command, check [`docs/KNOWN_ISSUES.md`](docs/KNOWN_ISSUES.md): the snapshot references build tools/scripts that are not all declared in `package.json`/`package-lock.json`. There are no `test`, `prettier-format` or `lint` scripts in the supplied `package.json`.

Do not commit `.env` or credentials. `.env` is ignored by `.gitignore`; use deployment environment variables or a local untracked `.env` file for secrets.
