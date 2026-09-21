import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const catalog = JSON.parse(
  await readFile(new URL("../src/content/catalog.json", import.meta.url), "utf8")
);

const requiredTechnologies = [
  "airflow","spark","pyspark","dbt","python","pandas","polars","duckdb","delta",
  "sql","bigquery","snowflake","tsql","mysql","postgres","fastapi","kubernetes",
  "linux","powershell","dax","excel","docker","git","bash","fabric","databricks"
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


test("learning tracks are valid and cover the intended study paths", () => {
  const validTracks = new Set([
    "data-analyst",
    "data-engineering",
    "bi-warehousing",
    "cloud-lakehouse",
    "devops"
  ]);

  const byId = new Map(catalog.technologies.map(tech => [tech.id, tech]));
  const coverage = new Map([...validTracks].map(track => [track, 0]));

  for (const tech of catalog.technologies) {
    assert.ok(Array.isArray(tech.tracks) && tech.tracks.length > 0, tech.id + " needs at least one learning track");
    assert.equal(new Set(tech.tracks).size, tech.tracks.length, tech.id + " has duplicate learning tracks");

    for (const track of tech.tracks) {
      assert.ok(validTracks.has(track), tech.id + " has invalid track: " + track);
      coverage.set(track, coverage.get(track) + 1);
    }
  }

  for (const [track, count] of coverage) {
    assert.ok(count >= 4, track + " needs useful technology coverage");
  }

  assert.ok(byId.get("pandas").tracks.includes("data-analyst"));
  assert.ok(byId.get("airflow").tracks.includes("data-engineering"));
  assert.ok(byId.get("dbt").tracks.includes("bi-warehousing"));
  assert.ok(byId.get("fabric").tracks.includes("cloud-lakehouse"));
  assert.ok(byId.get("databricks").tracks.includes("cloud-lakehouse"));
  assert.ok(byId.get("bash").tracks.includes("devops"));
  assert.ok(byId.get("kubernetes").tracks.includes("devops"));

  const expectedDefaults = {
    "data-analyst": "python",
    "data-engineering": "airflow",
    "bi-warehousing": "dbt",
    "cloud-lakehouse": "fabric",
    "devops": "kubernetes"
  };

  for (const [track, defaultTechId] of Object.entries(expectedDefaults)) {
    const tech = byId.get(defaultTechId);
    assert.ok(tech, track + " default technology is missing: " + defaultTechId);
    assert.ok(tech.tracks.includes(track), defaultTechId + " must belong to " + track);
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
    assert.ok(tech.patterns.length >= 4, tech.id + " needs at least 4 patterns");
    assert.ok(tech.apis.length >= 3, tech.id + " needs at least 3 API cards");
    assert.ok(tech.practices.length >= 2, tech.id + " needs at least 2 practice cards");

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


test("learning surfaces do not contain duplicate cards within a technology", () => {
  for (const tech of catalog.technologies) {
    const surfaces = [
      ["memo labels", tech.basics.map(item => item.label)],
      ["pattern titles", tech.patterns.map(pattern => pattern.title)],
      ["API names", tech.apis.map(api => api.name)],
      ["practice titles", tech.practices.map(practice => practice.title)]
    ];

    for (const [surface, values] of surfaces) {
      assert.equal(
        new Set(values).size,
        values.length,
        tech.id + " has duplicate " + surface
      );
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

  const minimumFamilySizes = {
    "anti-join": 5,
    "grouped-aggregation": 5,
    "upsert-by-key": 4,
    "medallion-layers": 2,
    "script-failure-boundary": 2,
    "pipeline-filter": 2,
    "container-health": 2,
    "process-inspection": 2
  };
  for (const [concept, minimum] of Object.entries(minimumFamilySizes)) {
    const refs = byConcept.get(concept) || [];
    assert.ok(
      new Set(refs.map(item => item.techId)).size >= minimum,
      concept + " should span at least " + minimum + " technologies"
    );
  }

  for (const [concept, refs] of byConcept) {
    assert.ok(new Set(refs.map(item => item.techId)).size >= 2, "concept needs at least two technologies: " + concept);
  }
});


test("placeholder learning content does not regress", () => {
  for (const tech of catalog.technologies) {
    assert.ok(
      tech.patterns.every(pattern => !pattern.id.endsWith("-core")),
      tech.id + " still contains placeholder core pattern content"
    );
    assert.ok(
      tech.apis.every(api => api.name !== "Core surface"),
      tech.id + " still contains placeholder API content"
    );
    assert.ok(
      tech.practices.every(practice => practice.title !== "Recognize the right tool"),
      tech.id + " still contains placeholder practice content"
    );
  }
});
