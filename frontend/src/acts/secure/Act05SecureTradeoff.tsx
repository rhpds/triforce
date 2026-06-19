import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

const COMPARISON = [
  { metric: 'Inference Latency', standard: '~8.5s', confidential: '~9.2s', delta: '+8%', deltaColor: 'var(--rh-orange)' },
  { metric: 'Memory Request', standard: '512Mi', confidential: '640Mi', delta: '+25%', deltaColor: 'var(--rh-orange)' },
  { metric: 'Pod Startup', standard: '~2s', confidential: '~5s', delta: '+3s (attestation)', deltaColor: 'var(--rh-orange)' },
  { metric: 'Code Changes', standard: '0', confidential: '0', delta: 'none', deltaColor: 'var(--rh-green)' },
  { metric: 'Container Image', standard: 'Same', confidential: 'Same', delta: 'none', deltaColor: 'var(--rh-green)' },
  { metric: 'AI Model', standard: 'Same', confidential: 'Same', delta: 'none', deltaColor: 'var(--rh-green)' },
  { metric: 'Data in Memory', standard: 'Plaintext', confidential: 'AES-256 encrypted', delta: 'hardware protected', deltaColor: 'var(--intel-cyan)' },
  { metric: 'Secret Source', standard: 'Env var', confidential: 'Attested KBS', delta: 'hardware gated', deltaColor: 'var(--intel-cyan)' },
]

const MITIGATIONS = [
  {
    overhead: 'Latency (+8%)',
    levers: [
      { label: 'TDX-optimized model quantization', detail: 'INT8 inside Trust Domain — same AMX acceleration' },
      { label: 'Reduced TD context switching', detail: 'Pin vCPUs to physical cores — fewer exits from TD' },
      { label: 'Persistent Trust Domains', detail: 'Keep TD warm between requests — skip re-encryption' },
    ],
    color: 'var(--intel-cyan)',
  },
  {
    overhead: 'Memory (+25%)',
    levers: [
      { label: 'Trimmed guest kernel', detail: 'Minimal Kata kernel — strip drivers you don\'t need' },
      { label: 'Shared base image layers', detail: 'dm-verity verified rootfs shared across VMs' },
      { label: 'Right-sized VM memory', detail: 'Match VM memory to actual model footprint, not defaults' },
    ],
    color: 'var(--rh-red)',
  },
  {
    overhead: 'Startup (+3s)',
    levers: [
      { label: 'Pre-warmed VM pools', detail: 'Boot Kata VMs before workload arrives — attestation happens at pool creation' },
      { label: 'Cached attestation tokens', detail: 'Reuse attestation within trust window — don\'t re-attest every pod' },
      { label: 'Fast KBS response', detail: 'Co-locate Trustee on same node — sub-ms secret delivery' },
    ],
    color: 'var(--rh-orange)',
  },
]

export function Act05SecureTradeoff({ onComplete }: Props) {
  const [showMitigations, setShowMitigations] = useState(false)

  return (
    <div className="demo-section">
      <h3><span className="section-num">05</span> The Honest Tradeoff</h3>
      <div className="section-context">
        TDX adds overhead. The Kata VM takes longer to start. Memory requests are higher.
        Latency increases slightly. This is the honest cost of hardware encryption.
      </div>

      <motion.table
        style={{ width: '100%', borderCollapse: 'collapse', margin: '24px 0', fontSize: 13 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 500 }}>Metric</th>
            <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 500 }}>Standard</th>
            <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--intel-cyan)', fontWeight: 600 }}>Confidential</th>
            <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 500 }}>Delta</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON.map((row, i) => (
            <motion.tr key={row.metric} style={{ borderBottom: '1px solid var(--border)' }}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
              <td style={{ padding: '10px 16px' }}>{row.metric}</td>
              <td className="mono" style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-dim)' }}>{row.standard}</td>
              <td className="mono" style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--intel-cyan)', fontWeight: 700 }}>{row.confidential}</td>
              <td className="mono" style={{ padding: '10px 16px', textAlign: 'right', color: row.deltaColor, fontWeight: 600 }}>{row.delta}</td>
            </motion.tr>
          ))}
        </tbody>
      </motion.table>

      {!showMitigations && (
        <motion.div style={{ textAlign: 'center', marginTop: 16 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
            That's the cost. But every overhead has engineering levers to reduce it.
          </div>
          <button className="btn btn-secondary" onClick={() => setShowMitigations(true)}>
            How we engineer it down →
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {showMitigations && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, marginTop: 8 }}>
              The engineering path — reduce every overhead on the same hardware
            </div>

            {MITIGATIONS.map((group, gi) => (
              <motion.div
                key={group.overhead}
                className="step-card"
                style={{ borderLeft: `3px solid ${group.color}`, marginBottom: 12 }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.2 }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: group.color, marginBottom: 10 }}>
                  {group.overhead}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.levers.map((lever, li) => (
                    <motion.div
                      key={lever.label}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: gi * 0.2 + li * 0.1 + 0.15 }}
                    >
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                        background: group.color,
                      }} />
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{lever.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{lever.detail}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}

            <motion.div
              className="card"
              style={{ background: 'var(--surface-2)', borderLeft: '3px solid var(--intel-cyan)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--intel-cyan)' }}>
                  The overhead is real. The engineering to reduce it is real too.
                </strong><br />
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>
                  And for regulated industries processing PHI and PII —
                  data encryption isn't a feature you negotiate. It's a requirement you meet.
                </span>
              </p>
            </motion.div>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button className="btn btn-primary" onClick={onComplete}>
                The punchline →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
