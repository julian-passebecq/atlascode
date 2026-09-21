export type Mode = "memo" | "patterns" | "apis" | "examples" | "practice" | "updates";
export type Pattern = {id:string,title:string,language:string,code:string,why:string,remember:string,tags:string[]};
export type Technology = {id:string,name:string,group:string,tagline:string,basics:{label:string;value:string}[],patterns:Pattern[],apis:{name:string;signature:string;whatFor:string;example:string}[],practices:{title:string;prompt:string;pattern:string;reveal:string}[]};
export const catalog: Technology[] = [
  {
    "id": "python",
    "name": "Python",
    "group": "Language",
    "tagline": "Core data-engineering Python patterns.",
    "basics": [
      {
        "label": "Comprehension",
        "value": "[f(x) for x in rows if keep(x)]"
      },
      {
        "label": "Lookup",
        "value": "mapping.get(key, default)"
      },
      {
        "label": "Context",
        "value": "with open(path) as f: ..."
      },
      {
        "label": "Enumerate",
        "value": "for i, x in enumerate(xs): ..."
      }
    ],
    "patterns": [
      {
        "id": "py-index",
        "title": "Index once, look up many",
        "language": "python",
        "code": "users_by_id = {u[\"id\"]: u for u in users}\n\nfor event in events:\n    user = users_by_id.get(event[\"user_id\"])\n    if user:\n        enrich(event, user)",
        "why": "Replace repeated scans with one dictionary index.",
        "remember": "A dictionary is the standard repeated key-lookup pattern.",
        "tags": [
          "dict",
          "algorithm"
        ]
      },
      {
        "id": "py-generator",
        "title": "Stream with a generator",
        "language": "python",
        "code": "def batches(rows, size):\n    batch = []\n    for row in rows:\n        batch.append(row)\n        if len(batch) == size:\n            yield batch\n            batch = []\n    if batch:\n        yield batch",
        "why": "Process streams incrementally instead of materializing everything.",
        "remember": "Use yield for files, API pages and large record streams.",
        "tags": [
          "iterator",
          "memory"
        ]
      }
    ],
    "apis": [
      {
        "name": "enumerate",
        "signature": "enumerate(iterable, start=0)",
        "whatFor": "Loop with index and value.",
        "example": "for i, row in enumerate(rows, start=1): ..."
      },
      {
        "name": "zip",
        "signature": "zip(*iterables, strict=False)",
        "whatFor": "Traverse aligned iterables.",
        "example": "for name, score in zip(names, scores): ..."
      }
    ],
    "practices": [
      {
        "title": "Deduplicate in order",
        "prompt": "Keep the first occurrence of each event_id.",
        "pattern": "seen set + output list",
        "reveal": "Maintain a set for membership and append only unseen IDs."
      }
    ]
  },
  {
    "id": "pandas",
    "name": "Pandas",
    "group": "DataFrame",
    "tagline": "Readable tabular transformations and validation.",
    "basics": [
      {
        "label": "Filter",
        "value": "df.loc[df['status'].eq('ok')]"
      },
      {
        "label": "Assign",
        "value": "df.assign(total=lambda x: x.qty * x.price)"
      },
      {
        "label": "Group",
        "value": "df.groupby('customer').agg(...)"
      },
      {
        "label": "Merge",
        "value": "left.merge(right, on='id', validate='m:1')"
      }
    ],
    "patterns": [
      {
        "id": "pd-chain",
        "title": "Readable method chain",
        "language": "python",
        "code": "result = (\n    orders\n    .query(\"status == 'paid'\")\n    .assign(revenue=lambda d: d[\"qty\"] * d[\"price\"])\n    .groupby(\"country\", as_index=False)\n    .agg(revenue=(\"revenue\", \"sum\"))\n)",
        "why": "Keep a transformation visible top to bottom.",
        "remember": "Method chains work best when each step changes the same DataFrame conceptually.",
        "tags": [
          "transform",
          "groupby"
        ]
      },
      {
        "id": "pd-merge",
        "title": "Validate joins",
        "language": "python",
        "code": "enriched = orders.merge(\n    customers,\n    on=\"customer_id\",\n    how=\"left\",\n    validate=\"m:1\",\n    indicator=True,\n)",
        "why": "Join cardinality bugs can silently multiply rows.",
        "remember": "validate and indicator make assumptions explicit.",
        "tags": [
          "merge",
          "quality"
        ]
      }
    ],
    "apis": [
      {
        "name": "assign",
        "signature": "df.assign(**columns)",
        "whatFor": "Add derived columns in a chain.",
        "example": "df.assign(net=lambda d: d.gross-d.tax)"
      },
      {
        "name": "GroupBy.agg",
        "signature": "grouped.agg(new_col=('source','func'))",
        "whatFor": "Named aggregation.",
        "example": "df.groupby('k').agg(total=('v','sum'))"
      }
    ],
    "practices": [
      {
        "title": "Latest order per customer",
        "prompt": "Keep one newest order per customer.",
        "pattern": "sort + drop_duplicates",
        "reveal": "Sort by timestamp descending, then drop_duplicates on customer_id."
      }
    ]
  },
  {
    "id": "polars",
    "name": "Polars",
    "group": "DataFrame",
    "tagline": "Expression-first columnar DataFrames.",
    "basics": [
      {
        "label": "Select",
        "value": "df.select(pl.col('a'))"
      },
      {
        "label": "Filter",
        "value": "df.filter(pl.col('status') == 'ok')"
      },
      {
        "label": "Group",
        "value": "df.group_by('customer').agg(...)"
      },
      {
        "label": "Lazy",
        "value": "pl.scan_parquet(path)...collect()"
      }
    ],
    "patterns": [
      {
        "id": "pl-expr",
        "title": "Expression pipeline",
        "language": "python",
        "code": "result = (\n    df\n    .filter(pl.col(\"status\") == \"paid\")\n    .with_columns((pl.col(\"qty\") * pl.col(\"price\")).alias(\"revenue\"))\n    .group_by(\"country\")\n    .agg(pl.col(\"revenue\").sum())\n)",
        "why": "Expressions give Polars room to optimize and parallelize.",
        "remember": "Think column expressions, not row-wise Python.",
        "tags": [
          "expressions"
        ]
      },
      {
        "id": "pl-lazy",
        "title": "Lazy scan",
        "language": "python",
        "code": "result = (\n    pl.scan_parquet(\"events/*.parquet\")\n    .filter(pl.col(\"event_date\") >= cutoff)\n    .select([\"user_id\", \"amount\"])\n    .group_by(\"user_id\")\n    .agg(pl.col(\"amount\").sum())\n    .collect()\n)",
        "why": "Lazy scans can push filters and projections down.",
        "remember": "Use scan_* for analytical file pipelines and collect at the boundary.",
        "tags": [
          "lazy",
          "parquet"
        ]
      }
    ],
    "apis": [
      {
        "name": "pl.col",
        "signature": "pl.col(name)",
        "whatFor": "Reference a column expression.",
        "example": "pl.col('amount').sum()"
      },
      {
        "name": "scan_parquet",
        "signature": "pl.scan_parquet(source)",
        "whatFor": "Create a LazyFrame.",
        "example": "pl.scan_parquet('*.parquet')"
      }
    ],
    "practices": [
      {
        "title": "Latest row per user",
        "prompt": "Read large Parquet and keep latest event.",
        "pattern": "lazy scan + ordered unique",
        "reveal": "Scan lazily, filter early, sort by event time, then keep one row per user."
      }
    ]
  },
  {
    "id": "spark",
    "name": "Spark / PySpark",
    "group": "Distributed",
    "tagline": "Partitions, shuffles, joins and DataFrame execution.",
    "basics": [
      {
        "label": "Narrow",
        "value": "select / filter / map"
      },
      {
        "label": "Wide",
        "value": "groupBy / distinct / repartition"
      },
      {
        "label": "Plan",
        "value": "df.explain('formatted')"
      },
      {
        "label": "Rule",
        "value": "Watch shuffle, skew and tiny files"
      }
    ],
    "patterns": [
      {
        "id": "spark-window",
        "title": "Latest row per key",
        "language": "python",
        "code": "w = Window.partitionBy(\"customer_id\").orderBy(F.col(\"updated_at\").desc())\n\nlatest = (\n    df\n    .withColumn(\"_rn\", F.row_number().over(w))\n    .filter(F.col(\"_rn\") == 1)\n    .drop(\"_rn\")\n)",
        "why": "Window functions express ordered per-key logic without collecting.",
        "remember": "row_number is the standard deterministic dedupe shape.",
        "tags": [
          "window",
          "dedupe"
        ]
      },
      {
        "id": "spark-broadcast",
        "title": "Broadcast small dimension",
        "language": "python",
        "code": "result = fact.join(\n    F.broadcast(dim),\n    on=\"country_id\",\n    how=\"left\"\n)",
        "why": "Broadcast can avoid shuffling a large fact relation.",
        "remember": "Broadcast only genuinely small data and confirm the plan.",
        "tags": [
          "join",
          "broadcast"
        ]
      }
    ],
    "apis": [
      {
        "name": "DataFrame.explain",
        "signature": "df.explain(mode='formatted')",
        "whatFor": "Inspect physical planning.",
        "example": "df.explain('formatted')"
      },
      {
        "name": "Window",
        "signature": "Window.partitionBy(...).orderBy(...)",
        "whatFor": "Define analytical windows.",
        "example": "Window.partitionBy('id').orderBy('ts')"
      }
    ],
    "practices": [
      {
        "title": "Skewed aggregation",
        "prompt": "One key owns 40% of rows.",
        "pattern": "diagnose skew + salt if needed",
        "reveal": "Confirm skew first, then consider salting or a different aggregation plan."
      }
    ]
  },
  {
    "id": "airflow",
    "name": "Apache Airflow",
    "group": "Orchestration",
    "tagline": "DAG design, retries, schedules and task boundaries.",
    "basics": [
      {
        "label": "TaskFlow",
        "value": "@dag + @task"
      },
      {
        "label": "Dependency",
        "value": "extract() >> transform()"
      },
      {
        "label": "Interval",
        "value": "Use logical data intervals"
      },
      {
        "label": "XCom",
        "value": "Pass metadata, not large datasets"
      }
    ],
    "patterns": [
      {
        "id": "af-taskflow",
        "title": "TaskFlow DAG",
        "language": "python",
        "code": "@dag(schedule=\"@daily\", catchup=False)\ndef orders_pipeline():\n\n    @task(retries=2)\n    def extract():\n        return {\"path\": \"/data/orders.json\"}\n\n    @task\n    def transform(meta):\n        return run_transform(meta[\"path\"])\n\n    transform(extract())",
        "why": "TaskFlow keeps dependency wiring close to Python.",
        "remember": "Tasks should be meaningful retryable operational boundaries.",
        "tags": [
          "dag",
          "taskflow"
        ]
      }
    ],
    "apis": [
      {
        "name": "@dag",
        "signature": "@dag(schedule=..., catchup=...)",
        "whatFor": "Declare a DAG factory.",
        "example": "@dag(schedule='@daily', catchup=False)"
      },
      {
        "name": "@task",
        "signature": "@task(retries=...)",
        "whatFor": "Declare a Python task.",
        "example": "@task(retries=3)"
      }
    ],
    "practices": [
      {
        "title": "Backfillable daily ingestion",
        "prompt": "Rerun one day safely.",
        "pattern": "data interval + idempotency",
        "reveal": "Parameterize writes by the logical interval and make them idempotent."
      }
    ]
  },
  {
    "id": "dbt",
    "name": "dbt",
    "group": "Transformation",
    "tagline": "SQL models, ref/source, incremental logic and tests.",
    "basics": [
      {
        "label": "Dependency",
        "value": "{{ ref('stg_orders') }}"
      },
      {
        "label": "Source",
        "value": "{{ source('raw','orders') }}"
      },
      {
        "label": "Incremental",
        "value": "{% if is_incremental() %}"
      },
      {
        "label": "Tests",
        "value": "unique + not_null + relationships"
      }
    ],
    "patterns": [
      {
        "id": "dbt-stage",
        "title": "Thin staging model",
        "language": "sql",
        "code": "select\n  cast(order_id as bigint) as order_id,\n  cast(order_ts as timestamp) as order_ts,\n  amount\nfrom {{ source('raw', 'orders') }}",
        "why": "Normalize names and types close to the source.",
        "remember": "Keep staging mechanical; move business meaning downstream.",
        "tags": [
          "staging",
          "source"
        ]
      },
      {
        "id": "dbt-inc",
        "title": "Incremental lookback",
        "language": "sql",
        "code": "{{ config(materialized='incremental', unique_key='order_id') }}\n\nselect *\nfrom {{ ref('stg_orders') }}\n\n{% if is_incremental() %}\nwhere updated_at >= (\n  select max(updated_at) - interval '2 day' from {{ this }}\n)\n{% endif %}",
        "why": "Process changes while tolerating late arrivals.",
        "remember": "Incremental logic must remain correct on a full refresh.",
        "tags": [
          "incremental"
        ]
      }
    ],
    "apis": [
      {
        "name": "ref",
        "signature": "ref('model_name')",
        "whatFor": "Declare model dependency.",
        "example": "from {{ ref('stg_orders') }}"
      },
      {
        "name": "source",
        "signature": "source('source','table')",
        "whatFor": "Reference declared raw sources.",
        "example": "{{ source('raw','events') }}"
      }
    ],
    "practices": [
      {
        "title": "Late-arriving facts",
        "prompt": "Source can revise 48 hours.",
        "pattern": "incremental lookback",
        "reveal": "Use a safety window and merge on a stable unique key."
      }
    ]
  },
  {
    "id": "sql",
    "name": "SQL",
    "group": "SQL",
    "tagline": "Portable joins, windows, CTEs and aggregation.",
    "basics": [
      {
        "label": "CTE",
        "value": "with base as (...) select ... from base"
      },
      {
        "label": "Window",
        "value": "row_number() over (partition by ... order by ...)"
      },
      {
        "label": "Conditional agg",
        "value": "sum(case when ... then amount else 0 end)"
      },
      {
        "label": "Null",
        "value": "coalesce(value, fallback)"
      }
    ],
    "patterns": [
      {
        "id": "sql-latest",
        "title": "Latest row per key",
        "language": "sql",
        "code": "with ranked as (\n  select t.*,\n    row_number() over (\n      partition by customer_id\n      order by updated_at desc\n    ) as rn\n  from customer_status t\n)\nselect * from ranked where rn = 1;",
        "why": "Ranking windows solve deterministic top-N per group.",
        "remember": "Partition defines the group; order defines the winner.",
        "tags": [
          "window",
          "dedupe"
        ]
      },
      {
        "id": "sql-anti",
        "title": "Anti-join",
        "language": "sql",
        "code": "select s.*\nfrom source_rows s\nleft join target_rows t\n  on t.id = s.id\nwhere t.id is null;",
        "why": "Find rows present on one side and absent on the other.",
        "remember": "NOT EXISTS is an equally useful anti-join shape.",
        "tags": [
          "join",
          "set"
        ]
      }
    ],
    "apis": [
      {
        "name": "ROW_NUMBER",
        "signature": "ROW_NUMBER() OVER (...)",
        "whatFor": "Rank rows in a group.",
        "example": "row_number() over (partition by id order by ts desc)"
      },
      {
        "name": "LAG",
        "signature": "LAG(expr) OVER (...)",
        "whatFor": "Read the previous row.",
        "example": "lag(status) over (partition by id order by ts)"
      }
    ],
    "practices": [
      {
        "title": "Consecutive activity",
        "prompt": "Find gaps between user events.",
        "pattern": "LAG + timestamp difference",
        "reveal": "Use LAG(event_ts) partitioned by user and compare timestamps."
      }
    ]
  },
  {
    "id": "duckdb",
    "name": "DuckDB",
    "group": "SQL Engines",
    "tagline": "Embedded OLAP over local files.",
    "basics": [
      {
        "label": "Parquet",
        "value": "select * from read_parquet('*.parquet')"
      },
      {
        "label": "CSV",
        "value": "select * from read_csv_auto('x.csv')"
      },
      {
        "label": "Export",
        "value": "copy (...) to 'out.parquet' (format parquet)"
      },
      {
        "label": "Inspect",
        "value": "describe select ..."
      }
    ],
    "patterns": [
      {
        "id": "duck-files",
        "title": "Query files directly",
        "language": "sql",
        "code": "select\n  customer_id,\n  sum(amount) as revenue\nfrom read_parquet('lake/orders/**/*.parquet', hive_partitioning = true)\nwhere order_date >= date '2026-09-01'\ngroup by customer_id;",
        "why": "Query columnar files without loading them into a server database.",
        "remember": "Push filters and projections into the scan.",
        "tags": [
          "parquet",
          "olap"
        ]
      }
    ],
    "apis": [
      {
        "name": "read_parquet",
        "signature": "read_parquet(path, ...)",
        "whatFor": "Query Parquet as a relation.",
        "example": "select * from read_parquet('*.parquet')"
      },
      {
        "name": "COPY",
        "signature": "COPY (query) TO path (FORMAT PARQUET)",
        "whatFor": "Export query results.",
        "example": "copy (...) to 'x.parquet' (format parquet)"
      }
    ],
    "practices": [
      {
        "title": "Local lake query",
        "prompt": "Aggregate partitioned Parquet without ingestion.",
        "pattern": "read_parquet + early filter",
        "reveal": "Query the glob directly and filter before aggregation."
      }
    ]
  },
  {
    "id": "delta",
    "name": "Delta Lake",
    "group": "Lakehouse",
    "tagline": "Transactional lakehouse merge and history patterns.",
    "basics": [
      {
        "label": "MERGE",
        "value": "merge into target using source on ..."
      },
      {
        "label": "History",
        "value": "describe history table"
      },
      {
        "label": "Time travel",
        "value": "version as of n"
      },
      {
        "label": "Schema",
        "value": "Evolve schemas explicitly"
      }
    ],
    "patterns": [
      {
        "id": "delta-merge",
        "title": "Idempotent upsert",
        "language": "sql",
        "code": "merge into silver.customers as t\nusing updates as s\non t.customer_id = s.customer_id\nwhen matched and s.updated_at > t.updated_at then\n  update set *\nwhen not matched then\n  insert *;",
        "why": "MERGE applies insert/update logic atomically.",
        "remember": "Stable keys and ordering guards matter for CDC.",
        "tags": [
          "merge",
          "cdc"
        ]
      }
    ],
    "apis": [
      {
        "name": "MERGE INTO",
        "signature": "MERGE INTO target USING source ON ...",
        "whatFor": "Atomic upsert/delete logic.",
        "example": "merge into silver.orders ..."
      },
      {
        "name": "DESCRIBE HISTORY",
        "signature": "DESCRIBE HISTORY table",
        "whatFor": "Inspect Delta commits.",
        "example": "describe history silver.orders"
      }
    ],
    "practices": [
      {
        "title": "CDC upsert",
        "prompt": "Ignore older late updates.",
        "pattern": "MERGE + ordering guard",
        "reveal": "Update only when the incoming sequence/timestamp is newer."
      }
    ]
  },
  {
    "id": "bigquery",
    "name": "BigQuery",
    "group": "Cloud SQL",
    "tagline": "Serverless warehouse SQL",
    "basics": [
      {
        "label": "Recall 1",
        "value": "QUALIFY"
      },
      {
        "label": "Recall 2",
        "value": "UNNEST"
      },
      {
        "label": "Recall 3",
        "value": "SAFE_CAST"
      },
      {
        "label": "Recall 4",
        "value": "partition pruning"
      }
    ],
    "patterns": [
      {
        "id": "bigquery-core",
        "title": "BigQuery core pattern",
        "language": "text",
        "code": "QUALIFY, UNNEST, SAFE_CAST, partition pruning",
        "why": "A compact recognition card for BigQuery.",
        "remember": "Use this page as a launch point; AI refreshes can expand it into deeper version-aware patterns.",
        "tags": [
          "core"
        ]
      }
    ],
    "apis": [
      {
        "name": "Core surface",
        "signature": "QUALIFY, UNNEST, SAFE_CAST, partition pruning",
        "whatFor": "High-value syntax and concepts to recall first.",
        "example": "QUALIFY, UNNEST, SAFE_CAST, partition pruning"
      }
    ],
    "practices": [
      {
        "title": "Recognize the right tool",
        "prompt": "Which part of the core surface matches the problem?",
        "pattern": "identify the primitive",
        "reveal": "Start from the smallest relevant primitive, then expand to a full pattern."
      }
    ]
  },
  {
    "id": "snowflake",
    "name": "Snowflake",
    "group": "Cloud SQL",
    "tagline": "Warehouse SQL and semi-structured data",
    "basics": [
      {
        "label": "Recall 1",
        "value": "QUALIFY"
      },
      {
        "label": "Recall 2",
        "value": "VARIANT"
      },
      {
        "label": "Recall 3",
        "value": "FLATTEN"
      },
      {
        "label": "Recall 4",
        "value": "TRY_CAST"
      }
    ],
    "patterns": [
      {
        "id": "snowflake-core",
        "title": "Snowflake core pattern",
        "language": "text",
        "code": "QUALIFY, VARIANT, FLATTEN, TRY_CAST",
        "why": "A compact recognition card for Snowflake.",
        "remember": "Use this page as a launch point; AI refreshes can expand it into deeper version-aware patterns.",
        "tags": [
          "core"
        ]
      }
    ],
    "apis": [
      {
        "name": "Core surface",
        "signature": "QUALIFY, VARIANT, FLATTEN, TRY_CAST",
        "whatFor": "High-value syntax and concepts to recall first.",
        "example": "QUALIFY, VARIANT, FLATTEN, TRY_CAST"
      }
    ],
    "practices": [
      {
        "title": "Recognize the right tool",
        "prompt": "Which part of the core surface matches the problem?",
        "pattern": "identify the primitive",
        "reveal": "Start from the smallest relevant primitive, then expand to a full pattern."
      }
    ]
  },
  {
    "id": "tsql",
    "name": "T-SQL",
    "group": "SQL Dialects",
    "tagline": "SQL Server patterns",
    "basics": [
      {
        "label": "Recall 1",
        "value": "TOP"
      },
      {
        "label": "Recall 2",
        "value": "APPLY"
      },
      {
        "label": "Recall 3",
        "value": "temp tables"
      },
      {
        "label": "Recall 4",
        "value": "TRY_CONVERT"
      }
    ],
    "patterns": [
      {
        "id": "tsql-core",
        "title": "T-SQL core pattern",
        "language": "text",
        "code": "TOP, APPLY, temp tables, TRY_CONVERT",
        "why": "A compact recognition card for T-SQL.",
        "remember": "Use this page as a launch point; AI refreshes can expand it into deeper version-aware patterns.",
        "tags": [
          "core"
        ]
      }
    ],
    "apis": [
      {
        "name": "Core surface",
        "signature": "TOP, APPLY, temp tables, TRY_CONVERT",
        "whatFor": "High-value syntax and concepts to recall first.",
        "example": "TOP, APPLY, temp tables, TRY_CONVERT"
      }
    ],
    "practices": [
      {
        "title": "Recognize the right tool",
        "prompt": "Which part of the core surface matches the problem?",
        "pattern": "identify the primitive",
        "reveal": "Start from the smallest relevant primitive, then expand to a full pattern."
      }
    ]
  },
  {
    "id": "postgres",
    "name": "PostgreSQL",
    "group": "SQL Dialects",
    "tagline": "Postgres patterns",
    "basics": [
      {
        "label": "Recall 1",
        "value": "ON CONFLICT"
      },
      {
        "label": "Recall 2",
        "value": "DISTINCT ON"
      },
      {
        "label": "Recall 3",
        "value": "JSONB"
      },
      {
        "label": "Recall 4",
        "value": "EXPLAIN ANALYZE"
      }
    ],
    "patterns": [
      {
        "id": "postgres-core",
        "title": "PostgreSQL core pattern",
        "language": "text",
        "code": "ON CONFLICT, DISTINCT ON, JSONB, EXPLAIN ANALYZE",
        "why": "A compact recognition card for PostgreSQL.",
        "remember": "Use this page as a launch point; AI refreshes can expand it into deeper version-aware patterns.",
        "tags": [
          "core"
        ]
      }
    ],
    "apis": [
      {
        "name": "Core surface",
        "signature": "ON CONFLICT, DISTINCT ON, JSONB, EXPLAIN ANALYZE",
        "whatFor": "High-value syntax and concepts to recall first.",
        "example": "ON CONFLICT, DISTINCT ON, JSONB, EXPLAIN ANALYZE"
      }
    ],
    "practices": [
      {
        "title": "Recognize the right tool",
        "prompt": "Which part of the core surface matches the problem?",
        "pattern": "identify the primitive",
        "reveal": "Start from the smallest relevant primitive, then expand to a full pattern."
      }
    ]
  },
  {
    "id": "mysql",
    "name": "MySQL",
    "group": "SQL Dialects",
    "tagline": "MySQL patterns",
    "basics": [
      {
        "label": "Recall 1",
        "value": "ON DUPLICATE KEY"
      },
      {
        "label": "Recall 2",
        "value": "JSON_EXTRACT"
      },
      {
        "label": "Recall 3",
        "value": "window functions"
      }
    ],
    "patterns": [
      {
        "id": "mysql-core",
        "title": "MySQL core pattern",
        "language": "text",
        "code": "ON DUPLICATE KEY, JSON_EXTRACT, window functions",
        "why": "A compact recognition card for MySQL.",
        "remember": "Use this page as a launch point; AI refreshes can expand it into deeper version-aware patterns.",
        "tags": [
          "core"
        ]
      }
    ],
    "apis": [
      {
        "name": "Core surface",
        "signature": "ON DUPLICATE KEY, JSON_EXTRACT, window functions",
        "whatFor": "High-value syntax and concepts to recall first.",
        "example": "ON DUPLICATE KEY, JSON_EXTRACT, window functions"
      }
    ],
    "practices": [
      {
        "title": "Recognize the right tool",
        "prompt": "Which part of the core surface matches the problem?",
        "pattern": "identify the primitive",
        "reveal": "Start from the smallest relevant primitive, then expand to a full pattern."
      }
    ]
  },
  {
    "id": "fastapi",
    "name": "FastAPI",
    "group": "API",
    "tagline": "Typed Python API patterns",
    "basics": [
      {
        "label": "Recall 1",
        "value": "Pydantic"
      },
      {
        "label": "Recall 2",
        "value": "Depends"
      },
      {
        "label": "Recall 3",
        "value": "response models"
      },
      {
        "label": "Recall 4",
        "value": "HTTPException"
      }
    ],
    "patterns": [
      {
        "id": "fastapi-core",
        "title": "FastAPI core pattern",
        "language": "text",
        "code": "Pydantic, Depends, response models, HTTPException",
        "why": "A compact recognition card for FastAPI.",
        "remember": "Use this page as a launch point; AI refreshes can expand it into deeper version-aware patterns.",
        "tags": [
          "core"
        ]
      }
    ],
    "apis": [
      {
        "name": "Core surface",
        "signature": "Pydantic, Depends, response models, HTTPException",
        "whatFor": "High-value syntax and concepts to recall first.",
        "example": "Pydantic, Depends, response models, HTTPException"
      }
    ],
    "practices": [
      {
        "title": "Recognize the right tool",
        "prompt": "Which part of the core surface matches the problem?",
        "pattern": "identify the primitive",
        "reveal": "Start from the smallest relevant primitive, then expand to a full pattern."
      }
    ]
  },
  {
    "id": "kubernetes",
    "name": "Kubernetes",
    "group": "Platform",
    "tagline": "Container orchestration patterns",
    "basics": [
      {
        "label": "Recall 1",
        "value": "Deployment"
      },
      {
        "label": "Recall 2",
        "value": "Service"
      },
      {
        "label": "Recall 3",
        "value": "probes"
      },
      {
        "label": "Recall 4",
        "value": "requests and limits"
      }
    ],
    "patterns": [
      {
        "id": "kubernetes-core",
        "title": "Kubernetes core pattern",
        "language": "text",
        "code": "Deployment, Service, probes, requests and limits",
        "why": "A compact recognition card for Kubernetes.",
        "remember": "Use this page as a launch point; AI refreshes can expand it into deeper version-aware patterns.",
        "tags": [
          "core"
        ]
      }
    ],
    "apis": [
      {
        "name": "Core surface",
        "signature": "Deployment, Service, probes, requests and limits",
        "whatFor": "High-value syntax and concepts to recall first.",
        "example": "Deployment, Service, probes, requests and limits"
      }
    ],
    "practices": [
      {
        "title": "Recognize the right tool",
        "prompt": "Which part of the core surface matches the problem?",
        "pattern": "identify the primitive",
        "reveal": "Start from the smallest relevant primitive, then expand to a full pattern."
      }
    ]
  },
  {
    "id": "linux",
    "name": "Linux",
    "group": "Platform",
    "tagline": "Files, processes, services and networking",
    "basics": [
      {
        "label": "Recall 1",
        "value": "find"
      },
      {
        "label": "Recall 2",
        "value": "grep"
      },
      {
        "label": "Recall 3",
        "value": "journalctl"
      },
      {
        "label": "Recall 4",
        "value": "ss"
      },
      {
        "label": "Recall 5",
        "value": "lsof"
      }
    ],
    "patterns": [
      {
        "id": "linux-core",
        "title": "Linux core pattern",
        "language": "text",
        "code": "find, grep, journalctl, ss, lsof",
        "why": "A compact recognition card for Linux.",
        "remember": "Use this page as a launch point; AI refreshes can expand it into deeper version-aware patterns.",
        "tags": [
          "core"
        ]
      }
    ],
    "apis": [
      {
        "name": "Core surface",
        "signature": "find, grep, journalctl, ss, lsof",
        "whatFor": "High-value syntax and concepts to recall first.",
        "example": "find, grep, journalctl, ss, lsof"
      }
    ],
    "practices": [
      {
        "title": "Recognize the right tool",
        "prompt": "Which part of the core surface matches the problem?",
        "pattern": "identify the primitive",
        "reveal": "Start from the smallest relevant primitive, then expand to a full pattern."
      }
    ]
  },
  {
    "id": "powershell",
    "name": "PowerShell",
    "group": "Platform",
    "tagline": "Object-oriented shell automation",
    "basics": [
      {
        "label": "Recall 1",
        "value": "Where-Object"
      },
      {
        "label": "Recall 2",
        "value": "Select-Object"
      },
      {
        "label": "Recall 3",
        "value": "Invoke-RestMethod"
      }
    ],
    "patterns": [
      {
        "id": "powershell-core",
        "title": "PowerShell core pattern",
        "language": "text",
        "code": "Where-Object, Select-Object, Invoke-RestMethod",
        "why": "A compact recognition card for PowerShell.",
        "remember": "Use this page as a launch point; AI refreshes can expand it into deeper version-aware patterns.",
        "tags": [
          "core"
        ]
      }
    ],
    "apis": [
      {
        "name": "Core surface",
        "signature": "Where-Object, Select-Object, Invoke-RestMethod",
        "whatFor": "High-value syntax and concepts to recall first.",
        "example": "Where-Object, Select-Object, Invoke-RestMethod"
      }
    ],
    "practices": [
      {
        "title": "Recognize the right tool",
        "prompt": "Which part of the core surface matches the problem?",
        "pattern": "identify the primitive",
        "reveal": "Start from the smallest relevant primitive, then expand to a full pattern."
      }
    ]
  },
  {
    "id": "dax",
    "name": "DAX",
    "group": "BI",
    "tagline": "Power BI measure patterns",
    "basics": [
      {
        "label": "Recall 1",
        "value": "CALCULATE"
      },
      {
        "label": "Recall 2",
        "value": "filter context"
      },
      {
        "label": "Recall 3",
        "value": "DIVIDE"
      },
      {
        "label": "Recall 4",
        "value": "REMOVEFILTERS"
      }
    ],
    "patterns": [
      {
        "id": "dax-core",
        "title": "DAX core pattern",
        "language": "text",
        "code": "CALCULATE, filter context, DIVIDE, REMOVEFILTERS",
        "why": "A compact recognition card for DAX.",
        "remember": "Use this page as a launch point; AI refreshes can expand it into deeper version-aware patterns.",
        "tags": [
          "core"
        ]
      }
    ],
    "apis": [
      {
        "name": "Core surface",
        "signature": "CALCULATE, filter context, DIVIDE, REMOVEFILTERS",
        "whatFor": "High-value syntax and concepts to recall first.",
        "example": "CALCULATE, filter context, DIVIDE, REMOVEFILTERS"
      }
    ],
    "practices": [
      {
        "title": "Recognize the right tool",
        "prompt": "Which part of the core surface matches the problem?",
        "pattern": "identify the primitive",
        "reveal": "Start from the smallest relevant primitive, then expand to a full pattern."
      }
    ]
  },
  {
    "id": "excel",
    "name": "Excel",
    "group": "BI",
    "tagline": "Modern spreadsheet patterns",
    "basics": [
      {
        "label": "Recall 1",
        "value": "XLOOKUP"
      },
      {
        "label": "Recall 2",
        "value": "FILTER"
      },
      {
        "label": "Recall 3",
        "value": "LET"
      },
      {
        "label": "Recall 4",
        "value": "SUMIFS"
      }
    ],
    "patterns": [
      {
        "id": "excel-core",
        "title": "Excel core pattern",
        "language": "text",
        "code": "XLOOKUP, FILTER, LET, SUMIFS",
        "why": "A compact recognition card for Excel.",
        "remember": "Use this page as a launch point; AI refreshes can expand it into deeper version-aware patterns.",
        "tags": [
          "core"
        ]
      }
    ],
    "apis": [
      {
        "name": "Core surface",
        "signature": "XLOOKUP, FILTER, LET, SUMIFS",
        "whatFor": "High-value syntax and concepts to recall first.",
        "example": "XLOOKUP, FILTER, LET, SUMIFS"
      }
    ],
    "practices": [
      {
        "title": "Recognize the right tool",
        "prompt": "Which part of the core surface matches the problem?",
        "pattern": "identify the primitive",
        "reveal": "Start from the smallest relevant primitive, then expand to a full pattern."
      }
    ]
  },
  {
    "id": "docker",
    "name": "Docker",
    "group": "Platform",
    "tagline": "Containers and Compose",
    "basics": [
      {
        "label": "Recall 1",
        "value": "multi-stage builds"
      },
      {
        "label": "Recall 2",
        "value": "volumes"
      },
      {
        "label": "Recall 3",
        "value": "service DNS"
      },
      {
        "label": "Recall 4",
        "value": "logs"
      }
    ],
    "patterns": [
      {
        "id": "docker-core",
        "title": "Docker core pattern",
        "language": "text",
        "code": "multi-stage builds, volumes, service DNS, logs",
        "why": "A compact recognition card for Docker.",
        "remember": "Use this page as a launch point; AI refreshes can expand it into deeper version-aware patterns.",
        "tags": [
          "core"
        ]
      }
    ],
    "apis": [
      {
        "name": "Core surface",
        "signature": "multi-stage builds, volumes, service DNS, logs",
        "whatFor": "High-value syntax and concepts to recall first.",
        "example": "multi-stage builds, volumes, service DNS, logs"
      }
    ],
    "practices": [
      {
        "title": "Recognize the right tool",
        "prompt": "Which part of the core surface matches the problem?",
        "pattern": "identify the primitive",
        "reveal": "Start from the smallest relevant primitive, then expand to a full pattern."
      }
    ]
  },
  {
    "id": "git",
    "name": "Git",
    "group": "Platform",
    "tagline": "Version-control patterns",
    "basics": [
      {
        "label": "Recall 1",
        "value": "status"
      },
      {
        "label": "Recall 2",
        "value": "diff"
      },
      {
        "label": "Recall 3",
        "value": "branch"
      },
      {
        "label": "Recall 4",
        "value": "rebase"
      },
      {
        "label": "Recall 5",
        "value": "reflog"
      }
    ],
    "patterns": [
      {
        "id": "git-core",
        "title": "Git core pattern",
        "language": "text",
        "code": "status, diff, branch, rebase, reflog",
        "why": "A compact recognition card for Git.",
        "remember": "Use this page as a launch point; AI refreshes can expand it into deeper version-aware patterns.",
        "tags": [
          "core"
        ]
      }
    ],
    "apis": [
      {
        "name": "Core surface",
        "signature": "status, diff, branch, rebase, reflog",
        "whatFor": "High-value syntax and concepts to recall first.",
        "example": "status, diff, branch, rebase, reflog"
      }
    ],
    "practices": [
      {
        "title": "Recognize the right tool",
        "prompt": "Which part of the core surface matches the problem?",
        "pattern": "identify the primitive",
        "reveal": "Start from the smallest relevant primitive, then expand to a full pattern."
      }
    ]
  }
];
export const groups=[...new Set(catalog.map(t=>t.group))].sort();
export const byId=new Map(catalog.map(t=>[t.id,t]));
