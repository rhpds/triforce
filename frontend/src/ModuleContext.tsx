import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface ModuleState {
  enabled: string[]
  loading: boolean
  allModulesMode: boolean
}

const ModuleContext = createContext<ModuleState>({
  enabled: [],
  loading: true,
  allModulesMode: true,
})

function getModulesFromUrl(): string[] | null {
  const params = new URLSearchParams(window.location.search)
  const raw = params.get('modules')
  if (!raw) return null
  return raw.split(',').map(m => m.trim()).filter(Boolean)
}

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [allModulesMode, setAllModulesMode] = useState(true)

  useEffect(() => {
    const urlModules = getModulesFromUrl()
    if (urlModules && urlModules.length > 0) {
      setEnabled(urlModules)
      setAllModulesMode(false)
      setLoading(false)
      return
    }

    fetch('/healthcare/api/v1/modules')
      .then(r => r.json())
      .then(data => {
        if (data.enabled && data.enabled.length > 0) {
          setEnabled(data.enabled)
          setAllModulesMode(false)
        } else {
          setAllModulesMode(true)
        }
      })
      .catch(() => {
        setAllModulesMode(true)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <ModuleContext.Provider value={{ enabled, loading, allModulesMode }}>
      {children}
    </ModuleContext.Provider>
  )
}

export function useModules() {
  return useContext(ModuleContext)
}

export function useModuleEnabled(moduleId: string): boolean {
  const { enabled, allModulesMode } = useContext(ModuleContext)
  if (allModulesMode) return true
  return enabled.includes(moduleId)
}
