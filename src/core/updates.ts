import { updates, TechnologyUpdate } from "../content/updates";

const STORAGE_KEY="atlascode.updateVisits";
const GLOBAL_SCOPE="__all__";

export type UpdateVisitState=Record<string,string>;

function validIsoTimestamp(value:unknown):value is string{
  return typeof value==="string" && Number.isFinite(Date.parse(value));
}

export function parseUpdateVisits(value:unknown):UpdateVisitState{
  if(!value||typeof value!=="object"||Array.isArray(value)) return {};
  const result:UpdateVisitState={};
  for(const [scope,timestamp] of Object.entries(value)){
    if(!scope.trim()||!validIsoTimestamp(timestamp)) continue;
    result[scope]=timestamp;
  }
  return result;
}

export function loadUpdateVisits(storage:Pick<Storage,"getItem">=localStorage):UpdateVisitState{
  try{
    return parseUpdateVisits(JSON.parse(storage.getItem(STORAGE_KEY)||"{}"));
  }catch{
    return {};
  }
}

export function saveUpdateVisits(
  state:UpdateVisitState,
  storage:Pick<Storage,"setItem">=localStorage
):boolean{
  try{
    storage.setItem(STORAGE_KEY,JSON.stringify(state));
    return true;
  }catch{
    return false;
  }
}

export function updateScopeKey(techId?:string){
  return techId?.trim()||GLOBAL_SCOPE;
}

export function recordUpdateVisit(
  state:UpdateVisitState,
  techId:string|undefined,
  now=new Date().toISOString()
):UpdateVisitState{
  if(!validIsoTimestamp(now)) return state;
  return {...state,[updateScopeKey(techId)]:now};
}

export function recordGlobalUpdateVisit(
  state:UpdateVisitState,
  now=new Date().toISOString()
):UpdateVisitState{
  if(!validIsoTimestamp(now)) return state;
  const next={...state,[GLOBAL_SCOPE]:now};
  for(const techId of new Set(updates.map(entry=>entry.techId))){
    next[techId]=now;
  }
  return next;
}

export function updatesForTechnology(techId?:string):TechnologyUpdate[]{
  return updates
    .filter(entry=>!techId||entry.techId===techId)
    .slice()
    .sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)||b.version.localeCompare(a.version));
}

export function newUpdatesSince(
  entries:TechnologyUpdate[],
  lastVisit?:string
):TechnologyUpdate[]{
  if(!validIsoTimestamp(lastVisit)) return entries.slice();
  const visitedDate=new Date(lastVisit).toISOString().slice(0,10);
  return entries.filter(entry=>entry.publishedAt>visitedDate);
}

export function latestVersionFor(techId:string){
  return updatesForTechnology(techId)[0]?.version;
}
