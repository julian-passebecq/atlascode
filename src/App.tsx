import React from "react";
import {
  Badge,
  Button,
  Card,
  Divider,
  Input,
  Switch,
  Tab,
  TabList,
  Text,
  Title2,
  Title3,
  Tooltip
} from "@fluentui/react-components";
import {
  Add24Regular,
  BookOpen24Regular,
  Dismiss20Regular,
  Search24Regular,
  SplitHorizontal24Regular,
  Star24Filled
} from "@fluentui/react-icons";
import { byId, catalog, groups, Mode, Pattern, Technology } from "./content/catalog";
import { KnowledgeSearch } from "./components/KnowledgeSearch";
import { PatternCard } from "./components/PatternCard";
import { ReviewQueue } from "./components/ReviewQueue";
import { SearchResult } from "./core/knowledge";
import {
  loadReviewState,
  markReviewed,
  ReviewState,
  saveReviewState,
  toggleReviewPattern
} from "./core/review";

type PaneKey = "left" | "right";
type PaneState = { techId:string; mode:Mode };
type Workspace = {
  id:string;
  title:string;
  split:boolean;
  left:PaneState;
  right:PaneState;
};

const modes:{id:Mode;label:string}[]=[
  {id:"memo",label:"Memo"},
  {id:"patterns",label:"Patterns"},
  {id:"apis",label:"APIs"},
  {id:"examples",label:"Examples"},
  {id:"practice",label:"Practice"},
  {id:"updates",label:"What’s new"}
];

function makeWorkspace(id:string=crypto.randomUUID(),techId:string="python"):Workspace{
  return {
    id,
    title:byId.get(techId)?.name||"Workspace",
    split:false,
    left:{techId,mode:"memo"},
    right:{techId:"sql",mode:"patterns"}
  };
}

function loadWorkspaces():Workspace[]{
  try{
    const parsed=JSON.parse(localStorage.getItem("atlascode.workspaces")||"[]");
    if(Array.isArray(parsed)&&parsed.length) return parsed;
  }catch{}
  return [makeWorkspace("starter","python")];
}

