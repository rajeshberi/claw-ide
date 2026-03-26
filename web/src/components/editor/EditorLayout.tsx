"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import dynamic from "next/dynamic";
import FileExplorer from "./FileExplorer";
import FileTabs from "./FileTabs";
import PreviewPane from "@/components/preview/PreviewPane";
import { Play, Square, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const MonacoEditor = dynamic(() => import("./MonacoEditor"), { ssr: false });
const TerminalComponent = dynamic(
  () => import("@/components/terminal/Terminal"),
  { ssr: false }
);

interface FileTab {
  path: string;
  name: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  language: string;
}

interface EditorLayoutProps {
  containerId: string;
  containerServiceUrl: string;
  apiKey: string;
  port: number;
  template: string;
}

const TEMPLATE_RUN_COMMANDS: Record<string, string> = {
  nextjs: "npm run dev -- --hostname 0.0.0.0 --port 3000",
  "python-fastapi":
    "uvicorn main:app --host 0.0.0.0 --port 8000 --reload",
  blank: "",
};

export default function EditorLayout({
  containerId,
  containerServiceUrl,
  apiKey,
  port,
  template,
}: EditorLayoutProps) {
  const [tabs, setTabs] = useState<FileTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
  };

  const activeFile = tabs.find((t) => t.path === activeTab);

  async function openFile(path: string) {
    // Check if already open
    const existing = tabs.find((t) => t.path === path);
    if (existing) {
      setActiveTab(path);
      return;
    }

    try {
      const res = await fetch(
        `${containerServiceUrl}/files/${containerId}/read?path=${encodeURIComponent(path)}`,
        { headers }
      );
      if (!res.ok) return;
      const data = await res.json();
      const name = path.split("/").pop() || path;

      const newTab: FileTab = {
        path,
        name,
        content: data.content,
        originalContent: data.content,
        isDirty: false,
        language: "",
      };

      setTabs((prev) => [...prev, newTab]);
      setActiveTab(path);
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  }

  function closeTab(path: string) {
    setTabs((prev) => {
      const newTabs = prev.filter((t) => t.path !== path);
      if (activeTab === path) {
        setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null);
      }
      return newTabs;
    });
  }

  const handleEditorChange = useCallback(
    (value: string) => {
      if (!activeTab) return;

      setTabs((prev) =>
        prev.map((t) =>
          t.path === activeTab
            ? { ...t, content: value, isDirty: value !== t.originalContent }
            : t
        )
      );

      // Debounced auto-save
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          await fetch(
            `${containerServiceUrl}/files/${containerId}/write`,
            {
              method: "PUT",
              headers,
              body: JSON.stringify({ path: activeTab, content: value }),
            }
          );
          setTabs((prev) =>
            prev.map((t) =>
              t.path === activeTab
                ? { ...t, isDirty: false, originalContent: value }
                : t
            )
          );
        } catch (err) {
          console.error("Auto-save failed:", err);
        }
      }, 1000);
    },
    [activeTab, containerId, containerServiceUrl]
  );

  async function handleRun() {
    const command = TEMPLATE_RUN_COMMANDS[template];
    if (!command) return;

    setIsRunning(true);
    setShowPreview(true);

    try {
      // Run in background via exec (non-blocking)
      await fetch(
        `${containerServiceUrl}/containers/${containerId}/exec`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            command: `nohup ${command} > /tmp/app.log 2>&1 &`,
          }),
        }
      );
    } catch (err) {
      console.error("Failed to run:", err);
      setIsRunning(false);
    }
  }

  async function handleStop() {
    try {
      await fetch(
        `${containerServiceUrl}/containers/${containerId}/exec`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            command:
              "pkill -f 'npm run dev' ; pkill -f uvicorn ; pkill -f node ; true",
          }),
        }
      );
      setIsRunning(false);
    } catch (err) {
      console.error("Failed to stop:", err);
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          {template !== "blank" && (
            <>
              {!isRunning ? (
                <Button
                  size="sm"
                  onClick={handleRun}
                  className="h-7 text-xs gap-1.5"
                >
                  <Play className="h-3 w-3" />
                  Run
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleStop}
                  className="h-7 text-xs gap-1.5"
                >
                  <Square className="h-3 w-3" />
                  Stop
                </Button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {port > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPreview(!showPreview)}
              className="h-7 text-xs gap-1.5"
            >
              {showPreview ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
              Preview
            </Button>
          )}
        </div>
      </div>

      {/* Main IDE Layout */}
      <PanelGroup direction="horizontal" className="flex-1">
        {/* File Explorer */}
        <Panel defaultSize={18} minSize={12} maxSize={30}>
          <FileExplorer
            containerId={containerId}
            onFileSelect={openFile}
            selectedFile={activeTab}
            containerServiceUrl={containerServiceUrl}
            apiKey={apiKey}
          />
        </Panel>

        <PanelResizeHandle className="w-[1px] bg-border hover:bg-primary/50 transition-colors" />

        {/* Editor + Terminal */}
        <Panel defaultSize={showPreview ? 50 : 82}>
          <PanelGroup direction="vertical">
            {/* Editor */}
            <Panel defaultSize={65} minSize={30}>
              <div className="h-full flex flex-col">
                <FileTabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabSelect={setActiveTab}
                  onTabClose={closeTab}
                />
                <div className="flex-1">
                  {activeFile ? (
                    <MonacoEditor
                      value={activeFile.content}
                      language={activeFile.language}
                      onChange={handleEditorChange}
                      path={activeFile.path}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      <div className="text-center">
                        <p className="text-lg font-medium mb-1">ClawIDE</p>
                        <p className="text-xs">
                          Select a file from the explorer to start editing
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="h-[1px] bg-border hover:bg-primary/50 transition-colors" />

            {/* Terminal */}
            <Panel defaultSize={35} minSize={15}>
              <TerminalComponent
                containerId={containerId}
                containerServiceUrl={containerServiceUrl}
              />
            </Panel>
          </PanelGroup>
        </Panel>

        {/* Preview Panel */}
        {showPreview && (
          <>
            <PanelResizeHandle className="w-[1px] bg-border hover:bg-primary/50 transition-colors" />
            <Panel defaultSize={32} minSize={20}>
              <PreviewPane
                port={port}
                containerServiceUrl={containerServiceUrl}
              />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}
