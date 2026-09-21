# AtlasCode Studio

AtlasCode is a Fluent UI React knowledge workbench for reading and memorising coding patterns, APIs, libraries, algorithms and version changes. It intentionally does not execute code.

## Product boundary

- AtlasNote: documents, PDFs, notes and long-form reading.
- AtlasCode: read-only code/API pattern recall.
- Datapass Studio: notebooks, execution, terminals and data-engineering labs.

AtlasCode reuses AtlasNote ideas conceptually (workspaces, tabs, split reading, cheat-sheet density, saved state) without forking its PDF/durability stack.

## V1

- Fluent UI React shell
- multiple persisted workspace tabs
- optional two-pane comparison mode
- independent technology + view in each pane
- Memo / Patterns / APIs / Examples / Practice / What's new
- copyable read-only code cards
- pattern-recognition exercises with reveal
- compact and dark modes
- search across technologies, pattern titles and tags
- AI-ready version-update surface

Seeded coverage includes Python, Pandas, Polars, Spark/PySpark, Airflow, dbt, SQL, DuckDB, Delta Lake, BigQuery, Snowflake, T-SQL, PostgreSQL, MySQL, FastAPI, Kubernetes, Linux, PowerShell, DAX, Excel, Docker and Git.

## Run

```bash
npm install
npm run dev
```

## Content rule

Evergreen syntax and mental models belong in Memo / Patterns / APIs. Version-sensitive facts belong in What's new. An AI refresh pipeline should compare official release sources, append a concise delta, and flag any evergreen pattern that genuinely needs revision.