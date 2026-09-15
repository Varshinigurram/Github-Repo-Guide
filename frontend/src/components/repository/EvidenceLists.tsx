import { FolderGit2, FileCode2, FileText, Settings, BookOpen, Layers } from 'lucide-react'
import {
  type EntryPointEvidence,
  type ConfigFileEvidence,
  type ManifestEvidence,
  type DocEvidence
} from '@/types/api.types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface EvidenceListsProps {
  entryPoints?: EntryPointEvidence[]
  configFiles?: ConfigFileEvidence[]
  manifestFiles?: ManifestEvidence[]
  documentationFiles?: DocEvidence[]
  importantFiles?: string[]
}

export function EvidenceLists({
  entryPoints = [],
  configFiles = [],
  manifestFiles = [],
  documentationFiles = [],
  importantFiles = []
}: EvidenceListsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-1 border-b border-border/40">
        <FolderGit2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">
          Repository Evidence & Identified Artifacts
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Entry Points */}
        <Card className="border-border/60 bg-card shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 font-mono">
                <FileCode2 className="h-4 w-4 text-emerald-400" />
                Entry Points ({entryPoints.length})
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Candidate execution entry point files detected in evidence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {entryPoints.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono italic p-3 rounded-md bg-muted/20 border border-border/40">
                No entry points detected in the inspected evidence.
              </p>
            ) : (
              <ul className="space-y-2">
                {entryPoints.map((ep, idx) => (
                  <li
                    key={`${ep.path}-${idx}`}
                    className="p-2.5 rounded-md border border-border/60 bg-muted/20 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <code className="text-xs font-mono text-emerald-400 font-semibold truncate max-w-xs">
                        {ep.path}
                      </code>
                      {ep.source && (
                        <Badge variant="outline" className="text-[9px] font-mono">
                          {ep.source}
                        </Badge>
                      )}
                    </div>
                    {ep.reason && (
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {ep.reason}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Configuration Files */}
        <Card className="border-border/60 bg-card shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 font-mono">
              <Settings className="h-4 w-4 text-blue-400" />
              Configuration Files ({configFiles.length})
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Environment, linter, TypeScript, and build configs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {configFiles.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono italic p-3 rounded-md bg-muted/20 border border-border/40">
                No configuration files detected in the inspected evidence.
              </p>
            ) : (
              <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {configFiles.map((cfg, idx) => (
                  <li
                    key={`${cfg.path}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-md border border-border/40 bg-muted/10 text-xs"
                  >
                    <code className="font-mono text-foreground font-medium truncate max-w-xs">
                      {cfg.path}
                    </code>
                    <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                      {cfg.type}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Dependency Manifests */}
        <Card className="border-border/60 bg-card shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 font-mono">
              <FileText className="h-4 w-4 text-purple-400" />
              Manifest Files ({manifestFiles.length})
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Package manifests and lockfiles (package.json, Cargo.toml, pyproject.toml, etc.).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {manifestFiles.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono italic p-3 rounded-md bg-muted/20 border border-border/40">
                No manifest files detected in the inspected evidence.
              </p>
            ) : (
              <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {manifestFiles.map((man, idx) => (
                  <li
                    key={`${man.path}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-md border border-border/40 bg-muted/10 text-xs"
                  >
                    <code className="font-mono text-foreground font-medium truncate max-w-xs">
                      {man.path}
                    </code>
                    <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                      {man.type}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Documentation Files */}
        <Card className="border-border/60 bg-card shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 font-mono">
              <BookOpen className="h-4 w-4 text-amber-400" />
              Documentation Files ({documentationFiles.length})
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              README, CONTRIBUTING, LICENSE, and documentation markdowns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documentationFiles.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono italic p-3 rounded-md bg-muted/20 border border-border/40">
                No documentation files detected in the inspected evidence.
              </p>
            ) : (
              <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {documentationFiles.map((doc, idx) => (
                  <li
                    key={`${doc.path}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-md border border-border/40 bg-muted/10 text-xs"
                  >
                    <code className="font-mono text-foreground font-medium truncate max-w-xs">
                      {doc.path}
                    </code>
                    <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                      {doc.type}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Important Files List Banner */}
      {importantFiles && importantFiles.length > 0 && (
        <Card className="border-border/60 bg-card shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 font-mono">
              <Layers className="h-4 w-4 text-primary" />
              Identified Important Files ({importantFiles.length})
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Key source files selected for deep evidence content inspection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              {importantFiles.map((path) => (
                <code
                  key={path}
                  className="px-2.5 py-1 rounded bg-muted/20 border border-border/60 font-mono text-xs text-emerald-400"
                >
                  {path}
                </code>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
