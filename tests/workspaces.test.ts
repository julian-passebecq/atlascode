import { describe, expect, it } from "vitest";
import {
  createWorkspace,
  loadWorkspaces,
  parseWorkspaces,
  saveWorkspaces,
  scopeWorkspaceToTechnologies,
  visiblePaneKey,
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


describe("visiblePaneKey", () => {
  it("never targets the hidden right pane when split view is off", () => {
    expect(visiblePaneKey(false,"right")).toBe("left");
    expect(visiblePaneKey(false,"left")).toBe("left");
  });

  it("preserves the selected pane while split view is visible", () => {
    expect(visiblePaneKey(true,"right")).toBe("right");
    expect(visiblePaneKey(true,"left")).toBe("left");
  });
});


describe("scopeWorkspaceToTechnologies", () => {
  it("keeps panes already inside the selected track", () => {
    const workspace=createWorkspace("w1","python");
    const scoped=scopeWorkspaceToTechnologies(
      {...workspace,split:true,right:{techId:"pandas",mode:"patterns"}},
      new Set(["python","pandas","sql"]),
      "python"
    );

    expect(scoped.left.techId).toBe("python");
    expect(scoped.right.techId).toBe("pandas");
    expect(scoped.title).toBe("Python + Pandas");
  });

  it("moves out-of-track panes to valid defaults and clears transient focus", () => {
    const workspace=createWorkspace("w1","pandas");
    workspace.split=true;
    workspace.left={
      techId:"pandas",
      mode:"patterns",
      focusId:"pd-latest-row",
      focusKind:"pattern",
      focusSeq:4
    };
    workspace.right={
      techId:"sql",
      mode:"apis",
      focusId:"sql:ROW_NUMBER",
      focusKind:"api",
      focusSeq:5
    };

    const scoped=scopeWorkspaceToTechnologies(
      workspace,
      new Set(["kubernetes","docker","git"]),
      "kubernetes"
    );

    expect(scoped.left).toEqual({techId:"kubernetes",mode:"patterns"});
    expect(scoped.right).toEqual({techId:"docker",mode:"apis"});
    expect(scoped.title).toBe("Kubernetes + Docker");
  });

  it("uses the first valid allowed technology if the configured default is invalid", () => {
    const workspace=createWorkspace("w1","python");
    const scoped=scopeWorkspaceToTechnologies(
      workspace,
      new Set(["fabric","databricks"]),
      "missing-tech"
    );

    expect(scoped.left.techId).toBe("fabric");
  });

  it("returns the original workspace when no valid track technologies exist", () => {
    const workspace=createWorkspace("w1","python");
    expect(scopeWorkspaceToTechnologies(workspace,new Set(),"python")).toBe(workspace);
    expect(scopeWorkspaceToTechnologies(workspace,new Set(["missing-tech"]),"missing-tech")).toBe(workspace);
  });
});
