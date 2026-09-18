import { useState } from 'react'
import {
  MessageSquareCode,
  Sparkles,
  Loader2,
  Copy,
  CheckCircle2,
  FileCode2,
  AlertTriangle,
  History,
  Info,
  CornerDownLeft
} from 'lucide-react'
import {
  type RepositoryAskResult,
  type AskEvidence
} from '@/types/api.types'
import { apiClient } from '@/api/client'
import { ApiClientError } from '@/types/api.types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface RepositoryAskProps {
  url?: string
  repoFullName?: string
  onSelectCitationFile?: (path: string) => void
}

interface AskHistoryItem {
  id: string
  question: string
  result: RepositoryAskResult
  timestamp: string
}

const QUESTION_SUGGESTIONS = [
  'What is the primary purpose of this repository?',
  'Where are the API routes and endpoints defined?',
  'How does authentication or authorization work?',
  'How does the main application workflow execute?'
]

function getConfidenceBadge(confidence: 'high' | 'medium' | 'low') {
  switch (confidence) {
    case 'high':
      return <Badge variant="success" className="text-[10px] font-mono capitalize">Confidence: High</Badge>
    case 'medium':
      return <Badge variant="warning" className="text-[10px] font-mono capitalize">Confidence: Medium</Badge>
    case 'low':
      return <Badge variant="destructive" className="text-[10px] font-mono capitalize">Confidence: Low</Badge>
    default:
      return <Badge variant="outline" className="text-[10px] font-mono capitalize">Confidence: {confidence}</Badge>
  }
}

