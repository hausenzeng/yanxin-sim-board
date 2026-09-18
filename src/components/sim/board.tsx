import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LANES,
  STAGE_LABEL,
  STAGES,
  LANE_LABEL,
  ROOT_ID,
  emptyPair,
  type Lane,
  type LaneMarks,
  type SimNode,
  type Stage,
  type StageMap,
} from "@/lib/sim/types";
import { canAddChild, childKind, countStage, findPath, visibleRows } from "@/lib/sim/tree";
import { useSimStore } from "@/lib/sim/store";

function CheckMark({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "flex size-5 items-center justify-center rounded-xs border transition-colors duration-150",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card",
      )}
      aria-hidden
    >
      {checked ? <Check className="size-3.5" strokeWidth={3} /> : null}
    </span>
  );
}

function IconTip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function DirLabel({
  node,
  depth,
  open,
  editing,
  onToggle,
  onStartEdit,
  onCommit,
  onCancel,
  onAdd,
  onRemove,
}: {
  node: SimNode;
  depth: number;
  open: boolean;
  editing: boolean;
  onToggle: () => void;
  onStartEdit: () => void;
  onCommit: (name: string) => void;
  onCancel: () => void;
  onAdd?: () => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(node.name);

  useEffect(() => {
    if (!editing) return;
    setDraft(node.name);
    const el = inputRef.current;
    if (!el || el.offsetParent === null) return;
    el.focus();
    el.select();
  }, [editing, node.name]);

  const pad = 8 + depth * 16;

  return (
    <div className="group relative flex min-h-11 items-center gap-0.5 pr-1" style={{ paddingLeft: `${pad}px` }}>
      {node.kind === "folder" ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex size-11 shrink-0 items-center justify-center rounded-sm hover:bg-accent"
          aria-label={open ? "收起" : "展开"}
        >
          <ChevronRight
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-150",
              open && "rotate-90",
            )}
          />
        </button>
      ) : (
        <span className="size-11 shrink-0" />
      )}

      {editing ? (
        <Input
          ref={inputRef}
          value={draft}
          aria-label="项目名称"
          className="h-9 min-w-0 flex-1 px-2 font-mono text-sm shadow-none"
          onChange={(e) => setDraft(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onBlur={() => onCommit(draft)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
        />
      ) : (
        <div className="relative min-w-0">
          <button
            type="button"
            onClick={onStartEdit}
            className={cn(
              "max-w-full rounded-sm px-1 py-2 text-left hover:bg-accent",
              node.kind === "folder" ? "font-medium" : "font-mono text-sm font-normal",
            )}
            title={node.name}
          >
            {node.name}
          </button>
          <div className="flex shrink-0 md:absolute md:top-1/2 md:left-full md:z-10 md:-translate-y-1/2 md:bg-card md:opacity-0 md:pointer-events-none md:group-hover:pointer-events-auto md:group-hover:opacity-100">
            {onAdd ? (
              <IconTip label={depth < 1 ? "添加二级目录" : "添加三级 case"}>
                <Button type="button" size="icon" variant="ghost" aria-label="添加子项" onClick={onAdd}>
                  <Plus />
                </Button>
              </IconTip>
            ) : null}
            <IconTip label="重命名">
              <Button type="button" size="icon" variant="ghost" aria-label="重命名" onClick={onStartEdit}>
                <Pencil />
              </Button>
            </IconTip>
            <IconTip label="删除">
              <Button type="button" size="icon" variant="ghost" aria-label="删除" onClick={onRemove}>
                <Trash2 />
              </Button>
            </IconTip>
          </div>
        </div>
      )}
    </div>
  );
}

function StageCell({
  id,
  lane,
  stage,
  active,
  onSelect,
}: {
  id: string;
  lane: Lane;
  stage: Stage;
  active: boolean;
  onSelect: (id: string, lane: Lane, stage: Stage) => void;
}) {
  return (
    <td
      className={cn(
        "board-cell",
        lane === "pre" ? "lane-pre" : "lane-post",
        lane === "post" && stage === "idle" && "lane-split",
      )}
    >
      <button
        type="button"
        aria-label={`${LANE_LABEL[lane]} ${STAGE_LABEL[stage]}`}
        aria-pressed={active}
        onClick={() => onSelect(id, lane, stage)}
        className="mx-auto flex size-11 items-center justify-center rounded-sm hover:bg-accent/80"
      >
        <CheckMark checked={active} />
      </button>
    </td>
  );
}

function CountCell({
  value,
  lane,
  stage,
}: {
  value: number;
  lane: Lane;
  stage: Stage;
}) {
  return (
    <td
      className={cn(
        "board-cell",
        lane === "pre" ? "lane-pre" : "lane-post",
        lane === "post" && stage === "idle" && "lane-split",
      )}
    >
      <span
        className={cn(
          "flex min-h-11 items-center justify-center text-xs tabular-nums",
          value === 0 ? "text-border" : "text-muted-foreground",
          value > 0 && stage === "running" && "text-run",
          value > 0 && stage === "done" && "text-pass",
        )}
      >
        {value || "—"}
      </span>
    </td>
  );
}

function LanePicker({
  id,
  lane,
  value,
  onSelect,
}: {
  id: string;
  lane: Lane;
  value: LaneMarks;
  onSelect: (id: string, lane: Lane, stage: Stage) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{LANE_LABEL[lane]}</p>
      <div className="mt-1 grid grid-cols-3 gap-1">
        {STAGES.map((stage) => {
          const active = value[stage];
          return (
            <button
              key={stage}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(id, lane, stage)}
              className={cn(
                "flex h-11 items-center justify-center gap-1.5 rounded-sm px-1 text-xs font-medium transition-colors duration-150",
                active ? "bg-primary/8 text-foreground" : "bg-secondary text-muted-foreground",
              )}
            >
              <CheckMark checked={active} />
              {STAGE_LABEL[stage]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function useDirEditor() {
  const root = useSimStore((s) => s.root);
  const addChild = useSimStore((s) => s.addChild);
  const rename = useSimStore((s) => s.rename);
  const remove = useSimStore((s) => s.remove);
  const [editingId, setEditingId] = useState<string | null>(null);

  function canAdd(id: string) {
    const path = findPath(root, id);
    if (!path) return false;
    return canAddChild(path.length) && childKind(path.length) !== null;
  }

  function handleAdd(parentId: string) {
    const id = addChild(parentId);
    if (id) setEditingId(id);
  }

  return {
    editingId,
    setEditingId,
    rename,
    remove,
    handleAdd,
    canAdd,
    addL1: () => handleAdd(ROOT_ID),
  };
}

function MobileList({
  rows,
  stages,
  expanded,
  toggle,
  setStage,
  editor,
}: {
  rows: ReturnType<typeof visibleRows>;
  stages: StageMap;
  expanded: Record<string, boolean>;
  toggle: (id: string) => void;
  setStage: (id: string, lane: Lane, stage: Stage) => void;
  editor: ReturnType<typeof useDirEditor>;
}) {
  return (
    <div className="flex flex-col gap-1 p-2 md:hidden">
      {rows.map(({ node, depth }) => {
        const open = node.kind === "folder" && expanded[node.id];
        const pair = stages[node.id] ?? emptyPair();
        return (
          <div key={node.id}>
            <DirLabel
              node={node}
              depth={depth}
              open={!!open}
              editing={editor.editingId === node.id}
              onToggle={() => toggle(node.id)}
              onStartEdit={() => editor.setEditingId(node.id)}
              onCommit={(name) => {
                editor.rename(node.id, name);
                editor.setEditingId(null);
              }}
              onCancel={() => editor.setEditingId(null)}
              onAdd={editor.canAdd(node.id) ? () => editor.handleAdd(node.id) : undefined}
              onRemove={() => editor.remove(node.id)}
            />
            {node.kind === "item" ? (
              <div
                className="rounded-md bg-secondary/60 px-3 py-3"
                style={{ marginLeft: `${12 + depth * 8}px` }}
              >
                <div className="flex flex-col gap-3">
                  {LANES.map((lane) => (
                    <LanePicker
                      key={lane}
                      id={node.id}
                      lane={lane}
                      value={pair[lane]}
                      onSelect={setStage}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function Board() {
  const root = useSimStore((s) => s.root);
  const stages = useSimStore((s) => s.stages);
  const expanded = useSimStore((s) => s.expanded);
  const setStage = useSimStore((s) => s.setStage);
  const toggle = useSimStore((s) => s.toggle);
  const editor = useDirEditor();
  const rows = visibleRows(root, expanded);

  return (
    <div className="board-wrap min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto rounded-xl bg-card shadow-[var(--shadow-border)]">
      <div className="hidden md:block">
        <table className="board-table">
          <colgroup>
            <col className="board-col-name" />
            {LANES.flatMap((lane) =>
              STAGES.map((stage) => (
                <col key={`${lane}-${stage}`} className="board-col-stage" />
              )),
            )}
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2} className="board-name board-head">
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <span>项目</span>
                  <IconTip label="添加一级目录">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="添加一级目录"
                      onClick={editor.addL1}
                    >
                      <Plus />
                    </Button>
                  </IconTip>
                </div>
              </th>
              {LANES.map((lane) => (
                <th
                  key={lane}
                  colSpan={3}
                  className={cn(
                    "board-head board-group",
                    lane === "pre" ? "lane-pre" : "lane-post",
                    lane === "post" && "lane-split",
                  )}
                >
                  {LANE_LABEL[lane]}
                </th>
              ))}
            </tr>
            <tr>
              {LANES.map((lane) =>
                STAGES.map((stage) => (
                  <th
                    key={`${lane}-${stage}`}
                    className={cn(
                      "board-head board-sub",
                      lane === "pre" ? "lane-pre" : "lane-post",
                      lane === "post" && stage === "idle" && "lane-split",
                    )}
                  >
                    {STAGE_LABEL[stage]}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ node, depth }) => {
              const open = node.kind === "folder" && expanded[node.id];
              const pair = stages[node.id];
              return (
                <tr key={node.id} className="board-row">
                  <th scope="row" className="board-name">
                    <DirLabel
                      node={node}
                      depth={depth}
                      open={!!open}
                      editing={editor.editingId === node.id}
                      onToggle={() => toggle(node.id)}
                      onStartEdit={() => editor.setEditingId(node.id)}
                      onCommit={(name) => {
                        editor.rename(node.id, name);
                        editor.setEditingId(null);
                      }}
                      onCancel={() => editor.setEditingId(null)}
                      onAdd={editor.canAdd(node.id) ? () => editor.handleAdd(node.id) : undefined}
                      onRemove={() => editor.remove(node.id)}
                    />
                  </th>
                  {node.kind === "folder"
                    ? LANES.flatMap((lane) =>
                        STAGES.map((stage) => (
                          <CountCell
                            key={`${node.id}-${lane}-${stage}`}
                            value={countStage(node, stages, lane, stage)}
                            lane={lane}
                            stage={stage}
                          />
                        )),
                      )
                    : LANES.flatMap((lane) =>
                        STAGES.map((stage) => (
                          <StageCell
                            key={`${node.id}-${lane}-${stage}`}
                            id={node.id}
                            lane={lane}
                            stage={stage}
                            active={!!pair?.[lane]?.[stage]}
                            onSelect={setStage}
                          />
                        )),
                      )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-2 py-1 md:hidden">
        <span className="px-2 text-sm font-medium">项目</span>
        <Button type="button" size="default" variant="ghost" onClick={editor.addL1}>
          <Plus />
          一级目录
        </Button>
      </div>
      <MobileList
        rows={rows}
        stages={stages}
        expanded={expanded}
        toggle={toggle}
        setStage={setStage}
        editor={editor}
      />
    </div>
  );
}
