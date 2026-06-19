import { createContext, useContext, useState, type ReactNode } from 'react'

export interface PipelineMetrics {
  classifyMs: number
  nerMs: number
  interactionsMs: number
  summarizeMs: number
  totalMs: number
  entities: number
  interactions: number
  timestamp?: number
  source?: 'live' | 'cached'
}

interface DemoMetrics {
  pipeline: PipelineMetrics | null
  setPipeline: (m: PipelineMetrics) => void
}

const STORAGE_KEY = 'triforce-pipeline-metrics'

function loadCached(variant: string): PipelineMetrics | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-${variant}`)
    if (!raw) return null
    const data = JSON.parse(raw) as PipelineMetrics
    data.source = 'cached'
    return data
  } catch {
    return null
  }
}

function saveCached(variant: string, metrics: PipelineMetrics) {
  try {
    localStorage.setItem(`${STORAGE_KEY}-${variant}`, JSON.stringify(metrics))
  } catch { /* storage full or unavailable */ }
}

function getVariant(): string {
  const params = new URLSearchParams(window.location.search)
  return params.get('demo') || 'base'
}

const DemoContext = createContext<DemoMetrics>({
  pipeline: null,
  setPipeline: () => {},
})

export function DemoProvider({ children }: { children: ReactNode }) {
  const variant = getVariant()
  const [pipeline, setPipelineState] = useState<PipelineMetrics | null>(() => loadCached(variant))

  const setPipeline = (m: PipelineMetrics) => {
    const withMeta = { ...m, timestamp: Date.now(), source: 'live' as const }
    setPipelineState(withMeta)
    saveCached(variant, withMeta)
  }

  return (
    <DemoContext.Provider value={{ pipeline, setPipeline }}>
      {children}
    </DemoContext.Provider>
  )
}

export function useDemoMetrics() {
  return useContext(DemoContext)
}
