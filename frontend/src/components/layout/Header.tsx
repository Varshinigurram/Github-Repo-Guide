import { useState, useEffect } from 'react'
import { Terminal, Activity, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/api/client'

interface HeaderProps {
  onReset?: () => void
  isAnalyzing?: boolean
  hasData?: boolean
}

export function Header({ onReset, isAnalyzing, hasData }: HeaderProps) {
  const [healthStatus, setHealthStatus] = useState<'online' | 'offline' | 'checking'>('checking')

  useEffect(() => {
    let isMounted = true

    async function checkHealth() {
      try {
        const res = await apiClient.getHealth()
        if (isMounted) {
          if (res.status === 'ok') {
            setHealthStatus('online')
          } else {
            setHealthStatus('offline')
          }
        }
      } catch {
        if (isMounted) {
          setHealthStatus('offline')
        }
      }
    }

    checkHealth()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card shadow-xs">
            <Terminal className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-foreground text-sm sm:text-base">
                GitHub Repo Guide
              </span>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider py-0 px-1.5 font-mono">
                v1.0
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Repository Intelligence & Evidence Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border/60 bg-muted/30 px-2.5 py-1 rounded-md">
            <Activity className="h-3.5 w-3.5" />
            <span className="hidden md:inline font-mono">API:</span>
            {healthStatus === 'checking' && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                Checking
              </span>
            )}
            {healthStatus === 'online' && (
              <span className="flex items-center gap-1 text-emerald-500 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Online
              </span>
            )}
            {healthStatus === 'offline' && (
              <span className="flex items-center gap-1 text-destructive font-medium">
                <span className="h-2 w-2 rounded-full bg-destructive" />
                Offline
              </span>
            )}
          </div>

          {hasData && onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={isAnalyzing}
              className="gap-1.5 text-xs h-8"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">New Analysis</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
