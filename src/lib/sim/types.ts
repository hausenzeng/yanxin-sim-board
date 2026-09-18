export const LANES = ["pre", "post"] as const;
export type Lane = (typeof LANES)[number];

export const STAGES = ["idle", "running", "done"] as const;
export type Stage = (typeof STAGES)[number];

export type NodeKind = "folder" | "item";

export const ROOT_ID = "__root";

export type SimNode = {
  id: string;
  name: string;
  kind: NodeKind;
  children?: SimNode[];
};

/** 三个状态可同时打勾，互不覆盖。 */
export type LaneMarks = Record<Stage, boolean>;
export type StagePair = { pre: LaneMarks; post: LaneMarks };
export type StageMap = Record<string, StagePair>;

export function emptyMarks(): LaneMarks {
  return { idle: true, running: false, done: false };
}

export function emptyPair(): StagePair {
  return { pre: emptyMarks(), post: emptyMarks() };
}

export const LANE_LABEL: Record<Lane, string> = {
  pre: "前仿",
  post: "后仿",
};

export const STAGE_LABEL: Record<Stage, string> = {
  idle: "未开始",
  running: "仿真中",
  done: "已完成",
};
