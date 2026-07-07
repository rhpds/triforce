import { create } from 'zustand'

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

interface DemoState {
  pipeline: PipelineMetrics | null
  setPipeline: (m: PipelineMetrics) => void
}

export const useDemoStore = create<DemoState>()((set) => ({
  pipeline: null,
  setPipeline: (m) => set({ pipeline: { ...m, timestamp: Date.now(), source: 'live' } }),
}))

export function useDemoMetrics(): { pipeline: PipelineMetrics | null; setPipeline: (m: PipelineMetrics) => void } {
  const pipeline = useDemoStore((s) => s.pipeline)
  const setPipeline = useDemoStore((s) => s.setPipeline)
  return { pipeline, setPipeline }
}
