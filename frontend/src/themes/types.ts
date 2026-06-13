export interface ThemeConfig {
  name: string
  displayName: string
  headline: string
  subheadline: string
  mode: 'dark' | 'light'
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    textMuted: string
  }
  logo: string
  pages: string[]
}
