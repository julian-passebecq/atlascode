# AtlasCode architecture

## Core interaction

Technology Explorer -> Workspace tab -> active pane -> semantic view.

A workspace can be single-pane or split-pane. In split mode, each pane keeps its own technology and view. This supports comparisons such as Pandas vs Polars, SQL vs PySpark, PostgreSQL vs T-SQL, or Memo vs What's new.

## Semantic views

1. Memo: compact recall sheet.
2. Patterns: reusable code shapes plus explanation and 'remember' rule.
3. APIs: high-value functions/classes/statements.
4. Examples: selected pattern cards in worked-reading form.
5. Practice: identify the pattern; no coding environment.
6. What's new: release-aware AI updates, migrations and deprecations.

## Why no Monaco/code runner

Execution would duplicate Datapass Studio and make this reference product heavier. AtlasCode should stay optimized for scanning, comparison, repetition and memory.

## Next passes

- source/provenance metadata for every version-specific update
- direct search result palette that jumps to a pattern or API
- favorites and spaced-recall queue
- cross-technology 'same pattern in...' links
- AI release refresh pipeline with review diff
- printable/compact cheat-sheet renderer from the same structured records
- import/export personal workspace state