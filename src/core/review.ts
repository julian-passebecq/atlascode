export type ReviewEntry = {
  patternId:string;
  addedAt:string;
  lastReviewed?:string;
};

export type ReviewState = Record<string,ReviewEntry>;

const STORAGE_KEY="atlascode.review";

function isValidTimestamp(value:unknown):value is string {
  return typeof value==="string" && Number.isFinite(Date.parse(value));
}

export function parseReviewState(value:unknown):ReviewState {
  if(!value || typeof value!=="object" || Array.isArray(value)) return {};

  const result:ReviewState={};
  for(const [patternId,rawEntry] of Object.entries(value)){
    if(!patternId.trim() || !rawEntry || typeof rawEntry!=="object" || Array.isArray(rawEntry)) continue;
    const entry=rawEntry as Partial<ReviewEntry>;
    if(!isValidTimestamp(entry.addedAt)) continue;

    result[patternId]={
      patternId,
      addedAt:entry.addedAt,
      ...(isValidTimestamp(entry.lastReviewed)?{lastReviewed:entry.lastReviewed}:{})
    };
  }
  return result;
}

export function loadReviewState(storage:Pick<Storage,"getItem">=localStorage):ReviewState {
  try{
    return parseReviewState(JSON.parse(storage.getItem(STORAGE_KEY)||"{}"));
  }catch{
    return {};
  }
}

export function saveReviewState(
  state:ReviewState,
  storage:Pick<Storage,"setItem">=localStorage
):boolean {
  try{
    storage.setItem(STORAGE_KEY,JSON.stringify(state));
    return true;
  }catch{
    return false;
  }
}

export function toggleReviewPattern(
  state:ReviewState,
  patternId:string,
  now=new Date().toISOString()
):ReviewState {
  if(!patternId.trim()) return state;
  if(state[patternId]){
    const next={...state};
    delete next[patternId];
    return next;
  }
  if(!isValidTimestamp(now)) return state;
  return {...state,[patternId]:{patternId,addedAt:now}};
}

export function markReviewed(
  state:ReviewState,
  patternId:string,
  now=new Date().toISOString()
):ReviewState {
  const entry=state[patternId];
  if(!entry || !isValidTimestamp(now)) return state;
  return {...state,[patternId]:{...entry,lastReviewed:now}};
}

export function reviewAgeDays(entry:ReviewEntry,now=Date.now()){
  if(!entry.lastReviewed) return Number.POSITIVE_INFINITY;
  const reviewedAt=Date.parse(entry.lastReviewed);
  if(!Number.isFinite(reviewedAt) || !Number.isFinite(now)) return Number.POSITIVE_INFINITY;
  return Math.max(0,Math.floor((now-reviewedAt)/86400000));
}
