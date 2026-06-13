import type { ThemeConfig } from './types'

export const redhatTheme: ThemeConfig = {
  name: 'redhat',
  displayName: 'Red Hat',
  headline: "AI inference isn't a model problem. It's a platform problem.",
  subheadline: 'Red Hat OpenShift AI runs polyglot agents, Kafka event streams, and PostgreSQL at enterprise scale.',
  mode: 'light',
  colors: {
    primary: '#EE0000',
    secondary: '#A30000',
    accent: '#F0AB00',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#151515',
    textMuted: '#6A6E73',
  },
  logo: 'Red Hat OpenShift AI',
  pages: ['dashboard', 'kafka', 'pipeline', 'workflow', 'log', 'agents', 'cost'],
}
