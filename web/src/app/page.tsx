"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Code2, Terminal, Users, Zap } from "lucide-react";

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">ClawIDE</span>
        </div>
        <div className="flex gap-3">
          <a
            href="/sign-in"
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </a>
          <a
            href="/sign-up"
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Your Organization&apos;s
            <br />
            <span className="text-primary">Cloud IDE</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Code, collaborate, and deploy from your browser. ClawIDE gives your
            team instant development environments with zero setup.
          </p>
          <a
            href="/sign-up"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Zap className="h-5 w-5" />
            Start Coding Now
          </a>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
          <div className="p-6 rounded-lg border border-border bg-card">
            <Code2 className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Full IDE in Browser</h3>
            <p className="text-muted-foreground text-sm">
              Monaco editor with IntelliSense, file explorer, integrated
              terminal — everything you need to code.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card">
            <Users className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Multi-Tenant Teams</h3>
            <p className="text-muted-foreground text-sm">
              Organization-scoped projects with role-based access. Your team
              sees only what they should.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-border bg-card">
            <Terminal className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Instant Environments</h3>
            <p className="text-muted-foreground text-sm">
              Spin up isolated Docker containers with pre-configured runtimes
              for Node.js and Python.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
