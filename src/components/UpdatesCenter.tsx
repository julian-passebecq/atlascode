import React from "react";
import { Badge, Button, Card, Text, Title2, Title3 } from "@fluentui/react-components";
import { byId } from "../content/catalog";
import { updatesDocument } from "../content/updates";
import {
  loadUpdateVisits,
  newUpdatesSince,
  recordGlobalUpdateVisit,
  recordUpdateVisit,
  saveUpdateVisits,
  updateScopeKey,
  updatesForTechnology
} from "../core/updates";

function kindLabel(kind:string){
  return kind.charAt(0).toUpperCase()+kind.slice(1);
}

function formatVisit(value?:string){
  if(!value) return "First visit";
  const date=new Date(value);
  if(!Number.isFinite(date.getTime())) return "First visit";
  return date.toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"});
}

export function UpdatesCenter({
  techId,
  onOpenPattern
}:{
  techId?:string;
  onOpenPattern:(techId:string,patternId:string)=>void;
}){
  const scope=updateScopeKey(techId);
  const [visitInfo,setVisitInfo]=React.useState<{scope:string;lastVisit?:string}>(()=>({
    scope,
    lastVisit:loadUpdateVisits()[scope]
  }));

  React.useEffect(()=>{
    const visits=loadUpdateVisits();
    const previous=visits[scope];
    setVisitInfo({scope,lastVisit:previous});
    saveUpdateVisits(techId?recordUpdateVisit(visits,techId):recordGlobalUpdateVisit(visits));
  },[scope,techId]);

  const entries=React.useMemo(()=>updatesForTechnology(techId),[techId]);
  const lastVisit=visitInfo.scope===scope?visitInfo.lastVisit:undefined;
  const fresh=React.useMemo(()=>newUpdatesSince(entries,lastVisit),[entries,lastVisit]);
  const freshIds=React.useMemo(()=>new Set(fresh.map(entry=>entry.id)),[fresh]);
  const technology=techId?byId.get(techId):undefined;
  const latestVersion=technology?entries[0]?.version:undefined;

  return <section className="updatesPage">
    <div className="updatesHeader">
      <div>
        <div className="sectionEyebrow">VERSION-AWARE KNOWLEDGE</div>
        <Title2>{technology?technology.name+" updates":"AtlasCode updates"}</Title2>
        <Text className="muted">
          Curated release changes stay separate from evergreen patterns. Sources are official project documentation.
        </Text>
      </div>
      <div className="updatesStats">
        {latestVersion&&<Badge appearance="outline">Latest tracked {latestVersion}</Badge>}
        <Badge appearance={fresh.length?"filled":"outline"}>{fresh.length} new since last visit</Badge>
      </div>
    </div>

    <div className="updatesVisit">
      <span>Previous visit: {formatVisit(lastVisit)}</span>
      <span>Feed reviewed: {updatesDocument.reviewedAt}</span>
      <span>{entries.length} curated update{entries.length===1?"":"s"}</span>
    </div>

    {!entries.length&&
      <Card className="updatesEmpty">
        <Title3>No curated release notes yet</Title3>
        <p>
          This technology remains tracked. A future AI refresh can append verified release changes here without rewriting evergreen pattern cards.
        </p>
      </Card>
    }

    <div className="updatesList">
      {entries.map(entry=>{
        const tech=byId.get(entry.techId);
        const affected=entry.affectedPatternIds
          .map(patternId=>tech?.patterns.find(pattern=>pattern.id===patternId))
          .filter(Boolean);

        return <Card key={entry.id} className={freshIds.has(entry.id)?"releaseCard releaseFresh":"releaseCard"}>
          <div className="releaseTop">
            <div className="releaseBadges">
              {freshIds.has(entry.id)&&<Badge appearance="filled">New</Badge>}
              {!techId&&tech&&<Badge appearance="outline">{tech.name}</Badge>}
              <Badge appearance="tint">{kindLabel(entry.kind)}</Badge>
              <Badge appearance="outline">v{entry.version}</Badge>
              <span>{entry.publishedAt}</span>
            </div>
            <a className="updateSourceLink" href={entry.sourceUrl} target="_blank" rel="noreferrer">
              Official source
            </a>
          </div>

          <Title3>{entry.title}</Title3>
          <p className="releaseSummary">{entry.summary}</p>

          <div className="releaseImpact">
            <strong>AtlasCode impact</strong>
            <span>{entry.impact}</span>
          </div>

          <div className="releaseFooter">
            <span className="releaseSource">{entry.sourceLabel}</span>
            {!!affected.length&&
              <div className="affectedPatterns">
                <span>Affected cards</span>
                {affected.map(pattern=>
                  <Button
                    key={pattern!.id}
                    appearance="subtle"
                    size="small"
                    onClick={()=>onOpenPattern(entry.techId,pattern!.id)}
                  >
                    {pattern!.title}
                  </Button>
                )}
              </div>
            }
          </div>
        </Card>;
      })}
    </div>
  </section>;
}
