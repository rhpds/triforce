interface StepData {
  name: string
  status: 'idle' | 'running' | 'complete' | 'skipped' | 'error'
  latency_ms: number
  result: string
}

interface Props {
  steps: StepData[]
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  idle: { bg: '#1a1a2e', border: '#333', text: '#888' },
  running: { bg: '#0d2137', border: '#00AEEF', text: '#00AEEF' },
  complete: { bg: '#0a2a1a', border: '#2ecc71', text: '#2ecc71' },
  skipped: { bg: '#1a1a1a', border: '#555', text: '#666' },
  error: { bg: '#2a0a0a', border: '#e74c3c', text: '#e74c3c' },
}

export function GraphVisualization({ steps }: Props) {
  if (steps.length === 0) {
    return (
      <div data-testid="graph-viz" style={{ padding: 24, textAlign: 'center', color: '#888' }}>
        No pipeline steps to display
      </div>
    )
  }

  return (
    <div data-testid="graph-viz" style={{ display: 'flex', alignItems: 'center', gap: 0, padding: 24, overflowX: 'auto' }}>
      {steps.map((step, i) => {
        const colors = STATUS_COLORS[step.status] || STATUS_COLORS.idle
        return (
          <div key={step.name} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Node */}
            <div style={{
              minWidth: 180,
              padding: '16px 20px',
              borderRadius: 12,
              border: `2px solid ${colors.border}`,
              backgroundColor: colors.bg,
              position: 'relative',
              animation: step.status === 'running' ? 'pulse 1.5s ease-in-out infinite' : undefined,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 4 }}>
                {step.name}
              </div>

              {step.status === 'complete' && (
                <>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                    {step.latency_ms}ms
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic' }}>
                    {step.result}
                  </div>
                </>
              )}

              {step.status === 'running' && (
                <div style={{ fontSize: 12, color: colors.text }}>
                  Processing...
                </div>
              )}

              {step.status === 'skipped' && (
                <div style={{ fontSize: 11, color: '#666' }}>
                  {step.result || 'Skipped'}
                </div>
              )}

              {/* Status badge */}
              <div style={{
                position: 'absolute',
                top: -8,
                right: -8,
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: colors.border,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: '#fff',
              }}>
                {step.status === 'complete' ? '✓' : step.status === 'error' ? '✗' : step.status === 'running' ? '⟳' : '–'}
              </div>

              {/* CPU badge */}
              {step.status === 'complete' && (
                <div style={{
                  marginTop: 8,
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 4,
                  backgroundColor: 'rgba(0,113,197,0.2)',
                  color: '#0071C5',
                  fontSize: 10,
                  fontWeight: 600,
                }}>
                  Xeon 6 CPU
                </div>
              )}
            </div>

            {/* Connector */}
            {i < steps.length - 1 && (
              <div style={{
                width: 40,
                height: 2,
                backgroundColor: step.status === 'complete' ? '#2ecc71' : '#333',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  right: -4,
                  top: -4,
                  width: 0,
                  height: 0,
                  borderLeft: `8px solid ${step.status === 'complete' ? '#2ecc71' : '#333'}`,
                  borderTop: '5px solid transparent',
                  borderBottom: '5px solid transparent',
                }} />
              </div>
            )}
          </div>
        )
      })}

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0, 174, 239, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(0, 174, 239, 0); }
        }
      `}</style>
    </div>
  )
}
