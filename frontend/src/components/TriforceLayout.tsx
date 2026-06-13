import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getTheme } from '../themes'

const NAV_ITEMS: Record<string, { label: string; path: string }> = {
  dashboard: { label: 'Dashboard', path: '/' },
  pipeline: { label: 'Pipeline', path: '/pipeline' },
  cost: { label: 'Cost Analysis', path: '/cost' },
  workflow: { label: 'Workflows', path: '/workflow' },
  kafka: { label: 'Kafka', path: '/kafka' },
  agents: { label: 'Agents', path: '/agents' },
  log: { label: 'Telemetry', path: '/log' },
}

interface Props {
  themeName: string
  children: ReactNode
}

export function TriforceLayout({ themeName, children }: Props) {
  const theme = getTheme(themeName)
  const navigate = useNavigate()
  const location = useLocation()

  const orderedPages = theme.pages.map(key => ({ key, ...NAV_ITEMS[key] })).filter(Boolean)

  return (
    <div
      data-testid="triforce-layout"
      style={{
        minHeight: '100vh',
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        fontFamily: "'Red Hat Display', 'Red Hat Text', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: theme.mode === 'dark' ? theme.colors.surface : theme.colors.primary,
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{
            fontSize: 20,
            fontWeight: 700,
            color: theme.mode === 'dark' ? theme.colors.accent : '#fff',
            letterSpacing: '-0.5px',
          }}>
            TRIFORCE
          </span>
          <span style={{
            fontSize: 14,
            color: theme.mode === 'dark' ? theme.colors.textMuted : 'rgba(255,255,255,0.8)',
          }}>
            {theme.logo}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['intel', 'redhat', 'ibm'].map(t => (
            <button
              key={t}
              onClick={() => navigate(`${location.pathname}?theme=${t}`)}
              style={{
                padding: '4px 12px',
                borderRadius: 4,
                border: t === themeName ? `2px solid ${theme.colors.accent}` : '1px solid rgba(128,128,128,0.3)',
                background: t === themeName ? (theme.mode === 'dark' ? theme.colors.surface : 'rgba(255,255,255,0.2)') : 'transparent',
                color: theme.mode === 'dark' ? theme.colors.text : '#fff',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: t === themeName ? 700 : 400,
              }}
            >
              {t === 'intel' ? 'Intel' : t === 'redhat' ? 'Red Hat' : 'IBM'}
            </button>
          ))}
        </div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        {/* Sidebar */}
        <nav style={{
          width: 220,
          backgroundColor: theme.mode === 'dark' ? theme.colors.surface : theme.colors.surface,
          borderRight: `1px solid ${theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)'}`,
          padding: '16px 0',
        }}>
          {orderedPages.map(item => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.key}
                onClick={() => navigate(`${item.path}?theme=${themeName}`)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? theme.colors.primary : theme.colors.text,
                  backgroundColor: isActive
                    ? (theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)')
                    : 'transparent',
                  borderLeft: isActive ? `3px solid ${theme.colors.primary}` : '3px solid transparent',
                }}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Content */}
        <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
