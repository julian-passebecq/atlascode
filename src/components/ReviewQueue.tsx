import React from "react";
import { Badge, Button, Card, Text, Title2, Title3 } from "@fluentui/react-components";
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
  const [sessionIds,setSessionIds]=React.useState<string[]>([]);
  const [sessionIndex,setSessionIndex]=React.useState(0);
  const [revealed,setRevealed]=React.useState(false);

  const entries=Object.values(state)
    .map(entry=>({entry,found:findPattern(entry.patternId)}))
    .filter(item=>!!item.found)
    .sort((a,b)=>{
      const ageA=reviewAgeDays(a.entry);
      const ageB=reviewAgeDays(b.entry);
      if(ageA!==ageB) return ageB-ageA;
      return a.entry.addedAt.localeCompare(b.entry.addedAt);
    });

  const startSession=()=>{
    setSessionIds(entries.map(({found})=>found!.pattern.id));
    setSessionIndex(0);
    setRevealed(false);
  };

  const stopSession=()=>{
    setSessionIds([]);
    setSessionIndex(0);
    setRevealed(false);
  };

  const advance=()=>{
    setSessionIndex(index=>index+1);
    setRevealed(false);
  };

  const currentId=sessionIds[sessionIndex];
  const current=currentId?findPattern(currentId):undefined;
  const sessionComplete=sessionIds.length>0 && sessionIndex>=sessionIds.length;

  if(sessionComplete){
    return <section className="reviewPage">
      <Card className="sessionComplete">
        <div className="sectionEyebrow">REVIEW SESSION</div>
        <Title2>Session complete</Title2>
        <Text className="muted">You worked through {sessionIds.length} saved patterns.</Text>
        <div className="sessionActions">
          <Button appearance="primary" onClick={stopSession}>Back to queue</Button>
          <Button appearance="secondary" onClick={startSession}>Review again</Button>
        </div>
      </Card>
    </section>;
  }

  if(current && sessionIds.length){
    const {tech,pattern}=current;
    return <section className="reviewPage">
      <div className="reviewHeader">
        <div>
          <div className="sectionEyebrow">REVIEW SESSION</div>
          <Title2>{sessionIndex+1} / {sessionIds.length}</Title2>
          <Text className="muted">Recall the implementation shape before revealing it.</Text>
        </div>
        <Button appearance="subtle" onClick={stopSession}>Exit session</Button>
      </div>

      <Card className="sessionCard">
        <div className="sessionMeta">
          <Badge appearance="outline">{tech.name}</Badge>
          {pattern.tags.map(tag=><Badge key={tag} appearance="tint">{tag}</Badge>)}
        </div>
        <Title3>{pattern.title}</Title3>
        <p className="sessionWhy">{pattern.why}</p>

        {!revealed?
          <div className="sessionRecall">
            <strong>Recall first</strong>
            <span>What primitive, ordering, join type or aggregation shape would you use?</span>
          </div>
          :
          <>
            <div className="codeShell sessionCode">
              <div className="codeHeader"><span>{pattern.language}</span><span>{pattern.tags.join(" · ")}</span></div>
              <pre><code>{pattern.code}</code></pre>
            </div>
            <div className="rememberBox">
              <strong>Remember</strong>
              <span>{pattern.remember}</span>
            </div>
          </>
        }

        <div className="sessionActions">
          {!revealed&&<Button appearance="primary" onClick={()=>setRevealed(true)}>Reveal pattern</Button>}
          {revealed&&
            <Button
              appearance="primary"
              onClick={()=>{
                onReviewed(pattern.id);
                advance();
              }}
            >
              Mark reviewed & next
            </Button>
          }
          <Button appearance="secondary" onClick={()=>onOpen(tech.id,pattern.id)}>Open full pattern</Button>
          <Button appearance="subtle" onClick={advance}>Skip</Button>
        </div>
      </Card>
    </section>;
  }

  return <section className="reviewPage">
    <div className="reviewHeader">
      <div>
        <div className="sectionEyebrow">PERSONAL RECALL</div>
        <Title2>Review queue</Title2>
        <Text className="muted">Star patterns while reading. Never-reviewed and oldest-reviewed items rise to the top.</Text>
      </div>
      <div className="reviewHeaderActions">
        <Badge appearance="filled">{entries.length} saved</Badge>
        {entries.length>0&&<Button appearance="primary" onClick={startSession}>Start review session</Button>}
      </div>
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
