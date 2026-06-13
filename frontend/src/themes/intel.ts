import type { ThemeConfig } from './types'

export const intelTheme: ThemeConfig = {
  name: 'intel',
  displayName: 'Intel',
  headline: "80% of enterprise AI doesn't need a GPU.",
  subheadline: 'Intel Xeon 6 with AMX acceleration runs classification, NER, summarization, and embeddings at a fraction of the cost.',
  mode: 'dark',
  colors: {
    primary: '#0071C5',
    secondary: '#00AEEF',
    accent: '#00C7FD',
    background: '#0A1628',
    surface: '#132337',
    text: '#E8F0FE',
    textMuted: '#8CA0B3',
  },
  logo: 'Intel® Xeon® 6',
  pages: ['pipeline', 'cost', 'workflow', 'kafka', 'log', 'agents', 'dashboard'],
}
