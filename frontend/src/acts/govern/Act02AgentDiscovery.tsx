import { useState } from 'react'
import { motion } from 'motion/react'

interface Props { onComplete?: () => void }

const FALLBACK_AGENTS = [
  { name: 'Healthcare Agent', url: 'http://healthcare-agent:8081', status: 'active', skills: [{ id: 'classify', name: 'Classify Document' }, { id: 'extract', name: 'Extract Entities' }, { id: 'summarize', name: 'Summarize Record' }], spiffe: 'spiffe://triforce/agent/healthcare-agent' },
  { name: 'Financial Services Agent', url: 'http://finserv-agent:8082', status: 'active', skills: [{ id: 'score', name: 'Score Transaction' }, { id: 'compliance', name: 'Check Compliance' }, { id: 'risk', name: 'Assess Risk' }], spiffe: 'spiffe://triforce/agent/finserv-agent' },
]

export function Act02AgentDiscovery({ onComplete }: Props) {
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [live, setLive] = useState(false)

  const discover = async () => {
    setLoading(true)
    try {
      const resp = await fetch('/orchestrator/api/v1/agents')
      const data = await resp.json()
      const discovered = (data.agents || []).map((a: any) => ({ ...a, spiffe: `spiffe://triforce/agent/${a.name?.toLowerCase().replace(/\s+/g, '-')}` }))
      setAgents(discovered.length > 0 ? discovered : FALLBACK_AGENTS)
      setLive(discovered.length > 0)
    } catch {
      setAgents(FALLBACK_AGENTS)
      setLive(false)
    }
    setDone(true)
    setLoading(false)
  }

  return (
    <div className="demo-section">
      <h3><span className="section-num">02</span> Agent Discovery</h3>
      <div className="section-context">
        Agents register themselves via A2A protocol. The orchestrator discovers
        them automatically — skills, capabilities, health status. No manual
        configuration. No service registry wiring.
      </div>

      <div className="step-card" style={{ borderLeft: '3px solid var(--ibm-blue)' }}>
        <span className="step-num" style={{ background: 'var(--ibm-blue)' }}>1</span>
        <strong>Discover Registered Agents</strong>
        <div className="step-question">Orchestrator queries /.well-known/agent-card.json on each registered agent</div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={discover} disabled={loading}
            style={{ background: 'var(--ibm-blue)' }}>
            {loading ? 'Discovering...' : done ? 'Discover again' : 'Discover Agents'}
          </button>
        </div>

        {agents.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {!live && (
              <div style={{ fontSize: 10, color: 'var(--text-disabled)', textAlign: 'center', marginBottom: 8 }}>
                simulated — backend not connected
              </div>
            )}
            {agents.map((a, i) => (
              <motion.div
                key={a.name}
                className="card"
                style={{ borderLeft: '3px solid var(--rh-green)', marginBottom: 10, padding: '14px 18px' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.3, duration: 0.4 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <motion.div className="health-dot alive"
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, delay: i * 0.3 + 0.2 }} />
                  <strong style={{ fontSize: 14 }}>{a.name}</strong>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>{a.url}</span>
                </div>

                <motion.div className="mono" style={{
                  fontSize: 10, color: 'var(--ibm-blue)', marginBottom: 8,
                  padding: '2px 8px', borderRadius: 4, background: 'var(--ibm-blue-dim)',
                  display: 'inline-block',
                }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.3 + 0.4 }}>
                  {a.spiffe}
                </motion.div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(a.skills || []).map((s: any, j: number) => (
                    <motion.span key={s.id} className="mono"
                      style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--rh-teal-dim)', color: 'var(--rh-teal)' }}
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.3 + 0.5 + j * 0.06 }}>
                      {s.name}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            ))}

            <motion.div className="card card-accent-ibm" style={{ textAlign: 'center' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: agents.length * 0.3 + 0.3 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {agents.length} agents discovered · {agents.reduce((a: number, ag: any) => a + (ag.skills?.length || 0), 0)} skills registered · <strong style={{ color: 'var(--rh-green)' }}>zero manual configuration</strong>
              </span>
            </motion.div>
          </div>
        )}
      </div>

      {done && (
        <motion.div style={{ textAlign: 'center', marginTop: 24 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <button className="btn btn-primary" onClick={onComplete} style={{ background: 'var(--ibm-blue)' }}>
            Zero-trust identity →
          </button>
        </motion.div>
      )}
    </div>
  )
}
