import type { ThemeConfig } from './types'

export const ibmTheme: ThemeConfig = {
  name: 'ibm',
  displayName: 'IBM',
  headline: 'Who controls your AI agents? Kagenti does.',
  subheadline: 'Kubernetes-native agent governance with A2A protocol, MCP tool federation, and SPIFFE zero-trust identity.',
  mode: 'light',
  colors: {
    primary: '#0F62FE',
    secondary: '#4589FF',
    accent: '#A56EFF',
    background: '#F4F4F4',
    surface: '#FFFFFF',
    text: '#161616',
    textMuted: '#525252',
  },
  logo: 'IBM Kagenti',
  pages: ['agents', 'workflow', 'pipeline', 'log', 'dashboard', 'kafka', 'cost'],
}
