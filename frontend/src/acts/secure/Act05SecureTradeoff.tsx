import { motion } from 'motion/react'

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

export function Act05SecureTradeoff({ onComplete }: Props) {
  return (
    <div className="demo-section">
      <h3><span className="section-num">05</span> The Honest Tradeoff</h3>
      <div className="section-context">
        TDX adds overhead. The Kata VM takes longer to start. Memory requests are higher.
        Latency increases slightly. This is the honest cost of hardware encryption. The
        question is whether the protection is worth it.
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

      <motion.div
        className="card"
        style={{ background: 'var(--surface-2)', borderLeft: '3px solid var(--intel-cyan)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7 }}>
          <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>
            8% more latency. 25% more memory. 3 seconds longer startup.
          </span><br />
          <strong style={{ color: 'var(--intel-cyan)' }}>
            In exchange: hardware-encrypted patient data, attested secrets, zero code changes.
          </strong><br /><br />
          <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>
            For healthcare AI processing PHI — for financial services handling PII —
            data encryption isn't a feature. It's a requirement.
          </span>
        </p>
      </motion.div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
          <button className="btn btn-primary" onClick={onComplete}>
            The punchline →
          </button>
        </motion.div>
      </div>
    </div>
  )
}
