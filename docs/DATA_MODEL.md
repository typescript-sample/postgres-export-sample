# Data Model and Database Mapping

## Supplied PostgreSQL schema

The application is designed around this table definition:

```sql
create table export_users (
    id varchar(45) not null,
    username varchar(45),
    email varchar(45),
    phone varchar(45),
    status varchar(45),
    createdDate timestamptz,
    primary key (id)
);
```

Important PostgreSQL detail: `createdDate` is unquoted in the DDL. PostgreSQL folds unquoted identifiers to lowercase, so the physical column name is `createddate`. The model's explicit `column: "createddate"` mapping agrees with that behavior.

## Current TypeScript interface

Defined in `src/user/index.ts`:

```ts
export interface User {
  id: string
  username: string
  email?: string
  phone?: string
  status?: boolean
  createdDate?: string
}
```

## Current `onecore` metadata

Also defined in `src/user/index.ts`:

```ts
export const userModel: Attributes = {
  id: {
    key: true,
    length: 11,
  },
  username: {
    length: 10,
    required: true,
  },
  email: {
    length: 31,
  },
  phone: {
    length: 20,
  },
  status: {
    length: 5,
    type: "boolean",
  },
  createdDate: {
    length: 10,
    type: "date",
    column: "createddate",
    getString: toString,
  },
}
```

`toString(v)` calls `v.toISOString()`.

## Field mapping and discrepancies

| Field | PostgreSQL | TypeScript interface | `userModel` metadata | Observation |
|---|---|---|---|---|
| `id` | `varchar(45) NOT NULL PRIMARY KEY` | required `string` | `key: true`, `length: 11` | Key metadata is present; metadata length is shorter than the database width. |
| `username` | nullable `varchar(45)` | required `string` | `required: true`, `length: 10` | Database permits `NULL`, while TypeScript and metadata require a value. |
| `email` | nullable `varchar(45)` | optional `string` | `length: 31` | Optionality agrees; metadata length is shorter than the database width. |
| `phone` | nullable `varchar(45)` | optional `string` | `length: 20` | Optionality agrees; metadata length is shorter than the database width. |
| `status` | nullable `varchar(45)` | optional `boolean` | `type: "boolean"`, `length: 5` | Important type mismatch: PostgreSQL returns this column as text for a `varchar` column, while the TypeScript contract declares boolean. |
| `createdDate` / `createddate` | nullable `timestamptz` | optional `string` | `type: "date"`, alias `createddate`, custom `getString` | The custom formatter expects a value with `toISOString()`, normally a JavaScript `Date` with the default `pg` timestamp parser. The interface says `string`, which conflicts with that runtime expectation. The database stores a timestamp with time zone, not a date-only value. |

### Required decisions before extending the model

1. **`status`:** determine whether the database stores values such as `true`/`false`, or domain codes such as `ACTIVE`/`INACTIVE`. Do not infer this from the column name. Then choose one consistent contract: change the database column to PostgreSQL `boolean`, keep a string/code contract, or add an explicit conversion layer. Check how the installed `CSVFormatter` handles `type: "boolean"` with a PostgreSQL string value before relying on implicit coercion.
2. **`createdDate`:** decide whether the exported CSV should contain a full ISO timestamp or a date-only value. `toISOString()` emits a timestamp. If the custom conversion remains, type the raw value as `Date` (or transform it explicitly before formatting) rather than declaring it as a string without conversion.
3. **`username`:** decide whether `NULL` is actually allowed. Either make the database column `NOT NULL` / enforce the value in data, or represent nullability consistently in the interface and metadata.
4. **Lengths:** current metadata lengths (11, 10, 31 and 20) do not match the SQL widths (45). A metadata `length` value does not alter the PostgreSQL column definition. Check how the locked `onecore`/`export-kit` versions use these values and align them with the intended export format; do not assume they are harmless or that they change SQL constraints.
5. **`id`:** the DDL guarantees a non-null primary key. Consider explicitly declaring `required: true` in metadata if that is required by the installed metadata/formatter contract; do not change it without checking the library's `key` semantics.

## CSV header contract

`src/config.ts` currently contains:

```ts
header: "id,username,email,phone,status,createddate\n"
```

The header is in the same intended order as the `userModel` properties. The header uses the physical PostgreSQL column spelling `createddate`, while the TypeScript property is `createdDate`. Keep the header, model order and actual formatter output aligned.

## Rules for future schema changes

When adding, removing or renaming a field, review all of the following in one change:

1. PostgreSQL DDL / migration.
2. `User` (or the new row interface) in the domain module.
3. `Attributes` metadata, including `column`, `type`, `required`, `key`, and relevant length/format details.
4. Query selection and any SQL aliases.
5. CSV header and formatter output order.
6. Tests or representative exported rows, including null and edge-case values.

Do not assume that the TypeScript property name, physical database column name and CSV header must be identical. Make intentional mappings explicit.
