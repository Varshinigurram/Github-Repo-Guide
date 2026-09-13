import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  Terminal,
  Code2,
  FolderGit2,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  Search,
  ExternalLink,
  Copy,
  Info
} from 'lucide-react'

export function App() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-950 selection:text-emerald-300">
        {/* Top Developer Navigation Header */}
        <header className="border-b border-slate-800 bg-slate-950/80 sticky top-0 z-40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                <Terminal className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-white font-mono">
                GitHub Repo Guide <span className="text-slate-500 text-xs font-normal">/ Design System</span>
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-[11px]">
                Step 13C Visual Language
              </Badge>
              <Badge variant="default" className="text-[11px]">
                Dark First Engine
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content Workspace Container */}
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">
          {/* Section 1: Intro / Branding Banner */}
          <div className="border-b border-slate-800/80 pb-6 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400">
              <Cpu className="w-4 h-4" />
              <span>REPOSITORY INTELLIGENCE WORKSPACE</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Visual Language & Technical Design Tokens
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
              Established design tokens, crisp monospace code presentation, restrained status indicators, 
              and foundational shadcn UI components built specifically for high-density developer analysis tooling.
            </p>
          </div>

          {/* Section 2: Typography & Code Presentation */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-emerald-400" />
                1. Typography & Monospace Path Formatting
              </h2>
              <span className="text-xs text-slate-500 font-mono">UI Sans + Code Monospace</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>San-Serif Text Hierarchy</CardTitle>
                  <CardDescription>Clean sans-serif for UI labels and documentation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500 font-mono">Page Title</span>
                    <h3 className="text-lg font-bold text-white">Repository Overview</h3>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-mono">Section Subheading</span>
                    <h4 className="text-sm font-semibold text-slate-200">Architecture Components & Routing</h4>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-mono">Body Paragraph</span>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Calculates a transparent 0–100 repository health score and constructs an evidence-grounded architecture graph derived from repository files.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monospace Path & Code Snippets</CardTitle>
                  <CardDescription>Formatted file paths, entry points, and bash commands</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500 font-mono block mb-1">File Path Tag</span>
                    <code className="px-2 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-emerald-400 inline-block">
                      src/services/repository-analysis.service.ts
                    </code>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 font-mono block mb-1">Command Line Snippet</span>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-slate-300 flex items-center justify-between">
                      <span className="text-slate-400">$ npm run build</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-100" onClick={handleCopy}>
                        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section 3: Buttons & Interactive States */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                2. Button System & Interactive States
              </h2>
              <span className="text-xs text-slate-500 font-mono">shadcn/ui Button Variants</span>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="default">
                    <Search className="w-3.5 h-3.5 mr-1.5" /> Primary Action
                  </Button>
                  <Button variant="secondary">
                    <FolderGit2 className="w-3.5 h-3.5 mr-1.5" /> Secondary Action
                  </Button>
                  <Button variant="outline">
                    <Code2 className="w-3.5 h-3.5 mr-1.5" /> Outline Action
                  </Button>
                  <Button variant="ghost">Ghost Action</Button>
                  <Button variant="destructive">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Destructive
                  </Button>
                  <Button variant="outline" size="icon">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button variant="default" disabled>
                    Disabled State
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Section 4: Input & Badges */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-400" />
                3. Input Controls & Semantic Badges
              </h2>
              <span className="text-xs text-slate-500 font-mono">Inputs & HTTP Badges</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Input States</CardTitle>
                  <CardDescription>Repository URL entry & validation feedback states</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1.5">Standard Input</label>
                    <Input placeholder="https://github.com/facebook/react" />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1.5">Invalid URL Input</label>
                    <Input isInvalid defaultValue="invalid-url" />
                    <span className="text-[11px] text-rose-400 font-mono mt-1 block">
                      Please enter a valid public GitHub URL
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Semantic Status & HTTP Badges</CardTitle>
                  <CardDescription>Compact badges for technologies, HTTP methods, and status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">TypeScript</Badge>
                    <Badge variant="secondary">React 19</Badge>
                    <Badge variant="outline">Tailwind v4</Badge>
                    <Badge variant="success">Strong (95/100)</Badge>
                    <Badge variant="warning">Fair (65/100)</Badge>
                    <Badge variant="destructive">Weak (30/100)</Badge>
                    <Badge variant="info">Evidence Cited</Badge>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="method" className="border-emerald-800/60 bg-emerald-950/60 text-emerald-300">
                      GET
                    </Badge>
                    <Badge variant="method" className="border-blue-800/60 bg-blue-950/60 text-blue-300">
                      POST
                    </Badge>
                    <Badge variant="method" className="border-amber-800/60 bg-amber-950/60 text-amber-300">
                      PUT
                    </Badge>
                    <Badge variant="method" className="border-rose-800/60 bg-rose-950/60 text-rose-300">
                      DELETE
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section 5: Information Panels, Tooltips & Skeletons */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-400" />
                4. Dense Information Panels & Loading Skeletons
              </h2>
              <span className="text-xs text-slate-500 font-mono">Layout & Tooltips</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Information Panel</CardTitle>
                    <CardDescription>Compact 1px bordered surface for repository metadata</CardDescription>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400">
                        <Info className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Evidence-grounded deterministic metadata panel</p>
                    </TooltipContent>
                  </Tooltip>
                </CardHeader>
                <CardContent className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Primary Framework</span>
                    <span className="text-slate-100 font-semibold">Express.js</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Evidence Path</span>
                    <span className="text-emerald-400">backend/package.json</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Determinism Level</span>
                    <span className="text-slate-100 font-semibold">100% In-Memory</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <span className="text-slate-500">Verified via Step 13C design system foundation</span>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Loading Skeleton States</CardTitle>
                  <CardDescription>Bounded skeleton placeholders for asynchronous operations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
      </div>
    </TooltipProvider>
  )
}

export default App
