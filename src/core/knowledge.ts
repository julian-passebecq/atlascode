import { catalog, Mode, Pattern } from "../content/catalog";
import { trackById } from "../content/tracks";
import type { TrackId } from "../content/tracks";
import { updates } from "../content/updates";

export type SearchResult = {
  kind:"technology"|"pattern"|"api"|"update";
  id:string;
  techId:string;
  techName:string;
  title:string;
  subtitle:string;
  mode:Mode;
  score:number;
};

export type RelatedPattern = {
  techId:string;
  techName:string;
  pattern:Pattern;
};

const normalize = (value:string) =>
  value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const includesAll = (text:string, words:string[]) => words.every(word => text.includes(word));

export function knowledgeDomId(kind:"pattern"|"api"|"update",id:string){
  return "knowledge-"+kind+"-"+encodeURIComponent(id);
}

export function searchKnowledge(query:string, limit=12):SearchResult[] {
  const safeLimit=Math.max(0,Math.floor(limit));
  if(!safeLimit) return [];
  const words=normalize(query).trim().split(/\s+/).filter(Boolean);
  if(!words.length) return [];

  const hits:SearchResult[]=[];
  for(const tech of catalog){
    const trackText=tech.tracks.map(trackId=>{const track=trackById.get(trackId);return [trackId,track?.label||"",track?.description||""].join(" ");}).join(" ");
    const techText=normalize([tech.name,tech.group,tech.tagline,trackText].join(" "));
    if(includesAll(techText,words)){
      hits.push({
        kind:"technology",id:tech.id,techId:tech.id,techName:tech.name,
        title:tech.name,subtitle:tech.tagline,mode:"memo",
        score:100 + (words.some(w=>normalize(tech.name).startsWith(w))?25:0)
      });
    }

    for(const pattern of tech.patterns){
      const text=normalize([
        pattern.title,pattern.why,pattern.remember,pattern.code,
        pattern.tags.join(" "),pattern.concept||"",tech.name
      ].join(" "));
      if(!includesAll(text,words)) continue;
      const title=normalize(pattern.title);
      const tags=normalize(pattern.tags.join(" "));
      hits.push({
        kind:"pattern",id:pattern.id,techId:tech.id,techName:tech.name,
        title:pattern.title,subtitle:pattern.remember,mode:"patterns",
        score:70 + words.reduce((sum,w)=>sum+(title.includes(w)?20:0)+(tags.includes(w)?8:0),0)
      });
    }

    for(const api of tech.apis){
      const text=normalize([api.name,api.signature,api.whatFor,api.example,tech.name].join(" "));
      if(!includesAll(text,words)) continue;
      const name=normalize(api.name);
      hits.push({
        kind:"api",id:tech.id+":"+api.name,techId:tech.id,techName:tech.name,
        title:api.name,subtitle:api.whatFor,mode:"apis",
        score:55 + words.reduce((sum,w)=>sum+(name.includes(w)?20:0),0)
      });
    }

    for(const update of updates.filter(entry=>entry.techId===tech.id)){
      const text=normalize([
        update.version,"v"+update.version,update.title,update.summary,update.impact,
        update.kind,update.publishedAt,update.sourceLabel,tech.name
      ].join(" "));
      if(!includesAll(text,words)) continue;
      const version=normalize(update.version);
      const title=normalize(update.title);
      hits.push({
        kind:"update",id:update.id,techId:tech.id,techName:tech.name,
        title:update.title,subtitle:"v"+update.version+" · "+update.publishedAt,mode:"updates",
        score:60 + words.reduce((sum,w)=>sum+(version===w?35:0)+(title.includes(w)?12:0),0)
      });
    }
  }

  return hits.sort((a,b)=>b.score-a.score || a.title.localeCompare(b.title)).slice(0,safeLimit);
}

export function technologyIdsForTrack(track:TrackId|"all"):Set<string> {
  return new Set(
    catalog
      .filter(tech=>track==="all"||tech.tracks.includes(track))
      .map(tech=>tech.id)
  );
}

export function matchingTechnologyIds(query:string):Set<string> {
  if(!query.trim()) return new Set(catalog.map(tech=>tech.id));
  return new Set(searchKnowledge(query,Math.max(100,catalog.length*50)).map(result=>result.techId));
}

export function conceptTitle(concept:string){
  return concept
    .split("-")
    .filter(Boolean)
    .map(part=>part.charAt(0).toUpperCase()+part.slice(1))
    .join(" ");
}

export type PatternFamily = {
  concept:string;
  title:string;
  count:number;
};

export function patternFamilies(allowedTechIds?:ReadonlySet<string>):PatternFamily[] {
  const counts=new Map<string,number>();
  for(const tech of catalog){
    if(allowedTechIds&&!allowedTechIds.has(tech.id)) continue;
    for(const pattern of tech.patterns){
      if(!pattern.concept) continue;
      counts.set(pattern.concept,(counts.get(pattern.concept)||0)+1);
    }
  }

  return [...counts.entries()]
    .filter(([,count])=>count>=2)
    .map(([concept,count])=>({concept,title:conceptTitle(concept),count}))
    .sort((a,b)=>b.count-a.count || a.title.localeCompare(b.title));
}

export function patternsForConcept(concept:string):RelatedPattern[] {
  if(!concept.trim()) return [];
  return catalog.flatMap(tech =>
    tech.patterns
      .filter(pattern=>pattern.concept===concept)
      .map(pattern=>({techId:tech.id,techName:tech.name,pattern}))
  ).sort((a,b)=>a.techName.localeCompare(b.techName));
}

export function relatedPatterns(pattern:Pattern):RelatedPattern[] {
  if(!pattern.concept) return [];
  return patternsForConcept(pattern.concept)
    .filter(item=>item.pattern.id!==pattern.id);
}

export function findPattern(patternId:string){
  for(const tech of catalog){
    const pattern=tech.patterns.find(item=>item.id===patternId);
    if(pattern) return {tech,pattern};
  }
  return undefined;
}
