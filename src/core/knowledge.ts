import { catalog, Mode, Pattern } from "../content/catalog";

export type SearchResult = {
  kind:"technology"|"pattern"|"api";
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

export function searchKnowledge(query:string, limit=12):SearchResult[] {
  const words=normalize(query).trim().split(/\s+/).filter(Boolean);
  if(!words.length) return [];

  const hits:SearchResult[]=[];
  for(const tech of catalog){
    const techText=normalize([tech.name,tech.group,tech.tagline].join(" "));
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
  }

  return hits.sort((a,b)=>b.score-a.score || a.title.localeCompare(b.title)).slice(0,limit);
}

export function relatedPatterns(pattern:Pattern):RelatedPattern[] {
  if(!pattern.concept) return [];
  return catalog.flatMap(tech =>
    tech.patterns
      .filter(candidate=>candidate.id!==pattern.id && candidate.concept===pattern.concept)
      .map(candidate=>({techId:tech.id,techName:tech.name,pattern:candidate}))
  ).sort((a,b)=>a.techName.localeCompare(b.techName));
}

export function findPattern(patternId:string){
  for(const tech of catalog){
    const pattern=tech.patterns.find(item=>item.id===patternId);
    if(pattern) return {tech,pattern};
  }
  return undefined;
}
