"use client";

import { useRef, useCallback } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

interface MonacoEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  path: string;
}

function getLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const langMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescriptreact",
    js: "javascript",
    jsx: "javascriptreact",
    py: "python",
    json: "json",
    md: "markdown",
    css: "css",
    scss: "scss",
    html: "html",
    yml: "yaml",
    yaml: "yaml",
    sh: "shell",
    bash: "shell",
    dockerfile: "dockerfile",
    toml: "toml",
    xml: "xml",
    sql: "sql",
    graphql: "graphql",
    env: "plaintext",
    txt: "plaintext",
    gitignore: "plaintext",
  };
  return langMap[ext] || "plaintext";
}

export default function MonacoEditor({
  value,
  language,
  onChange,
  path,
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const detectedLang = language || getLanguageFromPath(path);

  return (
    <Editor
      height="100%"
      language={detectedLang}
      value={value}
      theme="vs-dark"
      onChange={(val) => onChange(val || "")}
      onMount={handleEditorDidMount}
      options={{
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, monospace",
        fontLigatures: true,
        minimap: { enabled: true, maxColumn: 80 },
        lineNumbers: "on",
        renderLineHighlight: "all",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on",
        bracketPairColorization: { enabled: true },
        padding: { top: 8 },
        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
      }}
      loading={
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Loading editor...
        </div>
      }
    />
  );
}

export { getLanguageFromPath };