export function App({
  dark,
  setDark
}:{
  dark:boolean;
  setDark:(value:boolean)=>void;
}){
  const [workspaces,setWorkspaces]=React.useState<Workspace[]>(loadWorkspaces);
  const [activeId,setActiveId]=React.useState(workspaces[0].id);
  const [activePane,setActivePane]=React.useState<PaneKey>("left");
  const [query,setQuery]=React.useState("");
  const [compact,setCompact]=React.useState(false);
  const [reviewOpen,setReviewOpen]=React.useState(false);
  const [reviewState,setReviewState]=React.useState<ReviewState>(loadReviewState);

  const active=workspaces.find(workspace=>workspace.id===activeId)||workspaces[0];

  React.useEffect(()=>{
    localStorage.setItem("atlascode.workspaces",JSON.stringify(workspaces));
  },[workspaces]);

  React.useEffect(()=>{
    saveReviewState(reviewState);
  },[reviewState]);

  const mutate=(fn:(workspace:Workspace)=>Workspace)=>{
    setWorkspaces(current=>current.map(workspace=>workspace.id===active.id?fn(workspace):workspace));
  };

  const titleFor=(workspace:Workspace)=>{
    const left=byId.get(workspace.left.techId)?.name||"Workspace";
    if(!workspace.split) return left;
    return left+" + "+(byId.get(workspace.right.techId)?.name||"");
  };

  const openTarget=(techId:string,mode?:Mode)=>{
    setReviewOpen(false);
    mutate(workspace=>{
      const pane={...workspace[activePane],techId,...(mode?{mode}:{})};
      const next={...workspace,[activePane]:pane} as Workspace;
      return {...next,title:titleFor(next)};
    });
  };

  const openSearchResult=(result:SearchResult)=>{
    setQuery("");
    openTarget(result.techId,result.mode);
  };

  const addWorkspace=()=>{
    const next=makeWorkspace();
    setWorkspaces(current=>[...current,next]);
    setActiveId(next.id);
    setActivePane("left");
    setReviewOpen(false);
  };

  const closeWorkspace=(id:string)=>{
    if(workspaces.length===1) return;
    const index=workspaces.findIndex(workspace=>workspace.id===id);
    const next=workspaces.filter(workspace=>workspace.id!==id);
    setWorkspaces(next);
    if(id===activeId) setActiveId(next[Math.max(0,index-1)].id);
  };

  const toggleFavorite=(patternId:string)=>{
    setReviewState(state=>toggleReviewPattern(state,patternId));
  };

  const markFavoriteReviewed=(patternId:string)=>{
    setReviewState(state=>markReviewed(state,patternId));
  };

  const filtered=catalog.filter(tech=>{
    const needle=query.trim().toLowerCase();
    if(!needle) return true;
    return [
      tech.name,
      tech.group,
      tech.tagline,
      ...tech.patterns.map(pattern=>pattern.title),
      ...tech.patterns.flatMap(pattern=>pattern.tags)
    ].join(" ").toLowerCase().includes(needle);
  });

  return <div className={compact?"app compact":"app"}>
    <header className="topbar">
      <div className="brand">
        <div className="brandMark">&lt;/&gt;</div>
        <div>
          <Text weight="semibold" size={400}>AtlasCode</Text>
          <Text size={200} className="muted">pattern studio</Text>
        </div>
      </div>

      <div className="topSearch">
        <Input
          value={query}
          onChange={(_,data)=>setQuery(data.value)}
          contentBefore={<Search24Regular/>}
          placeholder="Search latest row, QUALIFY, XLOOKUP, Window..."
        />
        <KnowledgeSearch query={query} onOpen={openSearchResult}/>
      </div>

      <div className="topActions">
        <Switch checked={compact} onChange={(_,data)=>setCompact(!!data.checked)} label="Compact"/>
        <Switch checked={dark} onChange={(_,data)=>setDark(!!data.checked)} label="Dark"/>
      </div>
    </header>

    <div className="workspaceBar">
      <div className="workspaceTabs">
        {workspaces.map(workspace=>
          <button
            key={workspace.id}
            className={workspace.id===active.id?"workspaceTab active":"workspaceTab"}
            onClick={()=>{
              setActiveId(workspace.id);
              setActivePane("left");
              setReviewOpen(false);
            }}
          >
            <span>{workspace.title}</span>
            {workspaces.length>1&&
              <span
                className="workspaceClose"
                onClick={event=>{
                  event.stopPropagation();
                  closeWorkspace(workspace.id);
                }}
              >
                <Dismiss20Regular/>
              </span>
            }
          </button>
        )}
        <Tooltip content="New workspace" relationship="label">
          <Button appearance="subtle" icon={<Add24Regular/>} onClick={addWorkspace}/>
        </Tooltip>
      </div>

      <div className="workspaceTools">
        <Button
          appearance={reviewOpen?"primary":"subtle"}
          icon={<Star24Filled/>}
          onClick={()=>setReviewOpen(value=>!value)}
        >
          Review {Object.keys(reviewState).length}
        </Button>
        <Button
          appearance={active.split?"primary":"subtle"}
          icon={<SplitHorizontal24Regular/>}
          onClick={()=>mutate(workspace=>{
            const next={...workspace,split:!workspace.split};
            return {...next,title:titleFor(next)};
          })}
        >
          Split
        </Button>
      </div>
    </div>

    <div className="shell">
      <aside className="explorer">
        <div className="explorerTitle">
          <BookOpen24Regular/>
          <Text weight="semibold">Technology atlas</Text>
        </div>
        <div className="explorerHint">
          Opens in the {activePane} pane. {filtered.length} technologies.
        </div>

        <nav className="techTree">
          {groups.map(group=>{
            const items=filtered.filter(tech=>tech.group===group);
            if(!items.length) return null;
            return <section key={group}>
              <div className="groupLabel">{group}</div>
              {items.map(tech=>{
                const selected=active[activePane].techId===tech.id;
                return <button
                  key={tech.id}
                  className={selected?"techItem selected":"techItem"}
                  onClick={()=>openTarget(tech.id)}
                >
                  <span className="techGlyph">{tech.name.slice(0,2).toUpperCase()}</span>
                  <span className="techText">
                    <strong>{tech.name}</strong>
                    <small>{tech.tagline}</small>
                  </span>
                </button>;
              })}
            </section>;
          })}
        </nav>
      </aside>

      {reviewOpen?
        <main className="reader reviewReader">
          <ReviewQueue
            state={reviewState}
            onOpen={techId=>openTarget(techId,"patterns")}
            onReviewed={markFavoriteReviewed}
            onRemove={toggleFavorite}
          />
        </main>
        :
        <main className={active.split?"reader split":"reader"}>
          <Pane
            state={active.left}
            active={activePane==="left"}
            onFocus={()=>setActivePane("left")}
            onState={state=>mutate(workspace=>{
              const next={...workspace,left:state};
              return {...next,title:titleFor(next)};
            })}
            reviewState={reviewState}
            onToggleFavorite={toggleFavorite}
            onOpenRelated={techId=>openTarget(techId,"patterns")}
          />
          {active.split&&
            <Pane
              state={active.right}
              active={activePane==="right"}
              onFocus={()=>setActivePane("right")}
              onState={state=>mutate(workspace=>{
                const next={...workspace,right:state};
                return {...next,title:titleFor(next)};
              })}
              reviewState={reviewState}
              onToggleFavorite={toggleFavorite}
              onOpenRelated={techId=>openTarget(techId,"patterns")}
            />
          }
        </main>
      }
    </div>
  </div>;
}

