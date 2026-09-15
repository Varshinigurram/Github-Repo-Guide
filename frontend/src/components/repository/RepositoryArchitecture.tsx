import { useState, useRef, useEffect } from 'react'
import { Layers, Cpu, Code2, Database, Server, Shield, Globe, Box, Wrench, Info, CheckCircle2 } from 'lucide-react'
import {
  type RepositoryArchitectureResult,
  type ArchitectureNode,
  type ArchitectureNodeType
} from '@/types/api.types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface RepositoryArchitectureProps {
  architecture?: RepositoryArchitectureResult
}

function getNodeIcon(type: ArchitectureNodeType) {
  switch (type) {
    case 'frontend':
      return <Globe className="h-4 w-4 text-blue-400" />
    case 'backend':
    case 'api':
      return <Server className="h-4 w-4 text-emerald-400" />
    case 'database':
    case 'storage':
      return <Database className="h-4 w-4 text-purple-400" />
    case 'cache':
    case 'queue':
      return <Cpu className="h-4 w-4 text-amber-400" />
    case 'worker':
      return <Wrench className="h-4 w-4 text-indigo-400" />
    case 'authentication':
      return <Shield className="h-4 w-4 text-pink-400" />
    case 'build':
    case 'deployment':
      return <Box className="h-4 w-4 text-cyan-400" />
    default:
      return <Code2 className="h-4 w-4 text-muted-foreground" />
  }
}

function getNodeTypeCategory(type: ArchitectureNodeType): number {
  switch (type) {
    case 'frontend':
    case 'authentication':
      return 0 // Left column (Tier 1: Client/Auth)
    case 'backend':
    case 'api':
    case 'worker':
      return 1 // Middle column (Tier 2: Core Application/API)
    case 'database':
    case 'cache':
    case 'queue':
    case 'storage':
    case 'external_service':
    case 'build':
    case 'deployment':
    default:
      return 2 // Right column (Tier 3: Persistence/Services)
  }
}

