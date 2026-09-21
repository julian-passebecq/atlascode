export type TrackId =
  | "data-analyst"
  | "data-engineering"
  | "bi-warehousing"
  | "cloud-lakehouse"
  | "devops";

export type LearningTrack = {
  id:TrackId;
  label:string;
  description:string;
  defaultTechId:string;
};

export const learningTracks:LearningTrack[] = [
  {
    id:"data-analyst",
    label:"Data Analyst",
    description:"Python, Pandas, SQL, Excel and analytical reasoning.",
    defaultTechId:"python"
  },
  {
    id:"data-engineering",
    label:"Data Engineering",
    description:"Orchestration, DataFrames, Spark, lakehouse and reliable pipelines.",
    defaultTechId:"airflow"
  },
  {
    id:"bi-warehousing",
    label:"BI & Warehousing",
    description:"dbt, SQL warehouses, DAX, dimensional and semantic-layer patterns.",
    defaultTechId:"dbt"
  },
  {
    id:"cloud-lakehouse",
    label:"Cloud & Lakehouse",
    description:"Fabric, Databricks, Spark, Delta and cloud analytical platforms.",
    defaultTechId:"fabric"
  },
  {
    id:"devops",
    label:"DevOps",
    description:"Kubernetes, Docker, Git, Bash, Linux, PowerShell and API operations.",
    defaultTechId:"kubernetes"
  }
];

export const trackById = new Map(learningTracks.map(track=>[track.id,track]));