function Pane({
  state,
  active,
  onFocus,
  onState,
  reviewState,
  onToggleFavorite,
  onOpenRelated
}:{
  state:PaneState;
  active:boolean;
  onFocus:()=>void;
  onState:(state:PaneState)=>void;
  reviewState:ReviewState;
  onToggleFavorite:(patternId:string)=>void;
  onOpenRelated:(techId:string)=>void;
}){
  const tech=byId.get(state.techId)||catalog[0];

  return <section className={active?"pane activePane":"pane"} onMouseDown={onFocus}>
    <div className="paneHeader">
      <div className="paneIdentity">
        <div className="heroGlyph">{tech.name.slice(0,2).toUpperCase()}</div>
        <div>
          <Title2>{tech.name}</Title2>
          <Text className="muted">{tech.tagline}</Text>
        </div>
      </div>
      <Badge appearance="outline">{tech.group}</Badge>
    </div>

    <TabList
      selectedValue={state.mode}
      onTabSelect={(_,data)=>onState({...state,mode:data.value as Mode})}
      size="small"
      className="modeTabs"
    >
      {modes.map(mode=><Tab key={mode.id} value={mode.id}>{mode.label}</Tab>)}
    </TabList>

    <Divider/>

    <div className="paneScroll">
      {state.mode==="memo"&&<Memo tech={tech}/>}
      {state.mode==="patterns"&&
        <Patterns
          patterns={tech.patterns}
          reviewState={reviewState}
          onToggleFavorite={onToggleFavorite}
          onOpenRelated={onOpenRelated}
        />
      }
      {state.mode==="apis"&&<Apis tech={tech}/>}
      {state.mode==="examples"&&
        <Patterns
          patterns={tech.patterns.slice(0,2)}
          examples
          reviewState={reviewState}
          onToggleFavorite={onToggleFavorite}
          onOpenRelated={onOpenRelated}
        />
      }
      {state.mode==="practice"&&<Practice tech={tech}/>}
      {state.mode==="updates"&&<Updates tech={tech}/>}
    </div>
  </section>;
}

