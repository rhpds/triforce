import { useState } from 'react'
import { motion } from 'motion/react'

interface Props { onComplete?: () => void }

export function Act04Platform({ onComplete }: Props) {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const discoverAgents = async () => {
    setLoading(true)
    try {
      const resp = await fetch('/orchestrator/api/v1/agents')
      const data = await resp.json()
      setAgents(data.agents || [])
      setDone(true)
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
          {loading ? '⏳ Discovering...' : '🔍 Discover Agents'}
        </button>

        {agents.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {agents.map((a, i) => (
              <motion.div
                className="card"
                key={a.name}
                style={{ borderLeft: `3px solid ${a.status === 'active' ? 'var(--rh-green)' : 'var(--rh-orange)'}` }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.15 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <motion.div
                    className="health-dot alive"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, delay: 0.1 + i * 0.15 }}
                  />
                  <strong>{a.name}</strong>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{a.url}</span>
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {a.skills?.map((s: any, j: number) => (
                    <motion.span
                      key={s.id}
                      className="mono"
                      style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--rh-teal-dim)', color: 'var(--rh-teal)' }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.15 + j * 0.05 }}
                    >
                      {s.name}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {done && (
        <motion.div
          style={{ textAlign: 'center', marginTop: 24 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button className="btn btn-primary" onClick={onComplete}>
            The hardest question →
          </button>
        </motion.div>
      )}
    </div>
  )
}
