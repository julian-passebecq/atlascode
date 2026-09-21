import React from "react";
import { Badge, Button, Card, Divider, Input, Switch, Tab, TabList, Text, Title2, Title3, Tooltip } from "@fluentui/react-components";
import { Add24Regular, BookOpen24Regular, Copy24Regular, Dismiss20Regular, Search24Regular, SplitHorizontal24Regular } from "@fluentui/react-icons";
import { byId, catalog, groups, Mode, Pattern, Technology } from "./content/catalog";

type PaneKey = "left" | "right";
type PaneState = { techId: string; mode: Mode };
type Workspace = { id: string; title: string; split: boolean; left: PaneState; right: PaneState };

const modes: {id:Mode;label:string}[] = [
  {id:"memo",label:"Memo"},{id:"patterns",label:"Patterns"},{id:"apis",label:"APIs"},
  {id:"examples",label:"Examples"},{id:"practice",label:"Practice"},{id:"updates",label:"What\u2019s new"}
];

function makeWorkspace(id: string = crypto.randomUUID(), techId: string = "python"): Workspace {
  return { id, title: byId.get(techId)?.name || "Workspace", split:false, left:{techId,mode:"memo"}, right:{techId:"sql",mode:"patterns"} };
}
function loadWorkspaces(): Workspace[] {
  try { const parsed=JSON.parse(localStorage.getItem("atlascode.workspaces") || "[]"); if(Array.isArray(parsed)&&parsed.length) return parsed; } catch {}
  return [makeWorkspace("starter","python")];
}

export function App({dark,setDark}:{dark:boolean;setDark:(value:boolean)=>void}) {
  const [workspaces,setWorkspaces]=React.useState<Workspace[]>(loadWorkspaces);
  const [activeId,setActiveId]=React.useState(workspaces[0].id);
  const [activePane,setActivePane]=React.useState<PaneKey>("left");
  const [query,setQuery]=React.useState("");
  const [compact,setCompact]=React.useState(false);
  const active=workspaces.find(w=>w.id===activeId) || workspaces[0];
  React.useEffect(()=>localStorage.setItem("atlascode.workspaces",JSON.stringify(workspaces)),[workspaces]);
  const mutate=(fn:(w:Workspace)=>Workspace)=>setWorkspaces(current=>current.map(w=>w.id===active.id?fn(w):w));
  const openTech=(techId:string)=>mutate(w=>{
    const next={...w,[activePane]:{...w[activePane],techId}} as Workspace;
    const title=next.split ? (byId.get(next.left.techId)?.name || "")+" + "+(byId.get(next.right.techId)?.name || "") : (byId.get(next.left.techId)?.name || "Workspace");
    return {...next,title};
  });
  const addWorkspace=()=>{const next=makeWorkspace();setWorkspaces(x=>[...x,next]);setActiveId(next.id);setActivePane("left");};
  const closeWorkspace=(id:string)=>{
    if(workspaces.length===1)return;
    const idx=workspaces.findIndex(w=>w.id===id); const next=workspaces.filter(w=>w.id!==id); setWorkspaces(next);
    if(id===activeId)setActiveId(next[Math.max(0,idx-1)].id);
  };
  const filtered=catalog.filter(t=>{const q=query.trim().toLowerCase();if(!q)return true;return [t.name,t.group,t.tagline,...t.patterns.map(p=>p.title),...t.patterns.flatMap(p=>p.tags)].join(" ").toLowerCase().includes(q);});

  return <div className={compact?"app compact":"app"}>
    <header className="topbar">
      <div className="brand"><div className="brandMark">&lt;/&gt;</div><div><Text weight="semibold" size={400}>AtlasCode</Text><Text size={200} className="muted">pattern studio</Text></div></div>
      <div className="topSearch"><Input value={query} onChange={(_,d)=>setQuery(d.value)} contentBefore={<Search24Regular/>} placeholder="Search window functions, joins, APIs..."/></div>
      <div className="topActions"><Switch checked={compact} onChange={(_,d)=>setCompact(!!d.checked)} label="Compact"/><Switch checked={dark} onChange={(_,d)=>setDark(!!d.checked)} label="Dark"/></div>
    </header>
    <div className="workspaceBar">
      <div className="workspaceTabs">{workspaces.map(w=><button key={w.id} className={w.id===active.id?"workspaceTab active":"workspaceTab"} onClick={()=>{setActiveId(w.id);setActivePane("left");}}><span>{w.title}</span>{workspaces.length>1&&<span className="workspaceClose" onClick={e=>{e.stopPropagation();closeWorkspace(w.id);}}><Dismiss20Regular/></span>}</button>)}<Tooltip content="New workspace" relationship="label"><Button appearance="subtle" icon={<Add24Regular/>} onClick={addWorkspace}/></Tooltip></div>
      <Button appearance={active.split?"primary":"subtle"} icon={<SplitHorizontal24Regular/>} onClick={()=>mutate(w=>{const split=!w.split;return {...w,split,title:split?(byId.get(w.left.techId)?.name||"")+" + "+(byId.get(w.right.techId)?.name||""):(byId.get(w.left.techId)?.name||"Workspace")};})}>Split</Button>
    </div>
    <div className="shell">
      <aside className="explorer">
        <div className="explorerTitle"><BookOpen24Regular/><Text weight="semibold">Technology atlas</Text></div>
        <div className="explorerHint">Opens in the {activePane} pane. {filtered.length} technologies.</div>
        <nav className="techTree">{groups.map(group=>{const items=filtered.filter(t=>t.group===group);if(!items.length)return null;return <section key={group}><div className="groupLabel">{group}</div>{items.map(t=>{const selected=active[activePane].techId===t.id;return <button key={t.id} className={selected?"techItem selected":"techItem"} onClick={()=>openTech(t.id)}><span className="techGlyph">{t.name.slice(0,2).toUpperCase()}</span><span className="techText"><strong>{t.name}</strong><small>{t.tagline}</small></span></button>;})}</section>;})}</nav>
      </aside>
      <main className={active.split?"reader split":"reader"}>
        <Pane state={active.left} active={activePane==="left"} onFocus={()=>setActivePane("left")} onState={state=>mutate(w=>({...w,left:state,title:w.split?(byId.get(state.techId)?.name||"")+" + "+(byId.get(w.right.techId)?.name||""):(byId.get(state.techId)?.name||"Workspace")}))}/>
        {active.split&&<Pane state={active.right} active={activePane==="right"} onFocus={()=>setActivePane("right")} onState={state=>mutate(w=>({...w,right:state,title:(byId.get(w.left.techId)?.name||"")+" + "+(byId.get(state.techId)?.name||"")}))}/>}
      </main>
    </div>
  </div>;
}

