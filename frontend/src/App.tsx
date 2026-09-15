import { useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Header } from '@/components/layout/Header'
import { RepositoryAnalyzer } from '@/components/repository/RepositoryAnalyzer'
import { AnalysisLoading } from '@/components/repository/AnalysisLoading'
import { RepositoryHeader } from '@/components/repository/RepositoryHeader'
import { RepositoryOverview } from '@/components/repository/RepositoryOverview'
import { RepositoryArchitecture } from '@/components/repository/RepositoryArchitecture'
import { ApiExplorer } from '@/components/repository/ApiExplorer'
import { RepositoryHealth } from '@/components/repository/RepositoryHealth'
import { EvidenceMetrics } from '@/components/repository/EvidenceMetrics'
import { TechnologyStack } from '@/components/repository/TechnologyStack'
import { EvidenceLists } from '@/components/repository/EvidenceLists'
import { SetupGuide } from '@/components/repository/SetupGuide'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { apiClient } from '@/api/client'
import { ApiClientError, type AnalyzeSuccessResponse } from '@/types/api.types'

type AnalysisState = 'initial' | 'analyzing' | 'success' | 'error'

export function App() {
  const [state, setState] = useState<AnalysisState>('initial')
  const [currentUrl, setCurrentUrl] = useState<string>('')
  const [analysisData, setAnalysisData] = useState<AnalyzeSuccessResponse['data'] | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleAnalyze = async (url: string) => {
    if (state === 'analyzing') return
    setCurrentUrl(url)
    setState('analyzing')
    setErrorCode(null)
    setErrorMessage(null)

    try {
      const response = await apiClient.analyzeRepository(url)
      if (response.success && response.data) {
        setAnalysisData(response.data)
        setState('success')
      } else {
        setState('error')
        setErrorCode('API_ERROR')
        setErrorMessage('Invalid response structure received from API.')
      }
    } catch (err) {
      setState('error')
      if (err instanceof ApiClientError) {
        setErrorCode(err.code)
        setErrorMessage(err.message)
      } else if (err instanceof Error) {
        setErrorCode('NETWORK_ERROR')
        setErrorMessage(err.message)
      } else {
        setErrorCode('UNKNOWN_ERROR')
        setErrorMessage('An unexpected error occurred while communicating with the backend server.')
      }
    }
  }

  const handleReset = () => {
    setState('initial')
    setAnalysisData(null)
    setErrorCode(null)
    setErrorMessage(null)
    setCurrentUrl('')
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
        {/* Top Header */}
        <Header
          onReset={handleReset}
          isAnalyzing={state === 'analyzing'}
          hasData={state === 'success' || state === 'error'}
        />

        {/* Main Content Workspace Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Initial View */}
          {state === 'initial' && (
            <div className="py-6 sm:py-12 space-y-8 animate-in fade-in duration-300">
              <RepositoryAnalyzer onAnalyze={handleAnalyze} isAnalyzing={false} />
            </div>
          )}

          {/* Loading View */}
          {state === 'analyzing' && (
            <div className="py-6 animate-in fade-in duration-300">
              <AnalysisLoading url={currentUrl} />
            </div>
          )}

          {/* Error View */}
          {state === 'error' && (
            <div className="py-8 space-y-6 animate-in fade-in duration-300">
              <ErrorAlert
                code={errorCode}
                message={errorMessage || 'Failed to analyze repository.'}
                onRetry={() => handleAnalyze(currentUrl)}
              />
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer font-mono"
                >
                  Return to repository search
                </button>
              </div>
            </div>
          )}

          {/* Success View: Structured Repository Intelligence Overview */}
          {state === 'success' && analysisData && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* 1. Repository Header Banner */}
              <RepositoryHeader
                repository={analysisData.repository}
                structure={analysisData.structure}
                technologies={analysisData.technologies}
                onReset={handleReset}
              />

              {/* 2. Repository Overview */}
              <RepositoryOverview analysis={analysisData.analysis} />

              {/* 3. Repository Architecture Map */}
              <RepositoryArchitecture architecture={analysisData.architecture} />

              {/* 4. API Explorer */}
              <ApiExplorer api={analysisData.api} />

              {/* 5. Repository Health Intelligence */}
              <RepositoryHealth health={analysisData.health} />

              {/* 6. Evidence Scope + Technology Stack */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <TechnologyStack technologies={analysisData.technologies} />
                </div>
                <div>
                  <EvidenceMetrics
                    structure={analysisData.structure}
                    fileContents={analysisData.fileContents}
                    completeness={analysisData.evidence?.completeness}
                  />
                </div>
              </div>

              {/* 7. Repository Evidence Lists */}
              <EvidenceLists
                entryPoints={analysisData.evidence?.entryPoints}
                configFiles={analysisData.evidence?.configFiles}
                manifestFiles={analysisData.evidence?.manifestFiles}
                documentationFiles={analysisData.evidence?.documentationFiles}
                importantFiles={analysisData.structure?.importantFiles}
              />

              {/* 8. Setup / Run Information */}
              <SetupGuide setup={analysisData.analysis?.setup} />
            </div>
          )}
        </main>
      </div>
    </TooltipProvider>
  )
}

export default App
