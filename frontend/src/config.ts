export interface TriforceConfig {
  litellmKey: string
  litellmBase: string
}

export function getConfig(): TriforceConfig {
  const w = window as any
  const params = new URLSearchParams(window.location.search)
  return {
    litellmKey: w.__TRIFORCE_CONFIG__?.litellmKey || params.get('key') || '',
    litellmBase: w.__TRIFORCE_CONFIG__?.litellmBase || '/litellm',
  }
}
