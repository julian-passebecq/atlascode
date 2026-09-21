import { Badge, Button, Text } from "@fluentui/react-components";
import { SearchResult, searchKnowledge } from "../core/knowledge";

export function KnowledgeSearch({
  query,
  onOpen
}:{
  query:string;
  onOpen:(result:SearchResult)=>void;
}){
  const results=searchKnowledge(query);
  if(!query.trim()) return null;

  return <div className="searchResults" role="region" aria-label="Knowledge search results">
    <div className="searchSummary" aria-live="polite">
      <Text size={200}>{results.length?results.length+" matches shown":"No direct matches"}</Text>
    </div>
    {results.map(result=>
      <Button
        key={result.kind+":"+result.id}
        appearance="subtle"
        className="searchResult"
        onClick={()=>onOpen(result)}
      >
        <span className="searchKind"><Badge appearance="outline">{result.kind}</Badge></span>
        <span className="searchResultText">
          <strong>{result.title}</strong>
          <small>{result.techName} · {result.subtitle}</small>
        </span>
      </Button>
    )}
    {!results.length&&<div className="searchEmpty">Try a technology, API, concept, tag or code term.</div>}
  </div>;
}
