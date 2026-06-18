import { useState } from 'react'

export function Act04Platform() {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const discoverAgents = async () => {
    setLoading(true)
    try {
      const resp = await fetch('http://localhost:8083/api/v1/agents')
      const data = await resp.json()
      setAgents(data.agents || [])
    } catch {
      setAgents([])
    }
    setLoading(false)
  }

  return (
    <div className="demo-section">
      <h3><span className="section-num">04</span> The Platform</h3>
      <div className="section-context">
        "Can I run it myself?" Three polyglot agents discover each other via A2A protocol,
        orchestrate cross-vertical workflows, and stream events through Kafka. All on
        Red Hat OpenShift.
      </div>

      <div className="step-card">
        <span className="step-num">1</span>
        <strong>A2A Agent Discovery</strong>
        <div className="step-question">"Who's on the platform?" — the orchestrator discovers agents automatically</div>

        <button className="btn btn-primary" onClick={discoverAgents} disabled={loading} style={{ marginTop: 12 }}>
          {loading ? 'Discovering...' : 'Discover Agents'}
        </button>

        {agents.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {agents.map(a => (
              <div className="card" key={a.name} style={{ borderLeft: `3px solid ${a.status === 'active' ? 'var(--rh-green)' : 'var(--rh-orange)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="health-dot alive" />
                  <strong>{a.name}</strong>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{a.url}</span>
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {a.skills?.map((s: any) => (
                    <span key={s.id} className="mono" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--rh-teal-dim)', color: 'var(--rh-teal)' }}>
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
