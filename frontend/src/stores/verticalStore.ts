import { create } from 'zustand'
import { VERTICALS, type VerticalConfig, type VerticalId } from '../VerticalContext'

interface VerticalState {
  current: VerticalConfig
  setVertical: (id: VerticalId) => void
}

function getVerticalFromUrl(): VerticalId {
  const params = new URLSearchParams(window.location.search)
  const v = params.get('vertical') as VerticalId
  return v && VERTICALS[v] ? v : 'healthcare'
}

export const useVerticalStore = create<VerticalState>()((set) => ({
  current: VERTICALS[getVerticalFromUrl()],
  setVertical: (id) => set({ current: VERTICALS[id] }),
}))

export function useVertical(): VerticalConfig {
  return useVerticalStore((s) => s.current)
}

export { VERTICALS, getVerticalFromUrl, type VerticalConfig, type VerticalId } from '../VerticalContext'
