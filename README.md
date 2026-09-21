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
- direct search across technologies, patterns, APIs, tags and code terms
- cross-technology “Same pattern in…” links powered by shared concept keys
- persistent favorites + review queue with oldest/never-reviewed items first
- AI-ready version-update surface

Seeded coverage includes Python, Pandas, Polars, Spark/PySpark, Airflow, dbt, SQL, DuckDB, Delta Lake, BigQuery, Snowflake, T-SQL, PostgreSQL, MySQL, FastAPI, Kubernetes, Linux, PowerShell, DAX, Excel, Docker and Git.

## Run

```bash
npm install
npm run dev
```

## Content rule

Evergreen syntax and mental models belong in Memo / Patterns / APIs. Version-sensitive facts belong in What's new. An AI refresh pipeline should compare official release sources, append a concise delta, and flag any evergreen pattern that genuinely needs revision.

## Learning model

AtlasCode now separates three kinds of retrieval:

- **Find**: global search jumps directly to a technology, pattern or API surface.
- **Compare**: shared concept keys connect equivalent patterns across ecosystems, such as latest-row logic in SQL, Pandas, Polars, PySpark, BigQuery, Snowflake, PostgreSQL, MySQL and T-SQL.
- **Review**: starred patterns enter a local review queue. Never-reviewed and oldest-reviewed patterns rise to the top; marking an item reviewed updates its recency without removing it.
