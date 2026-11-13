# Known Issues and Verification Notes

These notes describe the uploaded source snapshot. They are not claims that the issues have been reproduced at runtime; the archive does not include `node_modules`, a test suite or a live database.

## 1. Database/model mismatches

See [`DATA_MODEL.md`](DATA_MODEL.md) for the complete field table. The main items are:

- SQL `status` is nullable `varchar(45)`, but TypeScript and `userModel` declare it as boolean.
- SQL `createdDate` is nullable `timestamptz`; TypeScript declares `string`, while `getString` calls `.toISOString()` and therefore expects a Date-like value.
- SQL `username` is nullable, but TypeScript and metadata require it.
- Metadata lengths (11, 10, 31 and 20) are shorter than the database widths (45).
- `createdDate` metadata declares `type: "date"` although the database column is a timestamp with time zone. The custom converter emits an ISO timestamp string.

These may produce type, conversion, validation, formatting or data-contract problems. Determine intended semantics before changing them.

## 2. Error handling and process status

`exportData()` catches an export error, logs it and then completes without rethrowing or setting a non-zero exit code. This can make a failed batch appear successful to a scheduler or deployment job. Decide whether the process should fail on an export error.

The module calls `exportData()` at the bottom of `src/app.ts` without exporting or awaiting a top-level `main` function. This is valid as an entry-point pattern, but it makes isolated testing and explicit process lifecycle control harder.

## 3. Cleanup ordering

The `finally` block awaits `pool.end()` before ending the error and info log writers. If `pool.end()` rejects, the later cleanup statements can be skipped. Consider independent cleanup or nested `finally` blocks when modifying resource lifecycle code.

The app does not show explicit stream error listeners or an explicit `FileWriter` close call. Check the installed `export-kit` and `pg-exporter` contracts before changing stream handling; do not assume Node stream errors are already surfaced through `exporter.export()`.

## 4. Build and quality scripts

The supplied `package.json` declares:

```json
{
  "scripts": {
    "start": "nodemon --exec ts-node-dev src/app",
    "build": "webpack --config webpack.config.js",
    "prod": "node dist/app",
    "dev": "nodemon --exec ts-node-dev src/app",
    "compile": "rimraf ./build && tsc"
  }
}
```

Observed repository-level concerns:

- `compile` invokes `rimraf`, but `rimraf` is not present in the supplied `package.json` or lockfile.
- `webpack.config.js` requires `uglifyjs-webpack-plugin`, but that package is not present in the supplied `package.json` or lockfile.
- The webpack config also includes `webpack-bundle-analyzer`; unlike the Uglify plugin, that package is declared.
- There are no `test`, `prettier-format` or `lint` scripts, even though the package has a legacy-looking `husky.hooks.pre-commit` configuration that references them.
- Webpack writes `dist/app.js`, while the `prod` command omits the `.js` extension. Verify that command on the target Node runtime; using `node dist/app.js` is clearer.
- `tsconfig.json` emits to `es6/`, while `compile` removes `build/`. Confirm the intended output/cleanup directory.

Do not add dependencies or rewrite the build setup unless build support is part of the task. If it is, make the scripts, dependencies, lockfile and output paths consistent as one change.

## 5. Local configuration and filesystem assumptions

- `.env` is ignored by `.gitignore`; keep connection credentials out of source control.
- The uploaded archive contains a local `.env` file. Treat its connection string as an example/local secret, not as a value to copy into code or docs.
- `out_dir/` and `log/` are configured output locations, but are not part of the supplied source file list. Verify whether the installed file helpers create those directories or provision them before execution.
- The configured `ENV=dev` does not select a `dev` object in `src/config.ts`; only `sit` and `prd` overrides are defined. `dev` therefore uses defaults and environment-variable overrides.

## 6. No automated tests in the supplied archive

No test files are present in the uploaded archive and `package.json` does not declare a test script. The project has not been validated against a live PostgreSQL database as part of this documentation generation. Add tests and a reproducible database fixture before treating future changes as regression-tested.
