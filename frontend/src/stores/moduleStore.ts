import { create } from 'zustand'

interface ModuleState {
  enabled: string[]
  loading: boolean
  allModulesMode: boolean
  fetchModules: () => Promise<void>
}

function getModulesFromUrl(): string[] | null {
  const params = new URLSearchParams(window.location.search)
  const raw = params.get('modules')
  if (!raw) return null
  return raw.split(',').map(m => m.trim()).filter(Boolean)
}

export const useModuleStore = create<ModuleState>()((set) => ({
  enabled: [],
  loading: true,
  allModulesMode: true,

  fetchModules: async () => {
    const urlModules = getModulesFromUrl()
    if (urlModules && urlModules.length > 0) {
      set({ enabled: urlModules, allModulesMode: false, loading: false })
      return
    }

    try {
      const resp = await fetch('/healthcare/api/v1/modules')
      const data = await resp.json()
      if (data.enabled && data.enabled.length > 0) {
        set({ enabled: data.enabled, allModulesMode: false, loading: false })
      } else {
        set({ allModulesMode: true, loading: false })
      }
    } catch {
      set({ allModulesMode: true, loading: false })
    }
  },
}))

if (typeof window !== 'undefined' && !import.meta.env.VITEST) {
  useModuleStore.getState().fetchModules()
}

export function useModules() {
  const enabled = useModuleStore((s) => s.enabled)
  const loading = useModuleStore((s) => s.loading)
  const allModulesMode = useModuleStore((s) => s.allModulesMode)
  return { enabled, loading, allModulesMode }
}

export function useModuleEnabled(moduleId: string): boolean {
  const allModulesMode = useModuleStore((s) => s.allModulesMode)
  const enabled = useModuleStore((s) => s.enabled)
  if (allModulesMode) return true
  return enabled.includes(moduleId)
}
