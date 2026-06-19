import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

const AUDIT_ENTRIES = [
  { ts: '14:23:01.234', agent: 'healthcare-agent', action: 'inference', detail: 'classify · granite-2b-cpu · 828ms', type: 'inference', color: 'var(--intel-cyan)' },
  { ts: '14:23:05.891', agent: 'healthcare-agent', action: 'tool_call', detail: 'drug_interaction_check · 4 interactions found', type: 'tool', color: 'var(--rh-teal)' },
  { ts: '14:23:06.102', agent: 'healthcare-agent', action: 'inference', detail: 'summarize · qwen25-3b-cpu · 4,567ms', type: 'inference', color: 'var(--intel-cyan)' },
  { ts: '14:23:06.500', agent: 'finserv-agent', action: 'inference', detail: 'score_transaction · risk: CRITICAL · 85', type: 'inference', color: 'var(--rh-red)' },
  { ts: '14:23:06.502', agent: 'finserv-agent', action: 'decision', detail: 'recommendation: BLOCK · 4 signals', type: 'decision', color: 'var(--rh-orange)' },
  { ts: '14:23:07.100', agent: 'orchestrator', action: 'workflow', detail: 'cross-vertical dispatch · 2 agents · complete', type: 'workflow', color: 'var(--rh-green)' },
  { ts: '14:23:07.105', agent: 'orchestrator', action: 'a2a_discovery', detail: 'agent_card refresh · 2 agents healthy', type: 'discovery', color: 'var(--ibm-blue)' },
]

const COMPLIANCE = [
  { reg: 'HIPAA', requirement: 'Record all access to PHI data', status: 'Every inference logged with input hash', color: 'var(--rh-green)' },
  { reg: 'SOX', requirement: 'Audit trail for financial decisions', status: 'Fraud scores + recommendations tracked', color: 'var(--rh-green)' },
  { reg: 'GDPR', requirement: 'Data processing records', status: 'Agent, model, timestamp per request', color: 'var(--rh-green)' },
]

export function Act05AuditTrail({ onComplete }: Props) {
  const [showEntries, setShowEntries] = useState(false)
  const [showCompliance, setShowCompliance] = useState(false)

  return (
    <div className="demo-section">
      <h3><span className="section-num">05</span> The Audit Trail</h3>
      <div className="section-context">
        Every inference call, every tool invocation, every agent decision — logged
        to PostgreSQL. Queryable by agent, timestamp, action type. Exportable to
        SIEM, compliance dashboards, BI tools.
      </div>

      {!showEntries && (
        <motion.div style={{ textAlign: 'center', marginTop: 24 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button className="btn btn-secondary" onClick={() => setShowEntries(true)}>
            Show audit log →
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {showEntries && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Live Audit Stream</div>
            <div style={{
              background: 'var(--surface-1)', borderRadius: 10, border: '1px solid var(--border)',
              padding: '12px', maxHeight: 320, overflowY: 'auto',
            }}>
              {AUDIT_ENTRIES.map((entry, i) => (
                <motion.div key={i} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0',
                  borderBottom: i < AUDIT_ENTRIES.length - 1 ? '1px solid var(--border)' : 'none',
                }} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.25, duration: 0.3 }}>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-disabled)', minWidth: 85, flexShrink: 0 }}>{entry.ts}</div>
                  <div style={{
                    fontSize: 9, padding: '1px 6px', borderRadius: 3, flexShrink: 0, minWidth: 55, textAlign: 'center',
                    background: `color-mix(in srgb, ${entry.color} 12%, transparent)`,
                    color: entry.color, fontWeight: 600,
                  }}>{entry.action}</div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--ibm-blue)', fontWeight: 600 }}>{entry.agent}</span>
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>{entry.detail}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 8 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: AUDIT_ENTRIES.length * 0.25 + 0.3 }}>
              PostgreSQL · queryable · exportable · every AI decision recorded
            </motion.div>

            {!showCompliance && (
              <motion.div style={{ textAlign: 'center', marginTop: 16 }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: AUDIT_ENTRIES.length * 0.25 + 0.5 }}>
                <button className="btn btn-secondary" onClick={() => setShowCompliance(true)}>
                  Compliance mapping →
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCompliance && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, marginTop: 20 }}>Regulatory Compliance</div>
            {COMPLIANCE.map((c, i) => (
              <motion.div key={c.reg} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px',
                borderRadius: 8, background: 'var(--surface-2)', border: `1px solid ${c.color}`,
                marginBottom: 8,
              }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: c.color, minWidth: 50,
                  padding: '2px 8px', borderRadius: 4, background: `color-mix(in srgb, ${c.color} 12%, transparent)`,
                  textAlign: 'center',
                }}>{c.reg}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.requirement}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{c.status}</div>
                </div>
                <motion.div style={{ fontSize: 14, color: 'var(--rh-green)' }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.15 + 0.2, type: 'spring', stiffness: 400 }}>
                  ✓
                </motion.div>
              </motion.div>
            ))}

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button className="btn btn-primary" onClick={onComplete} style={{ background: 'var(--ibm-blue)' }}>
                The punchline →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
