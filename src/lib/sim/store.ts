import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { seedRoot, seedStages } from "./seed";
import {
  addChild,
  canAddChild,
  childKind,
  collectIds,
  findNode,
  findPath,
  folderIds,
  l1Ids,
  newId,
  removeNode,
  renameNode,
} from "./tree";
import {
  ROOT_ID,
  emptyPair,
  emptyMarks,
  type Lane,
  type SimNode,
  type Stage,
  type StageMap,
} from "./types";

function expandAllMap(root: SimNode): Record<string, boolean> {
  const map: Record<string, boolean> = { [ROOT_ID]: true };
  for (const id of folderIds(root)) map[id] = true;
  return map;
}

function expandL1Map(root: SimNode): Record<string, boolean> {
  const map: Record<string, boolean> = { [ROOT_ID]: true };
  for (const id of l1Ids(root)) map[id] = true;
  return map;
}

type SimStore = {
  root: SimNode;
  stages: StageMap;
  expanded: Record<string, boolean>;
  setStage: (id: string, lane: Lane, stage: Stage) => void;
  toggle: (id: string) => void;
  expandAll: () => void;
  collapseToRoot: () => void;
  rename: (id: string, name: string) => void;
  addChild: (parentId: string) => string | null;
  remove: (id: string) => void;
};

export const useSimStore = create<SimStore>()(
  persist(
    (set, get) => ({
      root: seedRoot,
      stages: seedStages,
      expanded: expandAllMap(seedRoot),
      setStage: (id, lane, stage) =>
        set((s) => {
          const prev = s.stages[id] ?? emptyPair();
          const laneMarks = prev[lane] ?? emptyMarks();
          return {
            stages: {
              ...s.stages,
              [id]: {
                ...prev,
                [lane]: { ...laneMarks, [stage]: !laneMarks[stage] },
              },
            },
          };
        }),
      toggle: (id) =>
        set((s) => ({
          expanded: { ...s.expanded, [id]: !s.expanded[id] },
        })),
      expandAll: () => set((s) => ({ expanded: expandAllMap(s.root) })),
      collapseToRoot: () => set((s) => ({ expanded: expandL1Map(s.root) })),
      rename: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => ({ root: renameNode(s.root, id, trimmed) }));
      },
      addChild: (parentId) => {
        const { root } = get();
        const path = findPath(root, parentId);
        if (!path) return null;
        const kind = childKind(path.length);
        if (!kind || !canAddChild(path.length)) return null;
        const id = newId();
        const child: SimNode =
          kind === "folder"
            ? { id, name: "未命名目录", kind: "folder", children: [] }
            : { id, name: "未命名case", kind: "item" };
        set((s) => {
          const nextStages =
            kind === "item" ? { ...s.stages, [id]: emptyPair() } : s.stages;
          return {
            root: addChild(s.root, parentId, child),
            stages: nextStages,
            expanded: { ...s.expanded, [parentId]: true, [id]: true },
          };
        });
        return id;
      },
      remove: (id) => {
        if (id === ROOT_ID) return;
        set((s) => {
          const target = findNode(s.root, id);
          if (!target) return s;
          const gone = new Set(collectIds(target));
          const stages = { ...s.stages };
          for (const key of gone) delete stages[key];
          const expanded = { ...s.expanded };
          for (const key of gone) delete expanded[key];
          return { root: removeNode(s.root, id), stages, expanded };
        });
      },
    }),
    {
      name: "yanxin-sim-board-v1",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (s) => ({
        root: s.root,
        stages: s.stages,
        expanded: s.expanded,
      }),
      skipHydration: true,
    },
  ),
);
