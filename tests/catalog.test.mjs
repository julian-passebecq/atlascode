import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const catalog = JSON.parse(
  await readFile(new URL("../src/content/catalog.json", import.meta.url), "utf8")
);

const requiredTechnologies = [
  "airflow","spark","pyspark","dbt","python","pandas","polars","duckdb","delta",
  "sql","bigquery","snowflake","tsql","mysql","postgres","fastapi","kubernetes",
  "linux","powershell","dax","excel","docker","git"
];

test("catalog metadata is versioned", () => {
  assert.equal(catalog.schemaVersion, 2);
  assert.match(catalog.contentVersion, /^\d+\.\d+\.\d+$/);
  assert.match(catalog.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
});

test("all requested core technologies are represented", () => {
  const ids = new Set(catalog.technologies.map(t => t.id));
  for (const id of requiredTechnologies) {
    assert.ok(ids.has(id), "missing technology: " + id);
  }
});

test("technology ids and pattern ids are unique", () => {
  const techIds = new Set();
  const patternIds = new Set();
  for (const tech of catalog.technologies) {
    assert.ok(!techIds.has(tech.id), "duplicate technology id: " + tech.id);
    techIds.add(tech.id);
    for (const pattern of tech.patterns) {
      assert.ok(!patternIds.has(pattern.id), "duplicate pattern id: " + pattern.id);
      patternIds.add(pattern.id);
    }
  }
});

test("every technology has usable learning surfaces", () => {
  for (const tech of catalog.technologies) {
    assert.ok(tech.name?.trim(), tech.id + " missing name");
    assert.ok(tech.group?.trim(), tech.id + " missing group");
    assert.ok(tech.tagline?.trim(), tech.id + " missing tagline");
    assert.ok(tech.basics.length >= 4, tech.id + " needs at least 4 memo items");
    assert.ok(tech.patterns.length >= 1, tech.id + " needs at least one pattern");
    assert.ok(tech.apis.length >= 1, tech.id + " needs at least one API card");
    assert.ok(tech.practices.length >= 1, tech.id + " needs at least one practice card");

    for (const item of tech.basics) {
      assert.ok(item.label?.trim() && item.value?.trim(), tech.id + " has incomplete memo item");
    }
    for (const pattern of tech.patterns) {
      assert.ok(pattern.title?.trim(), pattern.id + " missing title");
      assert.ok(pattern.code?.trim(), pattern.id + " missing code");
      assert.ok(pattern.why?.trim(), pattern.id + " missing explanation");
      assert.ok(pattern.remember?.trim(), pattern.id + " missing remember rule");
      assert.ok(Array.isArray(pattern.tags) && pattern.tags.length > 0, pattern.id + " needs tags");
    }
    for (const api of tech.apis) {
      assert.ok(api.name?.trim() && api.signature?.trim(), tech.id + " has incomplete API card");
      assert.ok(api.whatFor?.trim() && api.example?.trim(), tech.id + " API card lacks pedagogy");
    }
    for (const practice of tech.practices) {
      assert.ok(practice.title?.trim() && practice.prompt?.trim(), tech.id + " has incomplete practice");
      assert.ok(practice.pattern?.trim() && practice.reveal?.trim(), tech.id + " practice lacks reveal");
    }
  }
});


test("cross-technology concepts are comparable", () => {
  const byConcept = new Map();
  for (const tech of catalog.technologies) {
    for (const pattern of tech.patterns) {
      if (!pattern.concept) continue;
      const refs = byConcept.get(pattern.concept) || [];
      refs.push({ techId: tech.id, patternId: pattern.id });
      byConcept.set(pattern.concept, refs);
    }
  }

  assert.ok(byConcept.has("latest-row"), "latest-row concept is required");
  const latest = byConcept.get("latest-row");
  assert.ok(new Set(latest.map(item => item.techId)).size >= 6, "latest-row should span at least 6 technologies");

  for (const [concept, refs] of byConcept) {
    assert.ok(refs.length >= 2, "concept needs at least two comparable patterns: " + concept);
  }
});