function Pane({state,active,onFocus,onState}:{state:PaneState;active:boolean;onFocus:()=>void;onState:(s:PaneState)=>void}) {
  const tech=byId.get(state.techId)||catalog[0];
  return <section className={active?"pane activePane":"pane"} onMouseDown={onFocus}>
    <div className="paneHeader"><div className="paneIdentity"><div className="heroGlyph">{tech.name.slice(0,2).toUpperCase()}</div><div><Title2>{tech.name}</Title2><Text className="muted">{tech.tagline}</Text></div></div><Badge appearance="outline">{tech.group}</Badge></div>
    <TabList selectedValue={state.mode} onTabSelect={(_,d)=>onState({...state,mode:d.value as Mode})} size="small" className="modeTabs">{modes.map(m=><Tab key={m.id} value={m.id}>{m.label}</Tab>)}</TabList>
    <Divider/>
    <div className="paneScroll">{state.mode==="memo"&&<Memo tech={tech}/>} {state.mode==="patterns"&&<Patterns patterns={tech.patterns}/>} {state.mode==="apis"&&<Apis tech={tech}/>} {state.mode==="examples"&&<Patterns patterns={tech.patterns.slice(0,2)} examples/>} {state.mode==="practice"&&<Practice tech={tech}/>} {state.mode==="updates"&&<Updates tech={tech}/>}</div>
  </section>;
}

