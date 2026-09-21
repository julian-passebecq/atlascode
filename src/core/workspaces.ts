import { byId, Mode } from "../content/catalog";

export type PaneKey = "left" | "right";
export type PaneState = {
  techId:string;
  mode:Mode;
  focusId?:string;
  focusKind?:"pattern"|"api"|"update";
  focusSeq?:number;
};
export type Workspace = {
  id:string;
  title:string;
  split:boolean;
  left:PaneState;
  right:PaneState;
};

const STORAGE_KEY="atlascode.workspaces";
export const modes:{id:Mode;label:string}[]=[
  {id:"memo",label:"Memo"},
  {id:"patterns",label:"Patterns"},
  {id:"apis",label:"APIs"},
  {id:"examples",label:"Examples"},
  {id:"practice",label:"Practice"},
  {id:"updates",label:"What’s new"}
];
const validModes=new Set<Mode>(modes.map(mode=>mode.id));

function makeId(){
  try{
    if(typeof crypto!=="undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  }catch{}
  return "workspace-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);
}

export function workspaceTitle(workspace:Pick<Workspace,"split"|"left"|"right">){
  const left=byId.get(workspace.left.techId)?.name||"Workspace";
  if(!workspace.split) return left;
  const right=byId.get(workspace.right.techId)?.name||"";
  return right ? left+" + "+right : left;
}

export function createWorkspace(id=makeId(),techId="python"):Workspace{
  const safeTechId=byId.has(techId)?techId:"python";
  const workspace:Workspace={
    id,
    title:"",
    split:false,
    left:{techId:safeTechId,mode:"memo"},
    right:{techId:"sql",mode:"patterns"}
  };
  return {...workspace,title:workspaceTitle(workspace)};
}

function parsePane(value:unknown):PaneState|undefined{
  if(!value||typeof value!=="object"||Array.isArray(value)) return undefined;
  const pane=value as Partial<PaneState>;
  if(typeof pane.techId!=="string"||!byId.has(pane.techId)) return undefined;
  if(typeof pane.mode!=="string"||!validModes.has(pane.mode as Mode)) return undefined;
  return {techId:pane.techId,mode:pane.mode as Mode};
}

export function parseWorkspaces(value:unknown):Workspace[]{
  if(!Array.isArray(value)) return [];
  const seen=new Set<string>();
  const result:Workspace[]=[];

  for(const raw of value){
    if(!raw||typeof raw!=="object"||Array.isArray(raw)) continue;
    const candidate=raw as Partial<Workspace>;
    if(typeof candidate.id!=="string"||!candidate.id.trim()||seen.has(candidate.id)) continue;
    if(typeof candidate.split!=="boolean") continue;

    const left=parsePane(candidate.left);
    const right=parsePane(candidate.right);
    if(!left||!right) continue;

    const workspace:Workspace={
      id:candidate.id,
      title:"",
      split:candidate.split,
      left,
      right
    };
    workspace.title=workspaceTitle(workspace);
    seen.add(candidate.id);
    result.push(workspace);
  }

  return result;
}

export function loadWorkspaces(storage:Pick<Storage,"getItem">=localStorage):Workspace[]{
  try{
    const parsed=parseWorkspaces(JSON.parse(storage.getItem(STORAGE_KEY)||"[]"));
    return parsed.length?parsed:[createWorkspace("starter","python")];
  }catch{
    return [createWorkspace("starter","python")];
  }
}

export function saveWorkspaces(
  workspaces:Workspace[],
  storage:Pick<Storage,"setItem">=localStorage
):boolean{
  try{
    const persistent=workspaces.map(workspace=>({
      id:workspace.id,
      split:workspace.split,
      left:{techId:workspace.left.techId,mode:workspace.left.mode},
      right:{techId:workspace.right.techId,mode:workspace.right.mode}
    }));
    storage.setItem(STORAGE_KEY,JSON.stringify(persistent));
    return true;
  }catch{
    return false;
  }
}
