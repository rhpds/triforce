import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

const CAPABILITIES = [
  {
    num: 1,
    title: 'Agent Governance',
    question: '"How do I know what\'s running and who can talk to whom?"',
    detail: 'Agents register via A2A protocol. The orchestrator discovers them automatically — what they can do, what skills they expose, whether they\'re healthy. No manual wiring. Kagenti CRDs define agent runtime policies on OpenShift.',
    color: 'var(--ibm-blue)',
    live: true,
  },
  {
    num: 2,
    title: 'Data Sovereignty',
    question: '"Our patient data can\'t leave our network. Period."',
    detail: 'Every inference call runs on your Xeon servers inside your data center. No data sent to a cloud API. No tokens processed on someone else\'s hardware. The model runs where your firewall says it can.',
    color: 'var(--rh-red)',
    live: false,
  },
  {
    num: 3,
    title: 'Full Audit Trail',
    question: '"Compliance needs a paper trail for every AI decision."',
    detail: 'Every inference call logged to PostgreSQL — model used, latency, input hash, output classification. Every agent interaction traced. Every drug interaction lookup recorded. HIPAA, SOX, GDPR — the audit trail is built into the platform, not bolted on.',
    color: 'var(--rh-green)',
    live: true,
  },
]

export function Act04Platform({ onComplete }: Props) {
  const [revealed, setRevealed] = useState(0)
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [discovered, setDiscovered] = useState(false)

  const advance = () => {
    if (revealed < CAPABILITIES.length) {
      setRevealed(prev => prev + 1)
    }
  }

  const discoverAgents = async () => {
    setLoading(true)
    try {
      const resp = await fetch('/orchestrator/api/v1/agents')
      const data = await resp.json()
      setAgents(data.agents || [])
      setDiscovered(true)
    } catch {
      setAgents([])
    }
    setLoading(false)
  }

  const allRevealed = revealed >= CAPABILITIES.length

  return (
    <div className="demo-section">
      <h3><span className="section-num">06</span> Run It Yourself</h3>
      <div className="section-context">
        An API gives you inference. A platform gives you governance, data sovereignty,
        and a compliance audit trail. Here's what you get when AI runs on your
        infrastructure instead of someone else's.
      </div>

      {CAPABILITIES.map((cap, i) => (
        <AnimatePresence key={cap.num}>
          {revealed >= i + 1 && (
            <motion.div
              className="step-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ borderLeft: `3px solid ${cap.color}` }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span className="step-num" style={{ background: cap.color }}>{cap.num}</span>
                <div style={{ flex: 1 }}>
                  <strong>{cap.title}</strong>
                </div>
                {cap.live && (
                  <div style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 4,
                    background: 'var(--rh-green-dim)', color: 'var(--rh-green)', fontWeight: 600,
                  }}>
                    LIVE
                  </div>
                )}
              </div>

              <motion.div
                style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: 8, fontWeight: 500 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              >
                {cap.question}
              </motion.div>

              <motion.div
                style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7, marginBottom: cap.num === 1 ? 16 : 0 }}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              >
                {cap.detail}
              </motion.div>

              {cap.num === 1 && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                >
                  <button className="btn btn-primary" onClick={discoverAgents} disabled={loading || discovered}
                    style={{ background: 'var(--ibm-blue)', marginTop: 8 }}>
                    {loading ? 'Discovering...' : discovered ? 'Agents discovered' : 'Discover Agents via A2A'}
                  </button>

                  {agents.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      {agents.map((a, j) => (
                        <motion.div
                          className="card"
                          key={a.name}
                          style={{ borderLeft: `3px solid var(--rh-green)`, padding: '12px 16px', marginBottom: 8 }}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: j * 0.2 }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <motion.div className="health-dot alive"
                              initial={{ scale: 0 }} animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 500, delay: 0.1 + j * 0.2 }} />
                            <strong style={{ fontSize: 13 }}>{a.name}</strong>
                            <span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>{a.url}</span>
                          </div>
                          <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {a.skills?.map((s: any, k: number) => (
                              <motion.span key={s.id} className="mono"
                                style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--rh-teal-dim)', color: 'var(--rh-teal)' }}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + j * 0.2 + k * 0.05 }}>
                                {s.name}
                              </motion.span>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      ))}

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        {!allRevealed ? (
          <button className="btn btn-secondary" onClick={advance}>
            {revealed === 0
              ? `Start: ${CAPABILITIES[0].title} →`
              : `Next: ${CAPABILITIES[revealed].title} →`}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div style={{ fontSize: 13, color: 'var(--rh-green)', fontWeight: 600, marginBottom: 16 }}>
              Governance. Sovereignty. Audit. This is what "run it yourself" means.
            </div>
            <button className="btn btn-primary" onClick={onComplete}>
              The punchline →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
