import { motion } from 'motion/react'
import { useDemoMetrics } from '../../DemoContext'

interface Props { onComplete?: () => void }

function fmt(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function Act06SecurePunchline({ onComplete }: Props) {
  const { pipeline } = useDemoMetrics()
  const p = pipeline

  const metrics = [
    { label: 'Memory Encryption', value: 'AES-256', detail: 'Hardware keys in silicon', color: 'var(--intel-cyan)' },
    { label: 'Attestation', value: 'vTPM + KBS', detail: 'No TDX = no secrets', color: 'var(--rh-green)' },
    { label: 'Pipeline Latency', value: p ? fmt(p.totalMs) : '—', detail: p?.source === 'cached' ? 'from previous run' : p ? 'live on Xeon 6' : 'run pipeline first', color: 'var(--intel-cyan)' },
    { label: 'Code Changes', value: '0', detail: 'Same image, same code', color: 'var(--rh-green)' },
    { label: 'Deploy Change', value: '1 line', detail: 'runtimeClassName: kata-cc', color: 'var(--rh-red)' },
  ]

  const sovereignty = [
    { check: 'Data stays on-premise', detail: 'No cloud API calls. Inference runs on your hardware.', pass: true },
    { check: 'Models are open-weight', detail: 'IBM Granite, Qwen, Phi — inspectable, auditable, replaceable.', pass: true },
    { check: 'Hardware is Intel-owned', detail: 'Xeon 6 + Gaudi 3. Single-vendor, no third-party accelerator.', pass: true },
    { check: 'Memory is hardware-encrypted', detail: 'Intel TDX. Data never exists in plaintext during inference.', pass: true },
    { check: 'Every inference is audited', detail: 'PostgreSQL inference log + IBM Kagenti agent governance.', pass: true },
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
        style={{ margin: '24px 0' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Digital Sovereignty Scorecard</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sovereignty.map((s, i) => (
            <motion.div
              key={s.check}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 6, background: 'var(--surface-2)' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <span style={{ fontSize: 16, color: 'var(--rh-green)' }}>{s.pass ? '✓' : '✗'}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.check}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{s.detail}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="card"
        style={{ background: 'var(--surface-2)', borderLeft: '3px solid var(--intel-cyan)', textAlign: 'center' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--intel-cyan)' }}>
            runtimeClassName: kata-cc
          </strong><br />
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Hardware-encrypted AI inference. On infrastructure you own. With models you control. Every call audited.
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
