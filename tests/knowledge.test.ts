import { describe, expect, it } from "vitest";
import { byId } from "../src/content/catalog";
import {
  findPattern,
  conceptTitle,
  knowledgeDomId,
  matchingTechnologyIds,
  patternFamilies,
  patternsForConcept,
  relatedPatterns,
  searchKnowledge,
  technologyIdsForTrack
} from "../src/core/knowledge";

describe("searchKnowledge", () => {
  it("returns no results for empty queries or non-positive limits", () => {
    expect(searchKnowledge("   ")).toEqual([]);
    expect(searchKnowledge("sql", 0)).toEqual([]);
    expect(searchKnowledge("sql", -5)).toEqual([]);
  });

  it("finds direct pattern matches across technologies", () => {
    const results=searchKnowledge("latest row", 20);
    const patterns=results.filter(result=>result.kind==="pattern");
    expect(patterns.length).toBeGreaterThanOrEqual(6);
    expect(patterns.some(result=>result.techId==="bigquery")).toBe(true);
    expect(patterns.some(result=>result.techId==="postgres")).toBe(true);
    expect(patterns.every(result=>result.mode==="patterns")).toBe(true);
  });

  it("finds APIs by signature content and respects the result limit", () => {
    const results=searchKnowledge("XLOOKUP", 2);
    expect(results.length).toBeLessThanOrEqual(2);
    expect(results.some(result=>result.techId==="excel" && result.kind==="api")).toBe(true);
  });

  it("finds version updates and routes them to What's New", () => {
    const airflow=searchKnowledge("3.3.2", 10);
    expect(airflow.some(result =>
      result.kind==="update" &&
      result.techId==="airflow" &&
      result.mode==="updates"
    )).toBe(true);

    const docker=searchKnowledge("29.8.1", 10);
    expect(docker.some(result=>result.kind==="update" && result.techId==="docker")).toBe(true);

    const prefixed=searchKnowledge("v3.3.2", 10);
    expect(prefixed.some(result=>result.kind==="update" && result.techId==="airflow")).toBe(true);

    const sourceLabel=searchKnowledge("Apache Spark news", 10);
    expect(sourceLabel.some(result=>result.kind==="update" && result.techId==="spark")).toBe(true);
  });

  it("ranks exact technology matches strongly", () => {
    const [first]=searchKnowledge("pandas", 5);
    expect(first?.kind).toBe("technology");
    expect(first?.techId).toBe("pandas");
  });
});

describe("learning tracks", () => {
  it("organizes technologies into the intended study paths", () => {
    const analyst=technologyIdsForTrack("data-analyst");
    expect(analyst.has("python")).toBe(true);
    expect(analyst.has("pandas")).toBe(true);
    expect(analyst.has("sql")).toBe(true);

    const engineering=technologyIdsForTrack("data-engineering");
    for(const id of ["airflow","polars","pyspark","fabric","databricks"]){
      expect(engineering.has(id)).toBe(true);
    }

    const bi=technologyIdsForTrack("bi-warehousing");
    for(const id of ["dbt","dax","snowflake","fabric"]){
      expect(bi.has(id)).toBe(true);
    }

    const cloud=technologyIdsForTrack("cloud-lakehouse");
    for(const id of ["fabric","databricks","spark","delta"]){
      expect(cloud.has(id)).toBe(true);
    }

    const devops=technologyIdsForTrack("devops");
    for(const id of ["kubernetes","docker","git","bash","linux","powershell"]){
      expect(devops.has(id)).toBe(true);
    }
    expect(devops.has("pandas")).toBe(false);
  });

  it("makes track names searchable as technology metadata", () => {
    const devops=matchingTechnologyIds("devops");
    expect(devops.has("bash")).toBe(true);
    expect(devops.has("kubernetes")).toBe(true);

    const cloud=matchingTechnologyIds("cloud lakehouse");
    expect(cloud.has("fabric")).toBe(true);
    expect(cloud.has("databricks")).toBe(true);
  });

  it("scopes pattern-family counts to the active track", () => {
    const devopsFamilies=patternFamilies(technologyIdsForTrack("devops"));
    expect(devopsFamilies.some(family=>family.concept==="pipeline-filter" && family.count>=2)).toBe(true);
    expect(devopsFamilies.some(family=>family.concept==="script-failure-boundary" && family.count>=2)).toBe(true);
    expect(devopsFamilies.some(family=>family.concept==="latest-row")).toBe(false);
  });
});

