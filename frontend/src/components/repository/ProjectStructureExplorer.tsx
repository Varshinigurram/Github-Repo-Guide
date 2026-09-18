import { useState, useMemo } from 'react'
import {
  Folder,
  FolderOpen,
  FileCode2,
  FileText,
  Search,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  ShieldCheck
} from 'lucide-react'
import {
  type RepositoryStructure,
  type RepositoryFileContents,
  type RepositoryEvidencePackage
} from '@/types/api.types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ProjectStructureExplorerProps {
  structure?: RepositoryStructure
  fileContents?: RepositoryFileContents
  evidence?: RepositoryEvidencePackage
  externalSelectedPath?: string | null
}

// Tree node definition for building visual hierarchy from flat paths
interface TreeNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  children?: Record<string, TreeNode>
}

function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null) return ''
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return bytes + ' B'
}

export function ProjectStructureExplorer({
  structure,
  fileContents,
  evidence,
  externalSelectedPath
}: ProjectStructureExplorerProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  const importantFiles = structure?.importantFiles || []
  const files = structure?.files || []
  const directories = structure?.directories || []
  const fetchedFiles = fileContents?.files || []

  // Pre-calculate evidence maps strictly derived from backend arrays
  const entryPointPaths = useMemo(() => new Set(evidence?.entryPoints?.map((e) => e.path) || []), [evidence])
  const configPaths = useMemo(() => new Set(evidence?.configFiles?.map((c) => c.path) || []), [evidence])
  const manifestPaths = useMemo(() => new Set(evidence?.manifestFiles?.map((m) => m.path) || []), [evidence])
  const docPaths = useMemo(() => new Set(evidence?.documentationFiles?.map((d) => d.path) || []), [evidence])

  // Build nested tree node map from directories and files
  const treeRoot = useMemo(() => {
    const root: Record<string, TreeNode> = {}

    // Helper to insert path into tree
    const insertPath = (pathStr: string, itemType: 'file' | 'directory', size?: number) => {
      const parts = pathStr.split('/').filter(Boolean)
      let current = root

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1
        const currentPath = parts.slice(0, index + 1).join('/')

        if (!current[part]) {
          current[part] = {
            name: part,
            path: currentPath,
            type: isLast ? itemType : 'directory',
            size: isLast ? size : undefined,
            children: isLast && itemType === 'file' ? undefined : {}
          }
        }
        if (!isLast && current[part].children) {
          current = current[part].children!
        }
      })
    }

    directories.forEach((dir) => insertPath(dir.path, 'directory'))
    files.forEach((file) => insertPath(file.path, 'file', file.size))

    return root
  }, [directories, files])

  // Filter tree nodes by search query 100% in local state
  const isSearchActive = searchQuery.trim().length > 0
  const filteredFiles = useMemo(() => {
    if (!isSearchActive) return []
    const q = searchQuery.trim().toLowerCase()
    return files.filter((f) => f.path.toLowerCase().includes(q))
  }, [files, searchQuery, isSearchActive])

  // Select externalSelectedPath or selectedPath or fallback
  const activeSelectedPath =
    selectedPath || externalSelectedPath || (importantFiles.length > 0 ? importantFiles[0] : files[0]?.path || null)

  // Find fetched file content evidence for active selected path
  const selectedContentEvidence = useMemo(() => {
    if (!activeSelectedPath) return null
    return fetchedFiles.find((f) => f.path === activeSelectedPath) || null
  }, [fetchedFiles, activeSelectedPath])

  const toggleDirectory = (dirPath: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(dirPath)) {
        next.delete(dirPath)
      } else {
        next.add(dirPath)
      }
      return next
    })
  }

  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getEvidenceBadge = (path: string) => {
    if (entryPointPaths.has(path)) {
      return (
        <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 border-emerald-500/30 text-emerald-400">
          Entry Point
        </Badge>
      )
    }
    if (configPaths.has(path)) {
      return (
        <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 border-blue-500/30 text-blue-400">
          Config
        </Badge>
      )
    }
    if (manifestPaths.has(path)) {
      return (
        <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 border-purple-500/30 text-purple-400">
          Manifest
        </Badge>
      )
    }
    if (docPaths.has(path)) {
      return (
        <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 border-amber-500/30 text-amber-400">
          Doc
        </Badge>
      )
    }
    return null
  }

  if (!structure) {
    return (
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-6 text-center text-xs text-muted-foreground font-mono">
          Structure data unavailable for this analysis.
        </CardContent>
      </Card>
    )
  }

  // Recursive Tree Node Renderer
  const renderTree = (nodesMap: Record<string, TreeNode>, depth = 0) => {
    const sortedKeys = Object.keys(nodesMap).sort((a, b) => {
      const nodeA = nodesMap[a]
      const nodeB = nodesMap[b]
      if (nodeA.type === nodeB.type) return nodeA.name.localeCompare(nodeB.name)
      return nodeA.type === 'directory' ? -1 : 1
    })

    return sortedKeys.map((key) => {
      const node = nodesMap[key]
      const isDir = node.type === 'directory'
      const isExpanded = expandedDirs.has(node.path) || isSearchActive
      const isSelected = activeSelectedPath === node.path

      return (
        <div key={node.path} style={{ paddingLeft: `${depth * 12}px` }}>
          <div
            onClick={() => {
              if (isDir) {
                toggleDirectory(node.path)
              } else {
                setSelectedPath(node.path)
              }
            }}
            className={`flex items-center justify-between p-1.5 rounded-md text-xs font-mono cursor-pointer transition-colors ${
              isSelected
                ? 'bg-primary/10 text-emerald-400 font-bold border border-primary/30'
                : 'hover:bg-muted/30 text-foreground'
            }`}
          >
            <div className="flex items-center gap-1.5 truncate min-w-0">
              {isDir ? (
                <>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  {isExpanded ? (
                    <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                  ) : (
                    <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="truncate font-semibold">{node.name}</span>
                </>
              ) : (
                <>
                  <span className="w-3.5 shrink-0" />
                  <FileCode2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{node.name}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {getEvidenceBadge(node.path)}
              {!isDir && node.size !== undefined && (
                <span className="text-[10px] text-muted-foreground font-normal">
                  {formatBytes(node.size)}
                </span>
              )}
            </div>
          </div>

          {isDir && isExpanded && node.children && renderTree(node.children, depth + 1)}
        </div>
      )
    })
  }

  return (
    <Card id="structure-explorer" className="border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Project Structure & Important Files
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Inspected repository hierarchy, important evidence files, and fetched code contents.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <Badge variant="outline" className="border-border/80 text-muted-foreground">
              {structure.returnedFiles} / {structure.totalFiles} Files Inspected
            </Badge>
            {structure.truncated && (
              <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                Tree Truncated
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Important Files Quick-Select Bar */}
        {importantFiles.length > 0 && (
          <div className="space-y-2 p-3 rounded-xl border border-border/40 bg-muted/20">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <h4 className="text-xs font-bold font-mono text-foreground uppercase tracking-wider">
                Identified Important Files ({importantFiles.length})
              </h4>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {importantFiles.map((path) => {
                const isSelected = activeSelectedPath === path
                const hasFetchedContent = fetchedFiles.some((f) => f.path === path && f.fetched)

                return (
                  <button
                    key={path}
                    type="button"
                    onClick={() => setSelectedPath(path)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary/20 text-emerald-400 border-primary font-bold shadow-xs'
                        : 'bg-background hover:bg-muted/40 text-foreground border-border/60'
                    }`}
                  >
                    <span>{path}</span>
                    {hasFetchedContent && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Two-Pane Workspace: Tree Explorer + File Content Viewer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Pane: Tree & Search */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold font-mono text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5 text-primary" />
                Repository Tree ({directories.length} dirs, {files.length} files)
              </h4>
            </div>

            {/* Tree Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search inspected files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8 font-mono bg-background border-border/80"
              />
            </div>

            {/* Tree Container */}
            <div className="rounded-lg border border-border/60 bg-background p-2 max-h-[480px] overflow-y-auto space-y-0.5">
              {isSearchActive ? (
                filteredFiles.length === 0 ? (
                  <p className="text-xs font-mono text-muted-foreground p-3 text-center">
                    No matching files found in inspected evidence.
                  </p>
                ) : (
                  filteredFiles.map((file) => (
                    <div
                      key={file.path}
                      onClick={() => setSelectedPath(file.path)}
                      className={`flex items-center justify-between p-1.5 rounded text-xs font-mono cursor-pointer ${
                        activeSelectedPath === file.path
                          ? 'bg-primary/10 text-emerald-400 font-bold border border-primary/30'
                          : 'hover:bg-muted/30 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileCode2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{file.path}</span>
                      </div>
                      {getEvidenceBadge(file.path)}
                    </div>
                  ))
                )
              ) : Object.keys(treeRoot).length === 0 ? (
                <p className="text-xs font-mono text-muted-foreground p-3 text-center">
                  No repository files returned in inspected evidence.
                </p>
              ) : (
                renderTree(treeRoot)
              )}
            </div>
          </div>

          {/* Right Pane: Fetched File Content Viewer */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold font-mono text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Fetched Code Content Viewer
              </h4>
              {selectedContentEvidence?.content && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyContent(selectedContentEvidence.content!)}
                  className="h-7 text-xs font-mono gap-1.5 px-2.5"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Content</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Active Selected File Header */}
            {activeSelectedPath ? (
              <div className="rounded-lg border border-border/60 bg-background overflow-hidden space-y-0">
                <div className="p-3 border-b border-border/60 bg-muted/20 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <FileCode2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <code className="text-xs font-bold font-mono text-foreground truncate">
                      {activeSelectedPath}
                    </code>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    {getEvidenceBadge(activeSelectedPath)}
                    {selectedContentEvidence?.size && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatBytes(selectedContentEvidence.size)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Box / Unavailable Notice */}
                {selectedContentEvidence && selectedContentEvidence.content ? (
                  <div className="space-y-0">
                    {selectedContentEvidence.truncated && (
                      <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-[11px] font-mono flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>File content was truncated due to analysis size limits.</span>
                      </div>
                    )}
                    <pre className="p-4 font-mono text-xs leading-relaxed text-slate-100 bg-slate-950 overflow-x-auto max-h-[420px] whitespace-pre selection:bg-emerald-950 selection:text-emerald-300">
                      <code>{selectedContentEvidence.content}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="p-8 text-center space-y-2">
                    <ShieldCheck className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                    <p className="text-xs font-mono text-foreground font-semibold">
                      File content was not included in the inspected evidence package.
                    </p>
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      {selectedContentEvidence?.skipReason ||
                        'The backend analyzer selects key important files for content inspection to remain within bounds.'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center border border-border/60 rounded-lg bg-background text-xs font-mono text-muted-foreground">
                Select a file from the tree or important files list to view its evidence content.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
