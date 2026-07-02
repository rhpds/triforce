import { VERTICALS, getVerticalFromUrl, type VerticalId } from '../VerticalContext'

export function VerticalSelector() {
  const current = getVerticalFromUrl()

  const switchVertical = (id: VerticalId) => {
    const params = new URLSearchParams(window.location.search)
    params.set('vertical', id)
    window.location.search = params.toString()
  }

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <span style={{ fontSize: 10, color: 'var(--text-dim)', marginRight: 4 }}>Vertical:</span>
      {(Object.keys(VERTICALS) as VerticalId[]).map(id => {
        const v = VERTICALS[id]
        const active = id === current
        return (
          <button
            key={id}
            onClick={() => switchVertical(id)}
            title={v.label}
            style={{
              padding: '3px 8px',
              borderRadius: 4,
              border: `1px solid ${active ? 'var(--intel-cyan)' : 'var(--border)'}`,
              background: active ? 'rgba(0,198,255,0.1)' : 'transparent',
              color: active ? 'var(--intel-cyan)' : 'var(--text-dim)',
              fontSize: 11,
              fontWeight: active ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {v.icon} {v.label}
          </button>
        )
      })}
    </div>
  )
}
