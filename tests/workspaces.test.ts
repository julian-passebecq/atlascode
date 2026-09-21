import { describe, expect, it } from "vitest";
import {
  createWorkspace,
  loadWorkspaces,
  parseWorkspaces,
  saveWorkspaces,
  workspaceTitle
} from "../src/core/workspaces";

describe("workspace parsing", () => {
  it("recomputes stale titles and strips transient focus state", () => {
    const parsed=parseWorkspaces([{
      id:"w1",
      title:"Old stale title",
      split:true,
      left:{
        techId:"pandas",
        mode:"patterns",
        focusId:"pd-latest-row",
        focusKind:"pattern",
        focusSeq:99
      },
      right:{
        techId:"polars",
        mode:"apis",
        focusId:"something",
        focusKind:"api"
      }
    }]);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe("Pandas + Polars");
    expect(parsed[0].left).toEqual({techId:"pandas",mode:"patterns"});
    expect(parsed[0].right).toEqual({techId:"polars",mode:"apis"});
  });

  it("drops duplicate IDs and invalid modes or technologies", () => {
    const parsed=parseWorkspaces([
      {id:"same",split:false,left:{techId:"python",mode:"memo"},right:{techId:"sql",mode:"patterns"}},
      {id:"same",split:false,left:{techId:"pandas",mode:"memo"},right:{techId:"sql",mode:"patterns"}},
      {id:"bad-mode",split:false,left:{techId:"python",mode:"broken"},right:{techId:"sql",mode:"patterns"}},
      {id:"bad-tech",split:false,left:{techId:"missing",mode:"memo"},right:{techId:"sql",mode:"patterns"}}
    ]);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe("same");
    expect(parsed[0].left.techId).toBe("python");
  });

  it("falls back to Python when creating an unknown technology workspace", () => {
    const workspace=createWorkspace("x","unknown-tech");
    expect(workspace.left.techId).toBe("python");
    expect(workspace.title).toBe("Python");
  });
});

describe("workspace persistence", () => {
  it("recovers from malformed or throwing storage", () => {
    const malformed={getItem:()=>"{bad json"};
    const throwing={getItem:()=>{throw new Error("blocked");}};

    expect(loadWorkspaces(malformed)[0].left.techId).toBe("python");
    expect(loadWorkspaces(throwing)[0].left.techId).toBe("python");
  });

  it("serializes only persistent pane state", () => {
    let saved="";
    const storage={setItem:(_key:string,value:string)=>{saved=value;}};
    const workspace=createWorkspace("w1","python");
    workspace.left={
      ...workspace.left,
      focusId:"py-index",
      focusKind:"pattern",
      focusSeq:7
    };

    expect(saveWorkspaces([workspace],storage)).toBe(true);
    const parsed=JSON.parse(saved);

    expect(parsed[0].title).toBeUndefined();
    expect(parsed[0].left).toEqual({techId:"python",mode:"memo"});
    expect(parsed[0].left.focusId).toBeUndefined();
  });

  it("reports storage write failure without throwing", () => {
    const storage={setItem:()=>{throw new Error("quota");}};
    expect(saveWorkspaces([createWorkspace("w1")],storage)).toBe(false);
  });
});

describe("workspaceTitle", () => {
  it("tracks split state instead of trusting persisted labels", () => {
    const workspace=createWorkspace("w1","pandas");
    expect(workspaceTitle(workspace)).toBe("Pandas");
    expect(workspaceTitle({...workspace,split:true,right:{techId:"polars",mode:"patterns"}}))
      .toBe("Pandas + Polars");
  });
});
