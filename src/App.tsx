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
import { PatternCompare } from "./components/PatternCompare";
import { ReviewQueue } from "./components/ReviewQueue";
import { UpdatesCenter } from "./components/UpdatesCenter";
import { knowledgeDomId, matchingTechnologyIds, patternFamilies, SearchResult } from "./core/knowledge";
import {
  loadReviewState,
  markReviewed,
  pruneReviewState,
  ReviewState,
  saveReviewState,
  toggleReviewPattern
} from "./core/review";
import {
  createWorkspace,
  loadWorkspaces,
  modes,
  PaneKey,
  PaneState,
  saveWorkspaces,
  Workspace,
  workspaceTitle
} from "./core/workspaces";

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
  const [updatesOpen,setUpdatesOpen]=React.useState(false);
  const [compareConcept,setCompareConcept]=React.useState<string>();
  const validPatternIds=React.useMemo(()=>new Set(catalog.flatMap(tech=>tech.patterns.map(pattern=>pattern.id))),[]);
  const [reviewState,setReviewState]=React.useState<ReviewState>(()=>pruneReviewState(loadReviewState(),validPatternIds));
  const focusSeq=React.useRef(0);

  const active=workspaces.find(workspace=>workspace.id===activeId)||workspaces[0];

  React.useEffect(()=>{
    saveWorkspaces(workspaces);
  },[workspaces]);

  React.useEffect(()=>{
    saveReviewState(reviewState);
  },[reviewState]);

  const mutate=(fn:(workspace:Workspace)=>Workspace)=>{
    setWorkspaces(current=>current.map(workspace=>workspace.id===active.id?fn(workspace):workspace));
  };

  const openTarget=(techId:string,mode?:Mode,focusId?:string,focusKind?:"pattern"|"api"|"update")=>{
    setReviewOpen(false);
    setUpdatesOpen(false);
    setCompareConcept(undefined);
    const nextFocusSeq=++focusSeq.current;
    mutate(workspace=>{
      const pane={...workspace[activePane],techId,...(mode?{mode}:{}),focusId,focusKind,focusSeq:nextFocusSeq};
      const next={...workspace,[activePane]:pane} as Workspace;
      return {...next,title:workspaceTitle(next)};
    });
  };

  const openSearchResult=(result:SearchResult)=>{
    setQuery("");
    const focusKind=result.kind==="pattern"?"pattern":result.kind==="api"?"api":result.kind==="update"?"update":undefined;
    openTarget(result.techId,result.mode,focusKind?result.id:undefined,focusKind);
  };

  const addWorkspace=()=>{
    const next=createWorkspace();
    setWorkspaces(current=>[...current,next]);
    setActiveId(next.id);
    setActivePane("left");
    setReviewOpen(false);
    setUpdatesOpen(false);
    setCompareConcept(undefined);
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

  const matchingTechIds=React.useMemo(()=>matchingTechnologyIds(query),[query]);
  const families=React.useMemo(()=>patternFamilies(),[]);
  const filtered=catalog.filter(tech=>matchingTechIds.has(tech.id));

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
          onKeyDown={event=>{if(event.key==="Escape") setQuery("");}}
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
      <div className="workspaceTabs" role="tablist" aria-label="Workspaces">
        {workspaces.map(workspace=>
          <div
            key={workspace.id}
            className={workspace.id===active.id?"workspaceTab active":"workspaceTab"}
          >
            <button
              type="button"
              role="tab"
              aria-selected={workspace.id===active.id}
              className="workspaceTabButton"
              onClick={()=>{
                setActiveId(workspace.id);
                setActivePane("left");
                setReviewOpen(false);
                setUpdatesOpen(false);
                setCompareConcept(undefined);
              }}
            >
              <span>{workspace.title}</span>
            </button>
            {workspaces.length>1&&
              <button
                type="button"
                className="workspaceClose"
                aria-label={"Close "+workspace.title+" workspace"}
                onClick={()=>closeWorkspace(workspace.id)}
              >
                <Dismiss20Regular/>
              </button>
            }
          </div>
        )}
        <Tooltip content="New workspace" relationship="label">
          <Button appearance="subtle" icon={<Add24Regular/>} onClick={addWorkspace}/>
        </Tooltip>
      </div>

      <div className="workspaceTools">
        <Button
          appearance={reviewOpen?"primary":"subtle"}
          aria-pressed={reviewOpen}
          icon={<Star24Filled/>}
          onClick={()=>{setCompareConcept(undefined);setUpdatesOpen(false);setReviewOpen(value=>!value);}}
        >
          Review {Object.keys(reviewState).length}
        </Button>
        <Button
          appearance={updatesOpen?"primary":"subtle"}
          aria-pressed={updatesOpen}
          onClick={()=>{setCompareConcept(undefined);setReviewOpen(false);setUpdatesOpen(value=>!value);}}
        >
          Updates
        </Button>
        <Button
          appearance={active.split?"primary":"subtle"}
          aria-pressed={active.split}
          icon={<SplitHorizontal24Regular/>}
          onClick={()=>mutate(workspace=>{
            const next={...workspace,split:!workspace.split};
            return {...next,title:workspaceTitle(next)};
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

        {!query.trim()&&<section className="familyExplorer">
          <div className="groupLabel">Pattern families</div>
          <div className="familyButtons">
            {families.map(family=>
              <button
                key={family.concept}
                className={compareConcept===family.concept?"familyItem selected":"familyItem"}
                onClick={()=>{setReviewOpen(false);setUpdatesOpen(false);setCompareConcept(family.concept);}}
              >
                <span>{family.title}</span>
                <Badge appearance="outline">{family.count}</Badge>
              </button>
            )}
          </div>
        </section>}

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

      {compareConcept?
        <main className="reader compareReader">
          <PatternCompare
            concept={compareConcept}
            onClose={()=>setCompareConcept(undefined)}
            onOpen={(techId,patternId)=>openTarget(techId,"patterns",patternId,"pattern")}
          />
        </main>
        :
        updatesOpen?
        <main className="reader updatesReader">
          <UpdatesCenter
            onOpenPattern={(techId,patternId)=>openTarget(techId,"patterns",patternId,"pattern")}
          />
        </main>
        :
        reviewOpen?
        <main className="reader reviewReader">
          <ReviewQueue
            state={reviewState}
            onOpen={(techId,patternId)=>openTarget(techId,"patterns",patternId,"pattern")}
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
              return {...next,title:workspaceTitle(next)};
            })}
            reviewState={reviewState}
            onToggleFavorite={toggleFavorite}
            onOpenRelated={(techId,patternId)=>openTarget(techId,"patterns",patternId,"pattern")}
            onCompareConcept={concept=>{setReviewOpen(false);setUpdatesOpen(false);setCompareConcept(concept);}}
          />
          {active.split&&
            <Pane
              state={active.right}
              active={activePane==="right"}
              onFocus={()=>setActivePane("right")}
              onState={state=>mutate(workspace=>{
                const next={...workspace,right:state};
                return {...next,title:workspaceTitle(next)};
              })}
              reviewState={reviewState}
              onToggleFavorite={toggleFavorite}
              onOpenRelated={(techId,patternId)=>openTarget(techId,"patterns",patternId,"pattern")}
              onCompareConcept={concept=>{setReviewOpen(false);setUpdatesOpen(false);setCompareConcept(concept);}}
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
  onOpenRelated,
  onCompareConcept
}:{
  state:PaneState;
  active:boolean;
  onFocus:()=>void;
  onState:(state:PaneState)=>void;
  reviewState:ReviewState;
  onToggleFavorite:(patternId:string)=>void;
  onOpenRelated:(techId:string,patternId:string)=>void;
  onCompareConcept:(concept:string)=>void;
}){
  const tech=byId.get(state.techId)||catalog[0];

  React.useEffect(()=>{
    if(!state.focusId||!state.focusKind) return;
    const frame=requestAnimationFrame(()=>{
      document.getElementById(knowledgeDomId(state.focusKind!,state.focusId!))?.scrollIntoView({behavior:"smooth",block:"center"});
    });
    return ()=>cancelAnimationFrame(frame);
  },[state.focusSeq,state.focusId,state.focusKind]);

  return <section className={active?"pane activePane":"pane"} onMouseDown={onFocus} onFocusCapture={onFocus}>
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
      onTabSelect={(_,data)=>onState({...state,mode:data.value as Mode,focusId:undefined,focusKind:undefined})}
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
          onCompareConcept={onCompareConcept}
          focusId={state.focusKind==="pattern"?state.focusId:undefined}
        />
      }
      {state.mode==="apis"&&<Apis tech={tech} focusId={state.focusKind==="api"?state.focusId:undefined}/>}
      {state.mode==="examples"&&
        <Patterns
          patterns={tech.patterns.slice(0,2)}
          examples
          reviewState={reviewState}
          onToggleFavorite={onToggleFavorite}
          onOpenRelated={onOpenRelated}
          onCompareConcept={onCompareConcept}
          focusId={state.focusKind==="pattern"?state.focusId:undefined}
        />
      }
      {state.mode==="practice"&&<Practice tech={tech}/>}
      {state.mode==="updates"&&<UpdatesCenter techId={tech.id} focusId={state.focusKind==="update"?state.focusId:undefined} onOpenPattern={onOpenRelated}/>}
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
  onOpenRelated,
  onCompareConcept,
  focusId
}:{
  patterns:Pattern[];
  examples?:boolean;
  reviewState:ReviewState;
  onToggleFavorite:(patternId:string)=>void;
  onOpenRelated:(techId:string,patternId:string)=>void;
  onCompareConcept:(concept:string)=>void;
  focusId?:string;
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
        onCompareConcept={onCompareConcept}
        focused={focusId===pattern.id}
      />
    )}
  </div>;
}

function Apis({tech,focusId}:{tech:Technology;focusId?:string}){
  return <div className="contentColumn">
    <div>
      <div className="sectionEyebrow">API / LIBRARY SURFACE</div>
      <Title3>High-value calls and syntax</Title3>
    </div>
    <div className="apiGrid">
      {tech.apis.map(item=>
        <Card key={item.name} id={knowledgeDomId("api",tech.id+":"+item.name)} className={focusId===tech.id+":"+item.name?"apiCard knowledgeFocused":"apiCard"}>
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
      <Button appearance="secondary" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>
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

