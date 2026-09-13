import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/api/client'
import { ApiClientError, type HealthStatusResponse } from '@/types/api.types'
import { Activity, Terminal, ShieldCheck, Cpu } from 'lucide-react'

export function App() {
  const [healthStatus, setHealthStatus] = useState<HealthStatusResponse | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const checkHealth = async () => {
    setLoading(true)
    setHealthError(null)
    try {
      const res = await apiClient.getHealth()
      setHealthStatus(res)
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setHealthError(`[${err.code}] ${err.message}`)
      } else if (err instanceof Error) {
        setHealthError(err.message)
      } else {
        setHealthError('Failed to connect to backend server.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl space-y-6">
        {/* Header Branding */}
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 bg-slate-800 rounded-lg text-slate-200 border border-slate-700">
            <Terminal className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">GitHub Repo Guide</h1>
            <p className="text-xs text-slate-400">Frontend Foundation initialized (Step 13B)</p>
          </div>
        </div>

        {/* Technical Tech Stack Verification Checklist */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Foundation Verification Checklist
          </h2>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>React 19 + TypeScript</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tailwind CSS v4</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>shadcn/ui Button</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Lucide Icons</span>
            </div>
          </div>
        </div>

        {/* Backend API Health Verification Section */}
        <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-300 font-mono">
              <Cpu className="w-4 h-4 text-slate-400" />
              <span>Backend Target: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              disabled={loading}
              className="text-xs border-slate-700 hover:bg-slate-800 text-slate-200"
            >
              <Activity className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              {loading ? 'Checking...' : 'Check API Health'}
            </Button>
          </div>

          {healthStatus && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded text-xs font-mono text-emerald-300">
              Status: {healthStatus.status} | Service: {healthStatus.service}
            </div>
          )}

          {healthError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded text-xs font-mono text-rose-300">
              {healthError}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
