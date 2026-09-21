import rawUpdates from "./updates.json";

export type UpdateKind = "release"|"feature"|"fix"|"breaking"|"deprecation"|"security";
export type TechnologyUpdate = {
  id:string;
  techId:string;
  version:string;
  publishedAt:string;
  curatedAt:string;
  kind:UpdateKind;
  title:string;
  summary:string;
  impact:string;
  sourceLabel:string;
  sourceUrl:string;
  affectedPatternIds:string[];
};
export type UpdatesDocument = {
  schemaVersion:1;
  reviewedAt:string;
  entries:TechnologyUpdate[];
};

export const updatesDocument=rawUpdates as UpdatesDocument;
export const updates=updatesDocument.entries;