function Memo({tech}:{tech:Technology}) {
  return <div className="contentColumn"><section><div className="sectionEyebrow">FAST RECALL</div><Title3>Core memo</Title3><div className="memoGrid">{tech.basics.map(item=><Card key={item.label} className="memoCard"><Text size={200} className="muted">{item.label}</Text><code>{item.value}</code></Card>)}</div></section><section><div className="sectionEyebrow">MENTAL MODEL</div><Title3>Patterns worth memorizing</Title3><div className="recallList">{tech.patterns.map((p,i)=><div className="recallRow" key={p.id}><div className="recallNumber">{String(i+1).padStart(2,"0")}</div><div><strong>{p.title}</strong><p>{p.remember}</p></div></div>)}</div></section></div>;
}
function Patterns({patterns,examples=false}:{patterns:Pattern[];examples?:boolean}) { return <div className="contentColumn"><div><div className="sectionEyebrow">{examples?"WORKED EXAMPLES":"PATTERN LIBRARY"}</div><Title3>{examples?"Read the pattern in context":"Coding patterns to recognize"}</Title3></div>{patterns.map(p=><PatternCard key={p.id} pattern={p}/>)}</div>; }
function PatternCard({pattern}:{pattern:Pattern}) {
  const [copied,setCopied]=React.useState(false);
  const copy=async()=>{await navigator.clipboard.writeText(pattern.code);setCopied(true);window.setTimeout(()=>setCopied(false),1000);};
  return <Card className="patternCard"><div className="patternHead"><div><div className="patternTitle"><strong>{pattern.title}</strong>{pattern.tags.map(t=><Badge key={t} appearance="tint">{t}</Badge>)}</div><Text className="muted">{pattern.why}</Text></div><Tooltip content={copied?"Copied":"Copy pattern"} relationship="label"><Button appearance="subtle" icon={<Copy24Regular/>} onClick={copy}/></Tooltip></div><div className="codeShell"><div className="codeHeader"><span>{pattern.language}</span><span>{pattern.tags.join(" · ")}</span></div><pre><code>{pattern.code}</code></pre></div><div className="rememberBox"><strong>Remember</strong><span>{pattern.remember}</span></div></Card>;
}
function Apis({tech}:{tech:Technology}) { return <div className="contentColumn"><div><div className="sectionEyebrow">API / LIBRARY SURFACE</div><Title3>High-value calls and syntax</Title3></div><div className="apiGrid">{tech.apis.map(item=><Card key={item.name} className="apiCard"><div className="apiTop"><strong>{item.name}</strong></div><code className="signature">{item.signature}</code><p>{item.whatFor}</p><div className="miniExample">{item.example}</div></Card>)}</div></div>; }
function Practice({tech}:{tech:Technology}) { return <div className="contentColumn"><div><div className="sectionEyebrow">PATTERN RECOGNITION</div><Title3>Read the problem, recall the shape</Title3><Text className="muted">No editor: identify the right primitive before revealing the pattern.</Text></div>{tech.practices.map(p=><PracticeCard key={p.title} item={p}/>)}</div>; }
function PracticeCard({item}:{item:Technology["practices"][number]}) { const [open,setOpen]=React.useState(false); return <Card className="practiceCard"><div className="practiceHead"><div><strong>{item.title}</strong><p>{item.prompt}</p></div><Button appearance="secondary" onClick={()=>setOpen(v=>!v)}>{open?"Hide pattern":"Reveal pattern"}</Button></div>{open&&<div className="practiceReveal"><Badge appearance="filled">{item.pattern}</Badge><p>{item.reveal}</p></div>}</Card>; }
function Updates({tech}:{tech:Technology}) { return <div className="contentColumn"><div><div className="sectionEyebrow">VERSION-AWARE</div><Title3>What\u2019s new</Title3><Text className="muted">Evergreen syntax stays in Memo and Patterns; version-sensitive AI refreshes land here.</Text></div><Card className="updateCard"><div className="updateMeta"><Badge appearance="filled">AI sync</Badge><span>2026-09-21</span><span>tracking</span></div><strong>{tech.name} release watch enabled</strong><p>This technology is registered for curated release notes, changed APIs, migrations and deprecations.</p><div className="impact"><strong>Content rule:</strong> updates should cite official release material and modify evergreen patterns only when recommended usage actually changes.</div></Card><Card className="updateCard"><strong>Next AI pass</strong><p>Compare the current official documentation against the last reviewed snapshot, create a concise delta, and flag affected pattern cards for review.</p></Card></div>; }