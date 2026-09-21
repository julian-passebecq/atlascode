import { describe, expect, it } from "vitest";
import { byId } from "../src/content/catalog";
import { updates, updatesDocument } from "../src/content/updates";
import {
  latestVersionFor,
  loadUpdateVisits,
  newUpdatesSince,
  parseUpdateVisits,
  recordGlobalUpdateVisit,
  recordUpdateVisit,
  saveUpdateVisits,
  updateScopeKey,
  updatesForTechnology
} from "../src/core/updates";

describe("update feed integrity", () => {
  it("uses unique IDs, valid technologies and official HTTPS sources", () => {
    const ids=new Set<string>();
    const allowedKinds=new Set(["release","feature","fix","breaking","deprecation","security"]);
    const allowedHosts=new Set([
      "airflow.apache.org",
      "kubernetes.io",
      "docs.docker.com",
      "spark.apache.org",
      "fastapi.tiangolo.com"
    ]);

    for(const entry of updates){
      expect(ids.has(entry.id)).toBe(false);
      ids.add(entry.id);

      const tech=byId.get(entry.techId);
      expect(tech).toBeDefined();
      expect(entry.version.trim()).not.toBe("");
      expect(entry.title.trim()).not.toBe("");
      expect(entry.summary.trim()).not.toBe("");
      expect(entry.impact.trim()).not.toBe("");
      expect(entry.sourceLabel.trim()).not.toBe("");
      expect(allowedKinds.has(entry.kind)).toBe(true);
      expect(entry.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.publishedAt<=updatesDocument.reviewedAt).toBe(true);
      expect(Number.isFinite(Date.parse(entry.curatedAt))).toBe(true);
      expect(entry.curatedAt.slice(0,10)<=updatesDocument.reviewedAt).toBe(true);

      const url=new URL(entry.sourceUrl);
      expect(url.protocol).toBe("https:");
      expect(allowedHosts.has(url.hostname)).toBe(true);

      for(const patternId of entry.affectedPatternIds){
        expect(tech!.patterns.some(pattern=>pattern.id===patternId)).toBe(true);
      }
    }
  });

  it("covers multiple fast-moving technologies", () => {
    expect(new Set(updates.map(entry=>entry.techId)).size).toBeGreaterThanOrEqual(5);
    expect(updates.length).toBeGreaterThanOrEqual(7);
  });
});

describe("update selection", () => {
  it("sorts technology and global feeds newest first", () => {
    const docker=updatesForTechnology("docker");
    expect(docker[0]?.version).toBe("29.8.1");
    expect(docker[1]?.version).toBe("29.8.0");

    const global=updatesForTechnology();
    for(let i=1;i<global.length;i++){
      expect(global[i-1].publishedAt>=global[i].publishedAt).toBe(true);
    }
  });

  it("exposes the latest tracked version for a technology", () => {
    expect(latestVersionFor("airflow")).toBe("3.3.2");
    expect(latestVersionFor("docker")).toBe("29.8.1");
    expect(latestVersionFor("python")).toBeUndefined();
  });

  it("bases newness on AtlasCode curation time, not vendor publication date", () => {
    const entries=updatesForTechnology();
    expect(newUpdatesSince(entries)).toHaveLength(entries.length);

    const beforeCuration=newUpdatesSince(entries,"2026-09-21T18:00:00.000Z");
    expect(beforeCuration).toHaveLength(entries.length);
    expect(beforeCuration.some(entry=>entry.id==="docker-engine-29.8.0-2026-09-03")).toBe(true);

    const afterCuration=newUpdatesSince(entries,"2026-09-21T19:00:00.000Z");
    expect(afterCuration).toEqual([]);
  });
});

describe("update visit persistence", () => {
  it("parses only valid timestamp entries", () => {
    expect(parseUpdateVisits({
      airflow:"2026-09-21T10:00:00.000Z",
      bad:"not-a-date",
      empty:""
    })).toEqual({airflow:"2026-09-21T10:00:00.000Z"});
  });

  it("records a technology visit without mutating the original", () => {
    const state={docker:"2026-09-10T10:00:00.000Z"};
    const next=recordUpdateVisit(state,"airflow","2026-09-21T10:00:00.000Z");

    expect(next.airflow).toBe("2026-09-21T10:00:00.000Z");
    expect(state).toEqual({docker:"2026-09-10T10:00:00.000Z"});
    expect(updateScopeKey("airflow")).toBe("airflow");
  });

  it("global visit marks the global scope and every tracked technology", () => {
    const next=recordGlobalUpdateVisit({},"2026-09-21T10:00:00.000Z");
    expect(next[updateScopeKey()]).toBe("2026-09-21T10:00:00.000Z");
    for(const techId of new Set(updates.map(entry=>entry.techId))){
      expect(next[techId]).toBe("2026-09-21T10:00:00.000Z");
    }
  });

  it("recovers from bad storage and contains write failures", () => {
    expect(loadUpdateVisits({getItem:()=>"{bad"})).toEqual({});
    expect(loadUpdateVisits({getItem:()=>{throw new Error("blocked");}})).toEqual({});
    expect(saveUpdateVisits({}, {setItem:()=>{throw new Error("quota");}})).toBe(false);
  });
});
