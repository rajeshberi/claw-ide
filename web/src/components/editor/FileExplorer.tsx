"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Plus,
  FolderPlus,
  Trash2,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FileItem {
  path: string;
  absolute_path: string;
  is_directory: boolean;
  name: string;
}

interface TreeNode {
  name: string;
  path: string;
  absolutePath: string;
  isDirectory: boolean;
  children: TreeNode[];
}

interface FileExplorerProps {
  containerId: string;
  onFileSelect: (path: string) => void;
  selectedFile: string | null;
  containerServiceUrl: string;
  apiKey: string;
}

function buildTree(files: FileItem[]): TreeNode[] {
  const root: TreeNode[] = [];
  const map = new Map<string, TreeNode>();

  // Sort: directories first, then alphabetical
  const sorted = [...files].sort((a, b) => {
    if (a.is_directory !== b.is_directory) return a.is_directory ? -1 : 1;
    return a.path.localeCompare(b.path);
  });

  for (const file of sorted) {
    const parts = file.path.split("/");
    const node: TreeNode = {
      name: file.name,
      path: file.path,
      absolutePath: file.absolute_path,
      isDirectory: file.is_directory,
      children: [],
    };
    map.set(file.path, node);

    if (parts.length === 1) {
      root.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join("/");
      const parent = map.get(parentPath);
      if (parent) {
        parent.children.push(node);
      } else {
        root.push(node);
      }
    }
  }

  return root;
}

function TreeItem({
  node,
  depth,
  onFileSelect,
  selectedFile,
  onDelete,
  onRename,
}: {
  node: TreeNode;
  depth: number;
  onFileSelect: (path: string) => void;
  selectedFile: string | null;
  onDelete: (path: string) => void;
  onRename: (oldPath: string, newName: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(node.name);
  const [showActions, setShowActions] = useState(false);
  const isSelected = selectedFile === node.absolutePath;

  function handleClick() {
    if (node.isDirectory) {
      setExpanded(!expanded);
    } else {
      onFileSelect(node.absolutePath);
    }
  }

  function handleRename() {
    if (renameValue.trim() && renameValue !== node.name) {
      onRename(node.absolutePath, renameValue.trim());
    }
    setIsRenaming(false);
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-0.5 cursor-pointer text-sm hover:bg-secondary/50 group",
          isSelected && "bg-primary/10 text-primary"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {node.isDirectory ? (
          <>
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            {expanded ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-blue-400" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-blue-400" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            <File className="h-4 w-4 shrink-0 text-muted-foreground" />
          </>
        )}

        {isRenaming ? (
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") setIsRenaming(false);
            }}
            onBlur={handleRename}
            className="h-5 text-xs py-0 px-1"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate text-xs">{node.name}</span>
        )}

        {showActions && !isRenaming && (
          <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
            <button
              className="p-0.5 hover:bg-secondary rounded"
              onClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
                setRenameValue(node.name);
              }}
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              className="p-0.5 hover:bg-secondary rounded text-red-400"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.absolutePath);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {node.isDirectory && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FileExplorer({
  containerId,
  onFileSelect,
  selectedFile,
  containerServiceUrl,
  apiKey,
}: FileExplorerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [newItemType, setNewItemType] = useState<"file" | "folder" | null>(
    null
  );

  const headers = {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
  };

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch(
        `${containerServiceUrl}/files/${containerId}/tree`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files);
        setTree(buildTree(data.files));
      }
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setLoading(false);
    }
  }, [containerId, containerServiceUrl]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  async function handleDelete(path: string) {
    if (!confirm(`Delete ${path}?`)) return;
    try {
      await fetch(
        `${containerServiceUrl}/files/${containerId}/delete?path=${encodeURIComponent(path)}`,
        { method: "DELETE", headers }
      );
      fetchFiles();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  }

  async function handleRename(oldPath: string, newName: string) {
    const parts = oldPath.split("/");
    parts[parts.length - 1] = newName;
    const newPath = parts.join("/");
    try {
      await fetch(
        `${containerServiceUrl}/files/${containerId}/rename`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ old_path: oldPath, new_path: newPath }),
        }
      );
      fetchFiles();
    } catch (err) {
      console.error("Failed to rename:", err);
    }
  }

  async function handleCreateItem() {
    if (!newItemName.trim() || !newItemType) return;
    const basePath = "/home/coder/project";
    const fullPath = `${basePath}/${newItemName.trim()}`;

    try {
      if (newItemType === "folder") {
        await fetch(
          `${containerServiceUrl}/files/${containerId}/mkdir`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ path: fullPath }),
          }
        );
      } else {
        await fetch(
          `${containerServiceUrl}/files/${containerId}/write`,
          {
            method: "PUT",
            headers,
            body: JSON.stringify({ path: fullPath, content: "" }),
          }
        );
      }
      setNewItemName("");
      setNewItemType(null);
      fetchFiles();
    } catch (err) {
      console.error("Failed to create:", err);
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            className="p-1 hover:bg-secondary rounded"
            onClick={() => setNewItemType("file")}
            title="New File"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1 hover:bg-secondary rounded"
            onClick={() => setNewItemType("folder")}
            title="New Folder"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1 hover:bg-secondary rounded"
            onClick={fetchFiles}
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* New item input */}
      {newItemType && (
        <div className="px-2 py-1 border-b border-border flex items-center gap-1">
          {newItemType === "folder" ? (
            <Folder className="h-4 w-4 text-blue-400 shrink-0" />
          ) : (
            <File className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <Input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateItem();
              if (e.key === "Escape") {
                setNewItemType(null);
                setNewItemName("");
              }
            }}
            placeholder={
              newItemType === "folder" ? "folder name" : "file name"
            }
            className="h-6 text-xs py-0 px-1"
            autoFocus
          />
        </div>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-auto py-1">
        {loading ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            Loading files...
          </div>
        ) : tree.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            No files yet
          </div>
        ) : (
          tree.map((node) => (
            <TreeItem
              key={node.path}
              node={node}
              depth={0}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          ))
        )}
      </div>
    </div>
  );
}
