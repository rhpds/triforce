import { useState, useEffect } from 'react'
import { AgentTopology } from '../components/AgentTopology'
import { getTheme } from '../themes'
import { listAgents, getMetrics } from '../api/client'

export function Dashboard() {
  const params = new URLSearchParams(window.location.search)
  const theme = getTheme(params.get('theme') || 'intel')
  const [agents, setAgents] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    listAgents().then(r => setAgents(r.agents)).catch(() => {})
    getMetrics().then(r => setMetrics(r)).catch(() => {})
  }, [])

  return (
    <div data-testid="page-dashboard">
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{theme.headline}</h1>
      <p style={{ fontSize: 15, color: theme.colors.textMuted, marginBottom: 32 }}>{theme.subheadline}</p>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 560px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Agent Topology</h2>
          <AgentTopology agents={agents} />
        </div>
        {metrics && (
          <div style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Platform</h2>
            {[
              { l: 'Agents', v: `${metrics.agents.active}/${metrics.agents.total}` },
              { l: 'Workflows', v: `${metrics.agents.workflows_completed}` },
              { l: 'Inference Calls', v: `${metrics.inference.total_requests}` },
              { l: 'Avg Latency', v: `${Math.round(metrics.inference.avg_latency_ms)}ms` },
            ].map(m => (
              <div key={m.l} style={{ padding: '10px 14px', borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase' }}>{m.l}</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{m.v}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
