export type ReviewEntry = {
  patternId:string;
  addedAt:string;
  lastReviewed?:string;
};

export type ReviewState = Record<string,ReviewEntry>;

const STORAGE_KEY="atlascode.review";

export function loadReviewState():ReviewState {
  try{
    const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");
    if(!parsed || typeof parsed!=="object" || Array.isArray(parsed)) return {};
    const result:ReviewState={};
    for(const [patternId,value] of Object.entries(parsed)){
      const entry=value as Partial<ReviewEntry>;
      if(typeof patternId!=="string" || typeof entry.addedAt!=="string") continue;
      result[patternId]={
        patternId,
        addedAt:entry.addedAt,
        ...(typeof entry.lastReviewed==="string"?{lastReviewed:entry.lastReviewed}:{})
      };
    }
    return result;
  }catch{
    return {};
  }
}

export function saveReviewState(state:ReviewState){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
}

export function toggleReviewPattern(state:ReviewState,patternId:string,now=new Date().toISOString()):ReviewState {
  if(state[patternId]){
    const next={...state};
    delete next[patternId];
    return next;
  }
  return {...state,[patternId]:{patternId,addedAt:now}};
}

export function markReviewed(state:ReviewState,patternId:string,now=new Date().toISOString()):ReviewState {
  const entry=state[patternId];
  if(!entry) return state;
  return {...state,[patternId]:{...entry,lastReviewed:now}};
}

export function reviewAgeDays(entry:ReviewEntry,now=Date.now()){
  if(!entry.lastReviewed) return Number.POSITIVE_INFINITY;
  return Math.max(0,Math.floor((now-Date.parse(entry.lastReviewed))/86400000));
}