describe("matchingTechnologyIds", () => {
  it("keeps explorer filtering consistent with API and code-term search", () => {
    expect(matchingTechnologyIds("XLOOKUP").has("excel")).toBe(true);
    expect(matchingTechnologyIds("F.broadcast").has("spark")).toBe(true);
    expect(matchingTechnologyIds("3.3.2").has("airflow")).toBe(true);
    expect(matchingTechnologyIds("definitely-no-match").size).toBe(0);
  });

  it("returns every technology for an empty query", () => {
    const ids=matchingTechnologyIds("");
    expect(ids.has("python")).toBe(true);
    expect(ids.has("excel")).toBe(true);
    expect(ids.size).toBeGreaterThanOrEqual(20);
  });
});

describe("pattern families", () => {
  it("indexes discoverable families by coverage", () => {
    const families=patternFamilies();
    expect(families[0]?.concept).toBe("latest-row");
    expect(families.every(family=>family.count>=2)).toBe(true);
    expect(families.some(family=>family.concept==="anti-join" && family.count>=5)).toBe(true);
  });

  it("returns complete comparison families with readable titles", () => {
    const anti=patternsForConcept("anti-join");
    const aggregate=patternsForConcept("grouped-aggregation");
    const upsert=patternsForConcept("upsert-by-key");

    expect(anti.length).toBeGreaterThanOrEqual(5);
    expect(new Set(anti.map(item=>item.techId))).toEqual(
      new Set(["duckdb","pandas","polars","pyspark","sql"])
    );
    expect(aggregate.length).toBeGreaterThanOrEqual(5);
    expect(upsert.length).toBeGreaterThanOrEqual(4);
    expect(conceptTitle("upsert-by-key")).toBe("Upsert By Key");
    expect(patternsForConcept("missing-concept")).toEqual([]);
  });
});

describe("relatedPatterns", () => {
  it("returns only equivalent implementations and excludes the source pattern", () => {
    const sql=byId.get("sql")!;
    const source=sql.patterns.find(pattern=>pattern.concept==="latest-row")!;
    const related=relatedPatterns(source);

    expect(related.length).toBeGreaterThanOrEqual(6);
    expect(related.every(item=>item.pattern.id!==source.id)).toBe(true);
    expect(related.every(item=>item.pattern.concept==="latest-row")).toBe(true);
    expect(related.some(item=>item.techId==="pyspark")).toBe(true);
    expect(related.some(item=>item.techId==="snowflake")).toBe(true);
  });

  it("returns nothing for patterns without a shared concept", () => {
    const python=byId.get("python")!;
    const pattern=python.patterns.find(item=>!item.concept)!;
    expect(relatedPatterns(pattern)).toEqual([]);
  });
});

describe("knowledge helpers", () => {
  it("finds known patterns and returns undefined for unknown IDs", () => {
    expect(findPattern("sql-latest")?.tech.id).toBe("sql");
    expect(findPattern("missing-pattern")).toBeUndefined();
  });

  it("creates stable DOM-safe anchor IDs", () => {
    expect(knowledgeDomId("api","excel:XLOOKUP value")).toBe(
      "knowledge-api-excel%3AXLOOKUP%20value"
    );
    expect(knowledgeDomId("update","airflow:3.3.2")).toBe(
      "knowledge-update-airflow%3A3.3.2"
    );
  });
});
