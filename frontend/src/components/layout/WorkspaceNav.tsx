import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  FolderTree,
  Activity,
  Network,
  Route,
  MessageSquareText
} from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { id: 'repository-overview', label: 'Overview', icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
  { id: 'project-structure', label: 'Structure', icon: <FolderTree className="h-3.5 w-3.5" /> },
  { id: 'repository-health', label: 'Health', icon: <Activity className="h-3.5 w-3.5" /> },
  { id: 'repository-architecture', label: 'Architecture', icon: <Network className="h-3.5 w-3.5" /> },
  { id: 'api-explorer', label: 'APIs', icon: <Route className="h-3.5 w-3.5" /> },
  { id: 'repository-ask', label: 'Ask', icon: <MessageSquareText className="h-3.5 w-3.5" /> },
]

export function WorkspaceNav() {
  const [activeId, setActiveId] = useState<string>('repository-overview')

  useEffect(() => {
    const sectionIds = NAV_ITEMS.map((item) => item.id)
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find entry closest to top with highest intersection ratio
        const visibleEntries = entries.filter((entry) => entry.isIntersecting)
        if (visibleEntries.length > 0) {
          // Sort by top boundary
          visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          setActiveId(visibleEntries[0].target.id)
        }
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0, 0.2, 0.5, 0.8]
      }
    )

    elements.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
    }
  }, [])

  const handleNavClick = (id: string) => {
    setActiveId(id)
    const el = document.getElementById(id)
    if (el) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const navOffset = 110 // height of sticky header + workspace nav
      const elementPosition = el.getBoundingClientRect().top + window.scrollY
      const offsetPosition = elementPosition - navOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      })
    }
  }

  return (
    <nav
      aria-label="Repository workspace navigation"
      className="sticky top-14 z-30 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="mx-auto flex h-11 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-1 w-full">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider font-semibold mr-3 shrink-0 hidden sm:inline">
            Workspace:
          </span>
          {NAV_ITEMS.map((item) => {
            const isActive = activeId === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'location' : undefined}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-primary/10 text-emerald-400 font-semibold border border-primary/30 shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
