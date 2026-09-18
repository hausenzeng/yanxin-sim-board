import { ROOT_ID, type Lane, type SimNode, type Stage, type StageMap } from "./types";

export type FlatRow = {
  node: SimNode;
  depth: number;
};

export function newId(): string {
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function walk(node: SimNode, visit: (n: SimNode) => void): void {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

export function folderIds(root: SimNode): string[] {
  const ids: string[] = [];
  walk(root, (n) => {
    if (n.kind === "folder") ids.push(n.id);
  });
  return ids;
}

export function itemIds(node: SimNode): string[] {
  const ids: string[] = [];
  walk(node, (n) => {
    if (n.kind === "item") ids.push(n.id);
  });
  return ids;
}

export function collectIds(node: SimNode): string[] {
  const ids: string[] = [];
  walk(node, (n) => ids.push(n.id));
  return ids;
}

export function findNode(root: SimNode, id: string): SimNode | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const hit = findNode(child, id);
    if (hit) return hit;
  }
  return null;
}

export function findPath(root: SimNode, id: string): SimNode[] | null {
  if (root.id === id) return [root];
  for (const child of root.children ?? []) {
    const nested = findPath(child, id);
    if (nested) return [root, ...nested];
  }
  return null;
}

export function visibleRows(root: SimNode, expanded: Record<string, boolean>): FlatRow[] {
  const rows: FlatRow[] = [];
  const visit = (node: SimNode, depth: number) => {
    rows.push({ node, depth });
    if (node.kind !== "folder") return;
    if (!expanded[node.id]) return;
    for (const child of node.children ?? []) visit(child, depth + 1);
  };
  for (const child of root.children ?? []) visit(child, 0);
  return rows;
}

export function countStage(node: SimNode, stages: StageMap, lane: Lane, stage: Stage): number {
  return itemIds(node).filter((id) => stages[id]?.[lane]?.[stage] === true).length;
}

export function renameNode(root: SimNode, id: string, name: string): SimNode {
  if (root.id === id) return { ...root, name };
  if (!root.children) return root;
  return { ...root, children: root.children.map((c) => renameNode(c, id, name)) };
}

export function addChild(root: SimNode, parentId: string, child: SimNode): SimNode {
  if (root.id === parentId) {
    return { ...root, children: [...(root.children ?? []), child] };
  }
  if (!root.children) return root;
  return { ...root, children: root.children.map((c) => addChild(c, parentId, child)) };
}

export function removeNode(root: SimNode, id: string): SimNode {
  if (id === ROOT_ID) return root;
  if (!root.children) return root;
  if (root.children.some((c) => c.id === id)) {
    return { ...root, children: root.children.filter((c) => c.id !== id) };
  }
  return { ...root, children: root.children.map((c) => removeNode(c, id)) };
}

export function l1Ids(root: SimNode): string[] {
  return (root.children ?? []).map((c) => c.id);
}

/** path length 1 = virtual root, 2 = L1, 3 = L2, 4 = L3 */
export function canAddChild(pathLen: number): boolean {
  return pathLen >= 1 && pathLen <= 3;
}

export function childKind(pathLen: number): SimNode["kind"] | null {
  if (pathLen === 1 || pathLen === 2) return "folder";
  if (pathLen === 3) return "item";
  return null;
}
