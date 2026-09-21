import rawCatalog from "./catalog.json";

export type Mode = "memo" | "patterns" | "apis" | "examples" | "practice" | "updates";
export type Pattern = {
  id:string;
  title:string;
  language:string;
  code:string;
  why:string;
  remember:string;
  tags:string[];
};
export type Technology = {
  id:string;
  name:string;
  group:string;
  tagline:string;
  basics:{label:string;value:string}[];
  patterns:Pattern[];
  apis:{name:string;signature:string;whatFor:string;example:string}[];
  practices:{title:string;prompt:string;pattern:string;reveal:string}[];
};
export type CatalogDocument = {
  schemaVersion:number;
  contentVersion:string;
  reviewedAt:string;
  technologies:Technology[];
};

export const catalogDocument = rawCatalog as CatalogDocument;
export const catalog = catalogDocument.technologies;
export const groups = [...new Set(catalog.map(t=>t.group))].sort();
export const byId = new Map(catalog.map(t=>[t.id,t]));
