"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileTab {
  path: string;
  name: string;
  isDirty: boolean;
}

interface FileTabsProps {
  tabs: FileTab[];
  activeTab: string | null;
  onTabSelect: (path: string) => void;
  onTabClose: (path: string) => void;
}

export default function FileTabs({
  tabs,
  activeTab,
  onTabSelect,
  onTabClose,
}: FileTabsProps) {
  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center bg-background border-b border-border overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.path}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 text-xs border-r border-border cursor-pointer group min-w-0 shrink-0",
            activeTab === tab.path
              ? "bg-card text-foreground border-b-2 border-b-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          )}
          onClick={() => onTabSelect(tab.path)}
        >
          <span className="truncate max-w-[120px]">
            {tab.isDirty && (
              <span className="text-primary mr-1">*</span>
            )}
            {tab.name}
          </span>
          <button
            className="opacity-0 group-hover:opacity-100 hover:bg-secondary rounded p-0.5 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.path);
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
