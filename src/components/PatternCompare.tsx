import { Badge, Button, Card, Text, Title2 } from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { conceptTitle, patternsForConcept } from "../core/knowledge";

export function PatternCompare({
  concept,
  onClose,
  onOpen
}:{
  concept:string;
  onClose:()=>void;
  onOpen:(techId:string,patternId:string)=>void;
}){
  const items=patternsForConcept(concept);

  return <section className="comparePage">
    <div className="compareHeader">
      <div>
        <div className="sectionEyebrow">CROSS-TECHNOLOGY PATTERN</div>
        <Title2>{conceptTitle(concept)}</Title2>
        <Text className="muted">
          Same problem shape, different ecosystem syntax. Compare the invariant before memorizing the implementation.
        </Text>
      </div>
      <div className="compareHeaderActions">
        <Badge appearance="filled">{items.length} implementations</Badge>
        <Button appearance="subtle" icon={<Dismiss24Regular/>} onClick={onClose}>Close</Button>
      </div>
    </div>

    <div className="compareGrid">
      {items.map(({techId,techName,pattern})=>
        <Card key={techId+":"+pattern.id} className="compareCard">
          <div className="compareCardHeader">
            <Badge appearance="outline">{techName}</Badge>
            <Button appearance="subtle" size="small" onClick={()=>onOpen(techId,pattern.id)}>Open pattern</Button>
          </div>
          <strong>{pattern.title}</strong>
          <p className="compareWhy">{pattern.why}</p>
          <div className="compareCode">
            <pre><code>{pattern.code}</code></pre>
          </div>
          <div className="compareRemember">
            <strong>Remember</strong>
            <span>{pattern.remember}</span>
          </div>
        </Card>
      )}
    </div>
  </section>;
}
