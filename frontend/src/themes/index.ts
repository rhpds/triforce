import type { ThemeConfig } from './types'
import { intelTheme } from './intel'
import { redhatTheme } from './redhat'
import { ibmTheme } from './ibm'

const themes: Record<string, ThemeConfig> = {
  intel: intelTheme,
  redhat: redhatTheme,
  ibm: ibmTheme,
}

export function getTheme(name: string): ThemeConfig {
  return themes[name] || intelTheme
}

export type { ThemeConfig }
export { intelTheme, redhatTheme, ibmTheme }
