import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

const STEPS = [
  {
    id: 'spire',
    title: 'SPIRE Server Issues Identity',
    detail: 'The SPIRE server runs on the cluster. When a new agent pod starts, SPIRE verifies its workload attestation (namespace, service account, node) and issues a SPIFFE Verifiable Identity Document (SVID).',
    color: 'var(--ibm-blue)',
    visual: () => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
        <motion.div style={{ padding: '10px 16px', borderRadius: 8, background: 'var(--surface-2)', border: '2px solid var(--ibm-blue)', textAlign: 'center' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ibm-blue)' }}>SPIRE Server</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>workload attestation</div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <svg width="50" height="16" viewBox="0 0 50 16">
            <motion.line x1="0" y1="8" x2="38" y2="8" stroke="var(--ibm-blue)" strokeWidth="2"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 0.4 }} />
            <polygon points="36,4 44,8 36,12" fill="var(--ibm-blue)" />
          </svg>
          <div className="mono" style={{ fontSize: 9, color: 'var(--ibm-blue)', textAlign: 'center' }}>SVID</div>
        </motion.div>
        <motion.div style={{ padding: '10px 16px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--rh-green)', textAlign: 'center' }}
          initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--rh-green)' }}>Agent Pod</div>
          <motion.div className="mono" style={{ fontSize: 9, color: 'var(--ibm-blue)', marginTop: 4 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            identity: verified
          </motion.div>
        </motion.div>
      </div>
    ),
  },
  {
    id: 'sidecar',
    title: 'Sidecar Injection',
    detail: 'Kagenti injects a SPIFFE sidecar into each agent pod. The sidecar manages the SVID lifecycle — rotation, renewal, revocation. The application code never touches certificates.',
    color: 'var(--rh-red)',
    visual: () => (
      <div style={{ textAlign: 'center' }}>
        <motion.div style={{
          display: 'inline-block', padding: '14px 20px', borderRadius: 10,
          border: '2px solid var(--rh-green)', background: 'var(--surface-2)',
        }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>Agent Pod</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.div style={{ padding: '6px 12px', borderRadius: 6, background: 'var(--surface-1)', border: '1px solid var(--ibm-blue)', fontSize: 10, color: 'var(--ibm-blue)' }}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              SPIFFE sidecar
            </motion.div>
            <div style={{ padding: '6px 12px', borderRadius: 6, background: 'var(--surface-1)', border: '1px solid var(--rh-green)', fontSize: 10, color: 'var(--rh-green)' }}>
              healthcare-agent
            </div>
          </div>
        </motion.div>
        <motion.div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          Auto-injected · cert rotation · zero app code changes
        </motion.div>
      </div>
    ),
  },
  {
    id: 'mtls',
    title: 'mTLS Between Agents',
    detail: 'When agents communicate, both sides present their SVIDs. Mutual TLS verifies identity in both directions. No static API keys. No shared secrets. The infrastructure guarantees identity.',
    color: 'var(--rh-green)',
    visual: () => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        <motion.div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--ibm-blue)', textAlign: 'center' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ibm-blue)' }}>Healthcare</div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--text-dim)' }}>SVID: verified</div>
        </motion.div>
        <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <svg width="60" height="24" viewBox="0 0 60 24">
            <motion.line x1="0" y1="8" x2="48" y2="8" stroke="var(--rh-green)" strokeWidth="2"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 0.3 }} />
            <polygon points="46,4 54,8 46,12" fill="var(--rh-green)" />
            <motion.line x1="54" y1="16" x2="6" y2="16" stroke="var(--rh-green)" strokeWidth="2"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 0.3 }} />
            <polygon points="8,12 0,16 8,20" fill="var(--rh-green)" />
          </svg>
          <div className="mono" style={{ fontSize: 9, color: 'var(--rh-green)' }}>mTLS</div>
        </motion.div>
        <motion.div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--ibm-blue)', textAlign: 'center' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ibm-blue)' }}>FinServ</div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--text-dim)' }}>SVID: verified</div>
        </motion.div>
      </div>
    ),
  },
]

export function Act03Identity({ onComplete }: Props) {
  const [revealed, setRevealed] = useState(0)
  const allRevealed = revealed >= STEPS.length

  return (
    <div className="demo-section">
      <h3><span className="section-num">03</span> Zero-Trust Identity</h3>
      <div className="section-context">
        Every agent gets a cryptographic identity. No static keys. No shared secrets.
        SPIFFE verifies workload identity at the infrastructure level.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {STEPS.map((step, i) => (
          <AnimatePresence key={step.id}>
            {revealed >= i + 1 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {i > 0 && <motion.div style={{ width: 2, height: 16, background: step.color, margin: '0 auto' }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.3 }} />}
                <div className="step-card" style={{ borderLeft: `3px solid ${step.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span className="step-num" style={{ background: step.color }}>{i + 1}</span>
                    <strong>{step.title}</strong>
                  </div>
                  <motion.div style={{ marginBottom: 14 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>{step.visual()}</motion.div>
                  <motion.div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7 }} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>{step.detail}</motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        {!allRevealed ? (
          <button className="btn btn-secondary" onClick={() => setRevealed(prev => prev + 1)}>
            {revealed === 0 ? `Start: ${STEPS[0].title} →` : `Next: ${STEPS[revealed].title} →`}
          </button>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <button className="btn btn-primary" onClick={onComplete} style={{ background: 'var(--ibm-blue)' }}>Tool governance →</button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