export function RepositoryAsk({ url, repoFullName, onSelectCitationFile }: RepositoryAskProps) {
  const [question, setQuestion] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [currentResult, setCurrentResult] = useState<RepositoryAskResult | null>(null)
  const [activeQuestionText, setActiveQuestionText] = useState<string | null>(null)
  const [askError, setAskError] = useState<{ code: string; message: string } | null>(null)
  const [copiedAnswer, setCopiedAnswer] = useState(false)
  const [history, setHistory] = useState<AskHistoryItem[]>([])
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)

  const isQuestionValid = question.trim().length > 0 && question.trim().length <= 1000

  const handleAskSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!url || !isQuestionValid || isAsking) return

    const trimmedQuestion = question.trim()
    setIsAsking(true)
    setAskError(null)
    setSelectedHistoryId(null)

    try {
      const response = await apiClient.askRepository(url, trimmedQuestion)
      if (response.success && response.data) {
        const resultData = response.data
        setCurrentResult(resultData)
        setActiveQuestionText(trimmedQuestion)

        // Add to session history (max 10, newest first)
        const newItem: AskHistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          question: trimmedQuestion,
          result: resultData,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }

        setHistory((prev) => [newItem, ...prev].slice(0, 10))
        setQuestion('')
      } else {
        setAskError({ code: 'INVALID_RESPONSE', message: 'Failed to receive grounded answer payload.' })
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setAskError({ code: err.code, message: err.message })
      } else if (err instanceof Error) {
        setAskError({ code: 'NETWORK_ERROR', message: err.message })
      } else {
        setAskError({ code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred.' })
      }
    } finally {
      setIsAsking(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleAskSubmit()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(suggestion)
  }

  const handleRestoreHistoryItem = (item: AskHistoryItem) => {
    setSelectedHistoryId(item.id)
    setCurrentResult(item.result)
    setActiveQuestionText(item.question)
    setAskError(null)
  }

  const handleCopyAnswer = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedAnswer(true)
    setTimeout(() => setCopiedAnswer(false), 2000)
  }

  const handleCitationClick = (citationPath: string) => {
    if (onSelectCitationFile) {
      onSelectCitationFile(citationPath)
    }
  }

  if (!url) {
    return (
      <Card className="border-border/60 bg-card shadow-xs">
        <CardContent className="p-6 text-center text-xs font-mono text-muted-foreground">
          Analyze a repository first to ask grounded questions.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <MessageSquareCode className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Ask Repository
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Ask questions about the analyzed repository using grounded repository evidence.
              </CardDescription>
            </div>
          </div>

          {repoFullName && (
            <Badge variant="outline" className="text-[11px] font-mono border-border/80 text-foreground">
              Target: {repoFullName}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question Composer Form */}
        <form onSubmit={handleAskSubmit} className="space-y-3">
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. How does authentication work in this repository? Where are the database connections?"
              rows={3}
              maxLength={1000}
              disabled={isAsking}
              className="w-full rounded-lg border border-border/80 bg-background p-3 text-xs font-sans text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
            />
            <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1 text-[10px]">
                <CornerDownLeft className="h-3 w-3" />
                Press Ctrl+Enter to submit
              </span>
              <span className={question.length > 950 ? 'text-amber-400 font-bold' : ''}>
                {question.length} / 1000
              </span>
            </div>
          </div>

          {/* Action Row & Suggestions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Suggestion Chips */}
            <div className="flex flex-wrap items-center gap-1.5 flex-1">
              <span className="text-[11px] font-mono text-muted-foreground mr-1 hidden md:inline">
                Suggestions:
              </span>
              {QUESTION_SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSuggestionClick(sug)}
                  disabled={isAsking}
                  className="text-[11px] font-mono px-2 py-0.5 rounded border border-border/60 bg-muted/20 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!isQuestionValid || isAsking}
              size="sm"
              className="h-8 px-4 text-xs font-medium gap-1.5 shadow-xs shrink-0 self-end sm:self-auto"
            >
              {isAsking ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Ask Question</span>
                  <Sparkles className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Loading State Indicator */}
        {isAsking && (
          <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-3 animate-in fade-in duration-200">
            <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
            <div className="space-y-0.5">
              <span className="text-xs font-mono font-bold text-foreground block">
                Preparing Grounded Answer...
              </span>
              <p className="text-[11px] text-muted-foreground font-mono">
                Selecting evidence package files and generating grounded repository response.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {askError && (
          <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/5 space-y-1 text-xs font-mono animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-destructive font-bold">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Ask Repository Error ({askError.code})</span>
            </div>
            <p className="text-foreground/90 pl-6">{askError.message}</p>
          </div>
        )}

        {/* Grounded Answer Presentation View */}
        {currentResult && !isAsking && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-5 rounded-xl border border-border/80 bg-background space-y-4">
              {/* Question & Confidence Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/40">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                    Investigated Question:
                  </span>
                  <h3 className="text-sm font-bold text-foreground font-sans">
                    {activeQuestionText || 'Repository Question'}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {getConfidenceBadge(currentResult.confidence)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyAnswer(currentResult.answer)}
                    className="h-7 text-xs font-mono gap-1 px-2"
                  >
                    {copiedAnswer ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Answer</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Grounded Text Answer */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Grounded Answer
                </h4>
                <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans whitespace-pre-wrap p-3 rounded-lg bg-muted/10 border border-border/40">
                  {currentResult.answer}
                </div>
              </div>

              {/* Cited Evidence List */}
              {currentResult.evidence && currentResult.evidence.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <FileCode2 className="h-3.5 w-3.5 text-emerald-400" />
                    Inspected Evidence Citations ({currentResult.evidence.length})
                  </h4>
                  <div className="space-y-2">
                    {currentResult.evidence.map((citation: AskEvidence, idx: number) => (
                      <div
                        key={`${citation.path}-${idx}`}
                        onClick={() => handleCitationClick(citation.path)}
                        className="p-3 rounded-lg border border-border/60 bg-muted/20 hover:border-primary/50 transition-colors cursor-pointer space-y-1 group"
                      >
                        <div className="flex items-center justify-between">
                          <code className="text-xs font-mono font-bold text-emerald-400 group-hover:underline">
                            {citation.path}
                          </code>
                          <span className="text-[10px] text-muted-foreground font-mono group-hover:text-primary">
                            Click to view file →
                          </span>
                        </div>
                        {citation.reason && (
                          <p className="text-xs text-muted-foreground leading-snug">
                            {citation.reason}
                          </p>
                        )}
                        {citation.snippet && (
                          <pre className="p-2 rounded bg-slate-950 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-24">
                            <code>{citation.snippet}</code>
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Limitations Panel */}
              {currentResult.limitations && currentResult.limitations.length > 0 && (
                <div className="p-3 rounded-lg border border-border/40 bg-muted/20 text-xs text-muted-foreground space-y-1">
                  <span className="font-semibold text-foreground flex items-center gap-1.5 font-mono">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    Q&A Evidence Limitations
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground">
                    {currentResult.limitations.map((lim, idx) => (
                      <li key={idx}>{lim}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Session History (Max 10 items, React state only) */}
        {history.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-border/40">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                Session History ({history.length})
              </h4>
              <span className="text-[10px] font-mono text-muted-foreground">
                In-Memory Session Only
              </span>
            </div>

            <div className="space-y-1.5">
              {history.map((item) => {
                const isSelected = selectedHistoryId === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleRestoreHistoryItem(item)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-emerald-400 font-semibold'
                        : 'bg-muted/10 border-border/40 hover:bg-muted/30 text-foreground'
                    }`}
                  >
                    <div className="truncate pr-3">
                      <span className="truncate block font-sans">{item.question}</span>
                      <span className="text-[10px] text-muted-foreground block font-mono">
                        {item.timestamp} • {item.result.evidence.length} evidence citations
                      </span>
                    </div>
                    {getConfidenceBadge(item.result.confidence)}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
