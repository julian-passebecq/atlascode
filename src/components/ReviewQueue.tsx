import { Badge, Button, Card, Text, Title2 } from "@fluentui/react-components";
import { Star24Filled } from "@fluentui/react-icons";
import { findPattern } from "../core/knowledge";
import { ReviewState, reviewAgeDays } from "../core/review";

export function ReviewQueue({
  state,
  onOpen,
  onReviewed,
  onRemove
}:{
  state:ReviewState;
  onOpen:(techId:string,patternId:string)=>void;
  onReviewed:(patternId:string)=>void;
  onRemove:(patternId:string)=>void;
}){
  const entries=Object.values(state)
    .map(entry=>({entry,found:findPattern(entry.patternId)}))
    .filter(item=>!!item.found)
    .sort((a,b)=>{
      const ageA=reviewAgeDays(a.entry);
      const ageB=reviewAgeDays(b.entry);
      if(ageA!==ageB) return ageB-ageA;
      return a.entry.addedAt.localeCompare(b.entry.addedAt);
    });

  return <section className="reviewPage">
    <div className="reviewHeader">
      <div>
        <div className="sectionEyebrow">PERSONAL RECALL</div>
        <Title2>Review queue</Title2>
        <Text className="muted">Star patterns while reading. Never-reviewed and oldest-reviewed items rise to the top.</Text>
      </div>
      <Badge appearance="filled">{entries.length} saved</Badge>
    </div>

    {!entries.length&&<Card className="reviewEmpty">
      <Star24Filled/>
      <div>
        <strong>No saved patterns yet</strong>
        <p>Star any pattern card to add it here. The queue is stored locally in this browser.</p>
      </div>
    </Card>}

    <div className="reviewList">
      {entries.map(({entry,found})=>{
        const {tech,pattern}=found!;
        const age=reviewAgeDays(entry);
        const status=!Number.isFinite(age)?"New":age===0?"Reviewed today":age===1?"1 day ago":age+" days ago";
        return <Card key={pattern.id} className="reviewCard">
          <div className="reviewCardTop">
            <div>
              <div className="reviewMeta"><Badge appearance="outline">{tech.name}</Badge><span>{status}</span></div>
              <strong>{pattern.title}</strong>
              <p>{pattern.remember}</p>
            </div>
            <div className="reviewActions">
              <Button appearance="primary" onClick={()=>onReviewed(pattern.id)}>Mark reviewed</Button>
              <Button appearance="secondary" onClick={()=>onOpen(tech.id,pattern.id)}>Open</Button>
              <Button appearance="subtle" onClick={()=>onRemove(pattern.id)}>Remove</Button>
            </div>
          </div>
        </Card>;
      })}
    </div>
  </section>;
}
