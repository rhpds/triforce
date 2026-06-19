import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

const COMPARISON = [
  { metric: 'CPU per node', vmOnly: '4 cores (VM)', shared: '8 cores (VM+AI)', delta: '+4 cores', deltaColor: 'var(--rh-orange)' },
  { metric: 'Memory per node', vmOnly: '8Gi (VM)', shared: '11Gi (VM+AI)', delta: '+3Gi', deltaColor: 'var(--rh-orange)' },
  { metric: 'Management interfaces', vmOnly: '1 (vSphere/RHV)', shared: '1 (OpenShift)', delta: 'unified', deltaColor: 'var(--rh-green)' },
  { metric: 'AI capability', vmOnly: 'None', shared: 'Classification, NER, fraud', delta: 'added', deltaColor: 'var(--intel-cyan)' },
  { metric: 'New hardware', vmOnly: '—', shared: '0', delta: 'none needed', deltaColor: 'var(--rh-green)' },
  { metric: 'VM migration risk', vmOnly: '—', shared: 'Zero — VMs don\'t move', delta: 'none', deltaColor: 'var(--rh-green)' },
]

const MITIGATIONS = [
  { label: 'Resource quotas', detail: 'Guarantee VM resources — AI agents get what\'s left. VMs are never starved.', color: 'var(--rh-red)' },
  { label: 'Scheduler priorities', detail: 'PriorityClass ensures legacy VMs schedule first. AI agents are best-effort on remaining capacity.', color: 'var(--rh-red)' },
  { label: 'Node affinity', detail: 'Pin VMs to specific nodes if needed. AI agents spread across the rest of the fleet.', color: 'var(--rh-teal)' },
  { label: 'Horizontal pod autoscaling', detail: 'AI agents scale down under pressure. VMs are fixed. The scheduler manages the balance.', color: 'var(--intel-cyan)' },
]

export function Act05VirtTradeoff({ onComplete }: Props) {
  const [showMitigations, setShowMitigations] = useState(false)

  return (
    <div className="demo-section">
      <h3><span className="section-num">05</span> The Honest Tradeoff</h3>
      <div className="section-context">
        Shared infrastructure means shared resources. Running VMs and AI agents
        on the same node uses more total resources than either alone. Here's the
        honest picture — and how Kubernetes manages the balance.
      </div>

      <motion.table style={{ width: '100%', borderCollapse: 'collapse', margin: '24px 0', fontSize: 13 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 500 }}>Metric</th>
            <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 500 }}>VM Only</th>
            <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--rh-red)', fontWeight: 600 }}>VM + AI</th>
            <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 500 }}>Delta</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map((row, i) => (
            <motion.tr key={row.metric} style={{ borderBottom: '1px solid var(--border)' }}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
              <td style={{ padding: '10px 16px' }}>{row.metric}</td>
              <td className="mono" style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-dim)' }}>{row.vmOnly}</td>
              <td className="mono" style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--rh-red)', fontWeight: 700 }}>{row.shared}</td>
              <td className="mono" style={{ padding: '10px 16px', textAlign: 'right', color: row.deltaColor, fontWeight: 600 }}>{row.delta}</td>
            </motion.tr>
          ))}
        </tbody>
      </motion.table>

      {!showMitigations && (
        <motion.div style={{ textAlign: 'center', marginTop: 16 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
            More resources used — but you're already paying for the hardware. Here's how the platform manages it.
          </div>
          <button className="btn btn-secondary" onClick={() => setShowMitigations(true)}>
            How Kubernetes manages the balance →
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {showMitigations && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, marginTop: 8 }}>Platform controls — VMs are never starved</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MITIGATIONS.map((m, i) => (
                <motion.div key={m.label} style={{
                  padding: '10px 16px', borderRadius: 8, background: 'var(--surface-2)',
                  border: `1px solid ${m.color}`, display: 'flex', alignItems: 'flex-start', gap: 10,
                }} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0, background: m.color }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{m.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{m.detail}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div className="card card-accent-redhat" style={{ marginTop: 16 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--rh-red)' }}>Shared infrastructure means shared resources — but the platform manages the balance.</strong><br />
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>
                  VMs get guaranteed resources. AI agents use what's available. And you're running AI on hardware you already own — no new procurement.
                </span>
              </p>
            </motion.div>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button className="btn btn-primary" onClick={onComplete}>The punchline →</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