export function RepositoryArchitecture({ architecture }: RepositoryArchitectureProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number; w: number; h: number }>>({})

  const nodes = architecture?.nodes || []
  const edges = architecture?.edges || []
  const limitations = architecture?.limitations || []

  // Safe valid edges filter
  const validEdges = edges.filter(
    (edge) => nodes.some((n) => n.id === edge.source) && nodes.some((n) => n.id === edge.target)
  )

  // Calculate node positions relative to graph container for SVG connector paths
  useEffect(() => {
    function updatePositions() {
      if (!containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      const newPositions: Record<string, { x: number; y: number; w: number; h: number }> = {}

      nodes.forEach((node) => {
        const el = containerRef.current?.querySelector(`[data-node-id="${node.id}"]`)
        if (el) {
          const rect = el.getBoundingClientRect()
          newPositions[node.id] = {
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            w: rect.width,
            h: rect.height
          }
        }
      })
      setNodePositions(newPositions)
    }

    updatePositions()
    window.addEventListener('resize', updatePositions)
    const timeout = setTimeout(updatePositions, 100)

    return () => {
      window.removeEventListener('resize', updatePositions)
      clearTimeout(timeout)
    }
  }, [nodes])

  if (!architecture || nodes.length === 0) {
    return (
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-6 text-center text-xs text-muted-foreground font-mono">
          Architecture map unavailable for this analysis.
        </CardContent>
      </Card>
    )
  }

  // Categorize nodes into 3 deterministic tier columns
  const tier0 = nodes.filter((n) => getNodeTypeCategory(n.type) === 0)
  const tier1 = nodes.filter((n) => getNodeTypeCategory(n.type) === 1)
  const tier2 = nodes.filter((n) => getNodeTypeCategory(n.type) === 2)

  // Fallback if all nodes fall into a single tier
  const tiers = [
    tier0.length > 0 ? tier0 : null,
    tier1.length > 0 ? tier1 : null,
    tier2.length > 0 ? tier2 : null
  ].filter(Boolean) as ArchitectureNode[][]

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  return (
    <Card className="border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Repository Architecture Map
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Deterministic architecture map derived from inspected repository evidence.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {architecture.confidence && (
              <Badge variant="outline" className="text-[10px] font-mono capitalize border-border/80">
                Confidence: {architecture.confidence}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] font-mono border-border/80 text-muted-foreground">
              {nodes.length} Components, {validEdges.length} Connectors
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Interactive Architecture Viewport */}
        <div className="relative overflow-x-auto rounded-xl border border-border/60 bg-slate-950/60 p-6 min-h-[320px]">
          {/* SVG Overlay Connectors */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" className="fill-primary/60" />
              </marker>
              <marker
                id="arrowhead-active"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" className="fill-emerald-400" />
              </marker>
            </defs>

            {validEdges.map((edge) => {
              const src = nodePositions[edge.source]
              const tgt = nodePositions[edge.target]
              if (!src || !tgt) return null

              const edgeId = `${edge.source}->${edge.target}`
              const isSelected = selectedEdgeId === edgeId || selectedNodeId === edge.source || selectedNodeId === edge.target

              // Calculate start (right side of src) & end (left side of tgt)
              const x1 = src.x + src.w
              const y1 = src.y + src.h / 2
              const x2 = tgt.x
              const y2 = tgt.y + tgt.h / 2

              // Control points for smooth bezier curve
              const dx = Math.abs(x2 - x1) / 2
              const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`

              return (
                <g key={edgeId}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isSelected ? '#10b981' : '#334155'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeDasharray={edge.confidence === 'low' ? '4,4' : undefined}
                    markerEnd={isSelected ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                    className="transition-all duration-200"
                  />
                  {edge.label && (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 6}
                      fill={isSelected ? '#10b981' : '#94a3b8'}
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="select-none font-semibold"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Tier Columns Grid */}
          <div
            ref={containerRef}
            className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center min-w-[640px]"
          >
            {tiers.map((tierNodes, tierIdx) => (
              <div key={tierIdx} className="space-y-4 flex flex-col justify-center">
                {tierNodes.map((node) => {
                  const isSelected = selectedNodeId === node.id

                  return (
                    <div
                      key={node.id}
                      data-node-id={node.id}
                      onClick={() => {
                        setSelectedNodeId(node.id === selectedNodeId ? null : node.id)
                        setSelectedEdgeId(null)
                      }}
                      className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left space-y-2.5 ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary/40'
                          : 'border-border/80 bg-card/90 hover:border-primary/50 hover:bg-card'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-muted/30 border border-border/40">
                            {getNodeIcon(node.type)}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold font-mono text-foreground tracking-tight">
                              {node.label}
                            </h4>
                            <span className="text-[10px] text-muted-foreground font-mono uppercase">
                              {node.type}
                            </span>
                          </div>
                        </div>

                        {node.confidence && (
                          <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 text-muted-foreground">
                            {node.confidence}
                          </Badge>
                        )}
                      </div>

                      {/* Detected Node Technologies */}
                      {node.technologies && node.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {node.technologies.map((tech) => (
                            <Badge
                              key={tech}
                              variant="secondary"
                              className="text-[10px] font-mono py-0 px-1.5 bg-muted/40 text-foreground"
                            >
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Component Detail Drawer */}
        {selectedNode && (
          <div className="p-4 rounded-xl border border-primary/40 bg-primary/5 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-bold font-mono text-foreground uppercase tracking-wider">
                  Selected Component: {selectedNode.label}
                </h4>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono capitalize">
                Type: {selectedNode.type}
              </Badge>
            </div>

            {selectedNode.technologies && selectedNode.technologies.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-muted-foreground font-semibold block">
                  Associated Stack:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.technologies.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[11px] font-mono">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedNode.evidence && selectedNode.evidence.length > 0 && (
              <div className="space-y-1 font-mono text-xs">
                <span className="text-[11px] text-muted-foreground font-semibold block">
                  Evidence File Paths:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.evidence.map((ev, i) => (
                    <code key={i} className="px-2 py-0.5 rounded bg-muted/40 border border-border/60 text-emerald-400 text-[11px]">
                      {ev}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Architecture Scope & Limitations */}
        {limitations && limitations.length > 0 && (
          <div className="p-3 rounded-lg border border-border/40 bg-muted/20 text-xs text-muted-foreground space-y-1">
            <span className="font-semibold text-foreground flex items-center gap-1.5 font-mono">
              <Info className="h-3.5 w-3.5 text-primary" />
              Architecture Detection Scope
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
