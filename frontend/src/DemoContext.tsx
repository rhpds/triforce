import { createContext, useContext, useState, type ReactNode } from 'react'

interface PipelineMetrics {
  classifyMs: number
  nerMs: number
  interactionsMs: number
  summarizeMs: number
  totalMs: number
  entities: number
  interactions: number
}

interface DemoMetrics {
  pipeline: PipelineMetrics | null
  setPipeline: (m: PipelineMetrics) => void
}

const DemoContext = createContext<DemoMetrics>({
  pipeline: null,
  setPipeline: () => {},
})

export function DemoProvider({ children }: { children: ReactNode }) {
  const [pipeline, setPipeline] = useState<PipelineMetrics | null>(null)
  return (
    <DemoContext.Provider value={{ pipeline, setPipeline }}>
      {children}
    </DemoContext.Provider>
  )
}

export function useDemoMetrics() {
  return useContext(DemoContext)
}
