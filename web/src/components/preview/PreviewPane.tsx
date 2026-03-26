"use client";

import { useState } from "react";
import { RefreshCw, ExternalLink, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewPaneProps {
  port: number;
  containerServiceUrl: string;
}

export default function PreviewPane({
  port,
  containerServiceUrl,
}: PreviewPaneProps) {
  const [key, setKey] = useState(0);
  const previewUrl = port ? `http://localhost:${port}` : "";

  function refresh() {
    setKey((k) => k + 1);
  }

  if (!port) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-3 py-1 border-b border-border bg-background">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            Preview
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          <div className="text-center">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No preview available</p>
            <p className="text-xs mt-1">Run your app to see a preview</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-1 border-b border-border bg-background">
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          Preview
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2 font-mono">
            :{port}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={refresh}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => window.open(previewUrl, "_blank")}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex-1 bg-white">
        <iframe
          key={key}
          src={previewUrl}
          className="w-full h-full border-0"
          title="Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  );
}
