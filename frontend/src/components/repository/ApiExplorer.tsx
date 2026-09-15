import { useState, useMemo } from 'react'
import { Code2, Search, FileText, Info, CheckCircle2, ChevronRight, Filter } from 'lucide-react'
import {
  type RepositoryApiResult,
  type HttpMethod
} from '@/types/api.types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ApiExplorerProps {
  api?: RepositoryApiResult
}

function getMethodBadgeStyle(method: HttpMethod): string {
  switch (method) {
    case 'GET':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    case 'POST':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    case 'PUT':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    case 'PATCH':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30'
    case 'DELETE':
      return 'bg-destructive/10 text-destructive border-destructive/30'
    case 'OPTIONS':
    case 'HEAD':
    default:
      return 'bg-muted text-muted-foreground border-border/60'
  }
}

export function ApiExplorer({ api }: ApiExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL')
  const [expandedEndpointIdx, setExpandedEndpointIdx] = useState<number | null>(null)

  const frameworks = api?.frameworks || []
  const endpoints = api?.endpoints || []
  const specifications = api?.specifications || []
  const limitations = api?.limitations || []

  // Extract unique HTTP methods that actually exist in the detected endpoint data
  const availableMethods = useMemo(() => {
    const methodsSet = new Set<string>()
    endpoints.forEach((ep) => methodsSet.add(ep.method))
    return Array.from(methodsSet)
  }, [endpoints])

  // Filter endpoints by method & search query 100% in local state
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((ep) => {
      const matchesMethod = selectedMethod === 'ALL' || ep.method === selectedMethod
      const query = searchQuery.trim().toLowerCase()
      if (!query) return matchesMethod

      const matchesPath = ep.path.toLowerCase().includes(query)
      const matchesFramework = ep.framework?.toLowerCase().includes(query) || false
      const matchesEvidence = ep.evidence.toLowerCase().includes(query)

      return matchesMethod && (matchesPath || matchesFramework || matchesEvidence)
    })
  }, [endpoints, selectedMethod, searchQuery])

  if (!api) {
    return (
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-6 text-center text-xs text-muted-foreground font-mono">
          API detection payload unavailable for this analysis.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <Code2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                API Explorer
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Detected API endpoints and specifications from repository evidence.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {api.confidence && (
              <Badge variant="outline" className="text-[10px] font-mono capitalize border-border/80">
                Confidence: {api.confidence}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] font-mono border-border/80 text-muted-foreground">
              {endpoints.length} Endpoints
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Frameworks Bar */}
        {frameworks.length > 0 && (
          <div className="flex items-center flex-wrap gap-2 p-3 rounded-lg border border-border/40 bg-muted/20 text-xs">
            <span className="font-mono text-muted-foreground font-medium mr-1">
              Detected API Frameworks:
            </span>
            {frameworks.map((fw) => (
              <Badge
                key={fw}
                variant="secondary"
                className="text-[11px] font-mono bg-purple-500/10 text-purple-400 border-purple-500/30"
              >
                {fw}
              </Badge>
            ))}
          </div>
        )}

        {/* Search & HTTP Method Filters Toolbar */}
        {endpoints.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search routes by path, framework, or evidence file..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs h-9 font-mono bg-background border-border/80"
                />
              </div>

              {/* Method filter pills (only showing methods present in data) */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-mono text-muted-foreground mr-1 hidden md:inline">
                  <Filter className="h-3 w-3 inline mr-1" />
                  Filter:
                </span>
                <Button
                  variant={selectedMethod === 'ALL' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMethod('ALL')}
                  className="h-7 text-[11px] font-mono px-2.5"
                >
                  ALL ({endpoints.length})
                </Button>
                {availableMethods.map((m) => {
                  const count = endpoints.filter((ep) => ep.method === m).length
                  return (
                    <Button
                      key={m}
                      variant={selectedMethod === m ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedMethod(m)}
                      className="h-7 text-[11px] font-mono px-2.5"
                    >
                      {m} ({count})
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Endpoints Table / Card List */}
            <div className="rounded-lg border border-border/60 overflow-hidden bg-background">
              {filteredEndpoints.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground font-mono">
                  No matching endpoints found for current filter/search.
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {filteredEndpoints.map((endpoint, idx) => {
                    const isExpanded = expandedEndpointIdx === idx

                    return (
                      <div
                        key={`${endpoint.method}-${endpoint.path}-${idx}`}
                        className="p-3 hover:bg-muted/10 transition-colors text-xs space-y-2"
                      >
                        <div
                          onClick={() => setExpandedEndpointIdx(isExpanded ? null : idx)}
                          className="flex items-center justify-between gap-3 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <Badge
                              variant="outline"
                              className={`font-mono text-[10px] font-bold px-2 py-0.5 border shrink-0 ${getMethodBadgeStyle(
                                endpoint.method
                              )}`}
                            >
                              {endpoint.method}
                            </Badge>
                            <code className="font-mono text-xs font-semibold text-foreground truncate">
                              {endpoint.path}
                            </code>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {endpoint.framework && (
                              <Badge variant="outline" className="text-[10px] font-mono hidden sm:inline-flex">
                                {endpoint.framework}
                              </Badge>
                            )}

                            {endpoint.confidence && (
                              <Badge variant="secondary" className="text-[9px] font-mono capitalize hidden md:inline-flex">
                                {endpoint.confidence}
                              </Badge>
                            )}

                            <ChevronRight
                              className={`h-4 w-4 text-muted-foreground transition-transform ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                          </div>
                        </div>

                        {/* Evidence Row */}
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pl-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <FileText className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate">Evidence: {endpoint.evidence}</span>
                          </div>
                        </div>

                        {/* Expanded Endpoint Detail Drawer */}
                        {isExpanded && (
                          <div className="mt-2 p-3 rounded bg-muted/20 border border-border/40 space-y-2 font-mono text-xs animate-in fade-in duration-150">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-foreground flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                Route Details
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                Method: {endpoint.method}
                              </span>
                            </div>

                            <div className="space-y-1 text-[11px]">
                              <div>
                                <span className="text-muted-foreground font-semibold">Declared Path: </span>
                                <code className="text-emerald-400 font-bold">{endpoint.path}</code>
                              </div>
                              {endpoint.framework && (
                                <div>
                                  <span className="text-muted-foreground font-semibold">Framework: </span>
                                  <span className="text-foreground">{endpoint.framework}</span>
                                </div>
                              )}
                              <div>
                                <span className="text-muted-foreground font-semibold">Evidence Location: </span>
                                <code className="text-foreground">{endpoint.evidence}</code>
                              </div>
                              {endpoint.confidence && (
                                <div>
                                  <span className="text-muted-foreground font-semibold">Detection Confidence: </span>
                                  <span className="text-foreground capitalize">{endpoint.confidence}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Zero Endpoint Notice */}
        {endpoints.length === 0 && (
          <div className="p-4 rounded-lg border border-border/60 bg-muted/20 text-xs font-mono text-muted-foreground text-center">
            No API endpoints were detected in the inspected repository evidence.
          </div>
        )}

        {/* API Specifications List */}
        {specifications.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/40">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Detected API Specifications & Schema Files ({specifications.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {specifications.map((spec, idx) => (
                <div
                  key={`${spec.path}-${idx}`}
                  className="p-2.5 rounded-lg border border-border/60 bg-muted/10 flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <code className="font-mono text-emerald-400 font-medium block truncate">
                      {spec.path}
                    </code>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Type: {spec.type}
                    </span>
                  </div>
                  {spec.confidence && (
                    <Badge variant="outline" className="text-[9px] font-mono capitalize">
                      {spec.confidence}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Detection Scope & Limitations Alert */}
        {limitations.length > 0 && (
          <div className="p-3 rounded-lg border border-border/40 bg-muted/20 text-xs text-muted-foreground space-y-1">
            <span className="font-semibold text-foreground flex items-center gap-1.5 font-mono">
              <Info className="h-3.5 w-3.5 text-primary" />
              API Detection Scope & Limitations
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground">
              {limitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
