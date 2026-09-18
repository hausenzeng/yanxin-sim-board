import { useEffect } from "react";
import { ChevronsDownUp, ChevronsUpDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSimStore } from "@/lib/sim/store";
import { Board } from "./board";

function ChipMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="9" y="9" width="14" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13" y="13" width="6" height="6" rx="1" fill="currentColor" opacity="0.22" />
      <path
        d="M9 12.5H5M9 16H5M9 19.5H5M23 12.5h4M23 16h4M23 19.5h4M12.5 9V5M16 9V5M19.5 9V5M12.5 23v4M16 23v4M19.5 23v4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AppShell() {
  const expandAll = useSimStore((s) => s.expandAll);
  const collapseToRoot = useSimStore((s) => s.collapseToRoot);

  useEffect(() => {
    void useSimStore.persist.rehydrate();
  }, []);

  return (
    <TooltipProvider>
    <div className="flex min-h-dvh flex-col bg-background lg:h-dvh lg:overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ChipMark className="size-6" />
          </span>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <h1 className="font-display text-xl font-medium tracking-tight md:text-2xl">验芯</h1>
              <span className="text-sm text-muted-foreground">仿真看板</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button asChild size="default" variant="outline">
            <a href="/yanxin-sim-board.zip" download="yanxin-sim-board.zip">
              <Download />
              下载到本机
            </a>
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={expandAll} aria-label="展开全部">
            <ChevronsUpDown />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={collapseToRoot} aria-label="收起项目">
            <ChevronsDownUp />
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-4 pb-4 md:px-6">
        <Board />
      </div>
    </div>
    </TooltipProvider>
  );
}
