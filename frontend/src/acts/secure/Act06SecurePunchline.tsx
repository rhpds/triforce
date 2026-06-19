import { motion } from 'motion/react'

interface Props { onComplete?: () => void }

export function Act06SecurePunchline({ onComplete }: Props) {
  const metrics = [
    { label: 'Memory Encryption', value: 'AES-256', detail: 'Hardware keys in silicon', color: 'var(--intel-cyan)' },
    { label: 'Attestation', value: 'vTPM + KBS', detail: 'No TDX = no secrets', color: 'var(--rh-green)' },
    { label: 'Code Changes', value: '0', detail: 'Same image, same code', color: 'var(--rh-green)' },
    { label: 'AMX Performance', value: 'Preserved', detail: 'AI acceleration inside TD', color: 'var(--intel-cyan)' },
    { label: 'Deploy Change', value: '1 line', detail: 'runtimeClassName: kata-cc', color: 'var(--rh-red)' },
  ]

  return (
    <div className="demo-section">
      <h3><span className="section-num">06</span> The Punchline</h3>
      <div className="section-context">
        Hardware-encrypted AI inference on Intel Xeon. Zero code changes.
        One line in the YAML. The same models, the same accuracy, the same
        $0/token cost — now with memory that no one can read.
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 10, margin: '24px 0',
      }}>
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            className="card"
            style={{ borderLeft: `3px solid ${m.color}`, padding: '12px 16px', textAlign: 'center' }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12 }}
          >
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{m.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{m.detail}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="card"
        style={{ background: 'var(--surface-2)', borderLeft: '3px solid var(--intel-cyan)', textAlign: 'center' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--intel-cyan)' }}>
            runtimeClassName: kata-cc
          </strong><br />
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            That's it. Hardware-encrypted AI inference. On CPUs you already own.
          </span>
        </p>
      </motion.div>

      {onComplete && (
        <motion.div style={{ textAlign: 'center', marginTop: 32 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
          <button className="btn btn-primary" onClick={onComplete}>
            What's next →
          </button>
        </motion.div>
      )}
    </div>
  )
}
