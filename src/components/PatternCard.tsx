import React from "react";
import { Badge, Button, Card, Text, Tooltip } from "@fluentui/react-components";
import { Copy24Regular, Star24Filled, Star24Regular } from "@fluentui/react-icons";
import { Pattern } from "../content/catalog";
import { knowledgeDomId, relatedPatterns } from "../core/knowledge";

export function PatternCard({
  pattern,
  favorite,
  onToggleFavorite,
  onOpenRelated,
  onCompareConcept,
  allowedTechIds,
  focused=false
}:{
  pattern:Pattern;
  favorite:boolean;
  onToggleFavorite:()=>void;
  onOpenRelated:(techId:string,patternId:string)=>void;
  onCompareConcept?:(concept:string)=>void;
  allowedTechIds?:ReadonlySet<string>;
  focused?:boolean;
}){
  const [copied,setCopied]=React.useState(false);
  const related=relatedPatterns(pattern,allowedTechIds);

  const copy=async()=>{
    try{
      await navigator.clipboard.writeText(pattern.code);
      setCopied(true);
      window.setTimeout(()=>setCopied(false),1000);
    }catch{
      setCopied(false);
    }
  };

  return <Card id={knowledgeDomId("pattern",pattern.id)} className={focused?"patternCard knowledgeFocused":"patternCard"}>
    <div className="patternHead">
      <div>
        <div className="patternTitle">
          <strong>{pattern.title}</strong>
          {pattern.tags.map(tag=><Badge key={tag} appearance="tint">{tag}</Badge>)}
        </div>
        <Text className="muted">{pattern.why}</Text>
      </div>
      <div className="patternActions">
        <Tooltip content={favorite?"Remove from review":"Add to review"} relationship="label">
          <Button appearance="subtle" aria-label={favorite?"Remove from review":"Add to review"} aria-pressed={favorite} icon={favorite?<Star24Filled/>:<Star24Regular/>} onClick={onToggleFavorite}/>
        </Tooltip>
        <Tooltip content={copied?"Copied":"Copy pattern"} relationship="label">
          <Button appearance="subtle" aria-label={copied?"Copied":"Copy pattern"} icon={<Copy24Regular/>} onClick={copy}/>
        </Tooltip>
      </div>
    </div>
    <div className="codeShell">
      <div className="codeHeader"><span>{pattern.language}</span><span>{pattern.tags.join(" · ")}</span></div>
      <pre><code>{pattern.code}</code></pre>
    </div>
    <div className="rememberBox"><strong>Remember</strong><span>{pattern.remember}</span></div>
    {related.length>0&&<div className="relatedStrip">
      <div className="relatedLabel">Same pattern in</div>
      <div className="relatedLinks">
        {pattern.concept&&onCompareConcept&&<button className="compareFamilyButton" onClick={()=>onCompareConcept(pattern.concept!)}>Compare family</button>}
        {related.map(item=>
          <button key={item.techId+":"+item.pattern.id} onClick={()=>onOpenRelated(item.techId,item.pattern.id)}>
            {item.techName}
          </button>
        )}
      </div>
    </div>}
  </Card>;
}
