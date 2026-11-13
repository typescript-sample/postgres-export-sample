# Feature Extension Guide

This guide describes how to add an export field, filter or second export while matching the existing project style.

## A. Add a field to the existing `User` export

Update the row contract and metadata together in `src/user/index.ts`.

Example shape (illustrative only; use the real business type and database column):

```ts
export interface User {
  id: string
  username: string
  email?: string
  phone?: string
  status?: boolean
  createdDate?: Date
  sourceSystem?: string
}

export const userModel: Attributes = {
  // Keep existing metadata in the same order as the CSV output.
  // Add sourceSystem metadata here using the actual database column name.
}
```

Do not copy the illustrative `createdDate?: Date` blindly if the output contract is intentionally a string. The current `getString` implementation calls `toISOString()`, so the interface should describe the raw value passed to it, or the application should explicitly transform the value before formatting.

When adding a field:

1. Confirm its SQL type, nullability, maximum width and physical column name.
2. Add the TypeScript property with the correct nullability and runtime type.
3. Add its `onecore` metadata. Use `column` when the physical database name differs from the TypeScript property name.
4. Ensure the selection includes the column via the metadata or an explicit SQL alias, according to the installed `pg-exporter` contract.
5. Update `cfg.file.header` in `src/config.ts` in the matching output order.
6. Verify the actual CSV for normal, null and edge-case values.

## B. Add query filters

Keep query construction in `QueryBuilder.build()` in `src/app.ts` or move it to a dedicated query-builder module if it becomes substantial.

The existing method contract is:

```ts
build(cxt?: any): Promise<Statement>
```

The current implementation returns a `Statement` containing `query` only. When filters are added:

- Define and type the context rather than allowing arbitrary `any` if the context becomes meaningful.
- Use PostgreSQL placeholders and the `params` field supported by the installed `Statement` type.
- Do not concatenate filter values into SQL.
- Keep SQL conditions separate from CSV formatting.
- Decide and document whether ordering is required for repeatable exports; the current query has no explicit `ORDER BY`.

Do not guess placeholder behavior from a newer `pg-exporter` release. Check the locked package declaration/source before implementing.

## C. Add a second export domain

For a distinct table or output contract, follow the current `user` module pattern:

```text
src/
├── app.ts
├── config.ts
├── user/
│   └── index.ts
└── <new-domain>/
    └── index.ts
```

A new domain module should normally own:

- The row interface (for example, `Order`).
- The matching `onecore` `Attributes` constant (for example, `orderModel`).
- Small field-level conversion helpers only when they describe that domain's data representation.

Keep reusable pipeline wiring in the application layer. If multiple exports make `app.ts` too large, extract a small function or class that composes one export; avoid creating a framework merely to remove a few lines.

## D. Change the output format

The current application uses `CSVFormatter<User>` with a comma delimiter. `pg-exporter` separates row retrieval from formatting, so a new format should normally be implemented by selecting the appropriate formatter from `export-kit` (if one exists) or by supplying a compatible formatter implementation.

Do not put CSV-specific escaping or quoting into the query builder. Do not manually join field values unless the requirement explicitly asks for custom formatting and the behavior is covered by tests.

## E. Change configuration

Add a default to `src/config.ts` first. Add profile-specific overrides to `environments` only when the setting genuinely differs between `sit`, `prd` or another defined profile. Use environment variables for secrets and deployment-specific connection values.

`config-plus` maps nested keys to uppercase underscore-separated environment variable names. For example, `db.connectionString` maps to `DB_CONNECTIONSTRING` in this project's current naming. Preserve the default type when adding configurable numbers or booleans so environment parsing can use it.

Do not add credentials to `src/config.ts`, documentation, examples or committed `.env` files.

## F. Test and verify a feature

The supplied repository has no test files or test script. When adding tests, choose and configure a test runner deliberately rather than assuming Jest/Vitest is already installed.

At minimum, verify:

- Query text and parameter values.
- Database-to-model column mapping.
- Nullability and date/boolean conversions.
- Header names and order.
- CSV quoting/escaping for commas, quotes and newlines.
- Large-result streaming behavior.
- Database, query, formatter and file-writer failure paths.
- Correct process exit status for a failed scheduled export.

Record any new scripts and dependencies in `package.json` and update `package-lock.json` together.
