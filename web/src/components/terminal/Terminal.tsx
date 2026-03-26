"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal as XTermTerminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

interface TerminalProps {
  containerId: string;
  containerServiceUrl: string;
}

export default function Terminal({
  containerId,
  containerServiceUrl,
}: TerminalProps) {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTermTerminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!termRef.current || !containerId) return;

    const term = new XTermTerminal({
      theme: {
        background: "#0a0e1a",
        foreground: "#d4d4d8",
        cursor: "#3b82f6",
        selectionBackground: "#3b82f640",
        black: "#0a0e1a",
        red: "#f87171",
        green: "#4ade80",
        yellow: "#facc15",
        blue: "#60a5fa",
        magenta: "#c084fc",
        cyan: "#22d3ee",
        white: "#d4d4d8",
        brightBlack: "#52525b",
        brightRed: "#fca5a5",
        brightGreen: "#86efac",
        brightYellow: "#fde047",
        brightBlue: "#93c5fd",
        brightMagenta: "#d8b4fe",
        brightCyan: "#67e8f9",
        brightWhite: "#fafafa",
      },
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, monospace",
      cursorBlink: true,
      cursorStyle: "block",
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Connect WebSocket
    const wsUrl = containerServiceUrl.replace("http", "ws");
    const ws = new WebSocket(`${wsUrl}/ws/terminal/${containerId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      term.writeln("\x1b[1;34m--- ClawIDE Terminal Connected ---\x1b[0m\r");
    };

    ws.onmessage = (event) => {
      term.write(event.data);
    };

    ws.onclose = () => {
      setConnected(false);
      term.writeln("\r\n\x1b[1;31m--- Disconnected ---\x1b[0m");
    };

    ws.onerror = () => {
      setConnected(false);
      term.writeln("\r\n\x1b[1;31m--- Connection Error ---\x1b[0m");
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch {}
    });
    resizeObserver.observe(termRef.current);

    return () => {
      resizeObserver.disconnect();
      ws.close();
      term.dispose();
    };
  }, [containerId, containerServiceUrl]);

  return (
    <div className="h-full flex flex-col bg-[#0a0e1a]">
      <div className="flex items-center justify-between px-3 py-1 border-b border-border bg-background">
        <span className="text-xs font-semibold uppercase text-muted-foreground">
          Terminal
        </span>
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-xs text-muted-foreground">
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
      <div ref={termRef} className="flex-1 overflow-hidden" />
    </div>
  );
}