function Memo({tech}:{tech:Technology}){
  return <div className="contentColumn">
    <section>
      <div className="sectionEyebrow">FAST RECALL</div>
      <Title3>Core memo</Title3>
      <div className="memoGrid">
        {tech.basics.map(item=>
          <Card key={item.label} className="memoCard">
            <Text size={200} className="muted">{item.label}</Text>
            <code>{item.value}</code>
          </Card>
        )}
      </div>
    </section>

    <section>
      <div className="sectionEyebrow">MENTAL MODEL</div>
      <Title3>Patterns worth memorizing</Title3>
      <div className="recallList">
        {tech.patterns.map((pattern,index)=>
          <div className="recallRow" key={pattern.id}>
            <div className="recallNumber">{String(index+1).padStart(2,"0")}</div>
            <div>
              <strong>{pattern.title}</strong>
              <p>{pattern.remember}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  </div>;
}

function Patterns({
  patterns,
  examples=false,
  reviewState,
  onToggleFavorite,
  onOpenRelated
}:{
  patterns:Pattern[];
  examples?:boolean;
  reviewState:ReviewState;
  onToggleFavorite:(patternId:string)=>void;
  onOpenRelated:(techId:string)=>void;
}){
  return <div className="contentColumn">
    <div>
      <div className="sectionEyebrow">{examples?"WORKED EXAMPLES":"PATTERN LIBRARY"}</div>
      <Title3>{examples?"Read the pattern in context":"Coding patterns to recognize"}</Title3>
    </div>
    {patterns.map(pattern=>
      <PatternCard
        key={pattern.id}
        pattern={pattern}
        favorite={!!reviewState[pattern.id]}
        onToggleFavorite={()=>onToggleFavorite(pattern.id)}
        onOpenRelated={onOpenRelated}
      />
    )}
  </div>;
}

function Apis({tech}:{tech:Technology}){
  return <div className="contentColumn">
    <div>
      <div className="sectionEyebrow">API / LIBRARY SURFACE</div>
      <Title3>High-value calls and syntax</Title3>
    </div>
    <div className="apiGrid">
      {tech.apis.map(item=>
        <Card key={item.name} className="apiCard">
          <div className="apiTop"><strong>{item.name}</strong></div>
          <code className="signature">{item.signature}</code>
          <p>{item.whatFor}</p>
          <div className="miniExample">{item.example}</div>
        </Card>
      )}
    </div>
  </div>;
}

function Practice({tech}:{tech:Technology}){
  return <div className="contentColumn">
    <div>
      <div className="sectionEyebrow">PATTERN RECOGNITION</div>
      <Title3>Read the problem, recall the shape</Title3>
      <Text className="muted">No editor: identify the right primitive before revealing the pattern.</Text>
    </div>
    {tech.practices.map(item=><PracticeCard key={item.title} item={item}/>)}
  </div>;
}

function PracticeCard({item}:{item:Technology["practices"][number]}){
  const [open,setOpen]=React.useState(false);
  return <Card className="practiceCard">
    <div className="practiceHead">
      <div>
        <strong>{item.title}</strong>
        <p>{item.prompt}</p>
      </div>
      <Button appearance="secondary" onClick={()=>setOpen(value=>!value)}>
        {open?"Hide pattern":"Reveal pattern"}
      </Button>
    </div>
    {open&&
      <div className="practiceReveal">
        <Badge appearance="filled">{item.pattern}</Badge>
        <p>{item.reveal}</p>
      </div>
    }
  </Card>;
}

function Updates({tech}:{tech:Technology}){
  return <div className="contentColumn">
    <div>
      <div className="sectionEyebrow">VERSION-AWARE</div>
      <Title3>What’s new</Title3>
      <Text className="muted">
        Evergreen syntax stays in Memo and Patterns; version-sensitive AI refreshes land here.
      </Text>
    </div>
    <Card className="updateCard">
      <div className="updateMeta">
        <Badge appearance="filled">AI sync</Badge>
        <span>2026-09-21</span>
        <span>tracking</span>
      </div>
      <strong>{tech.name} release watch enabled</strong>
      <p>This technology is registered for curated release notes, changed APIs, migrations and deprecations.</p>
      <div className="impact">
        <strong>Content rule:</strong> updates should cite official release material and modify evergreen patterns only when recommended usage actually changes.
      </div>
    </Card>
    <Card className="updateCard">
      <strong>Next AI pass</strong>
      <p>Compare current official documentation against the last reviewed snapshot, create a concise delta, and flag affected pattern cards for review.</p>
    </Card>
  </div>;
}
