import { motion } from 'motion/react'
import { useDemoMetrics } from '../../DemoContext'

interface Props { onComplete?: () => void }

function fmt(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function Act06VirtPunchline({ onComplete }: Props) {
  const { pipeline } = useDemoMetrics()
  const p = pipeline

  const metrics = [
    { label: 'Servers', value: '1', detail: 'Intel Xeon 6', color: 'var(--intel-cyan)' },
    { label: 'Workload Types', value: '2', detail: 'VMs + containers', color: 'var(--rh-red)' },
    { label: 'Classify Latency', value: p ? fmt(p.classifyMs) : '—', detail: p?.source === 'cached' ? 'from previous run' : p ? 'VM → Agent on Xeon 6' : 'run classify first', color: 'var(--intel-cyan)' },
    { label: 'New Hardware', value: '0', detail: 'same nodes', color: 'var(--rh-green)' },
    { label: 'Deploy Command', value: '1', detail: 'helm install', color: 'var(--rh-red)' },
  ]

  return (
    <div className="demo-section">
      <h3><span className="section-num">06</span> The Punchline</h3>
      <div className="section-context">
        VMs and AI inference on the same Intel Xeon. No forklift migration.
        No separate GPU cluster. No new hardware. One platform manages both.
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
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
            <div style={{ fontSize: 22, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{m.detail}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="card"
        style={{ background: 'var(--surface-2)', borderLeft: '3px solid var(--rh-red)', textAlign: 'center' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--rh-red)' }}>
            virtualization.enabled=true
          </strong><br />
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            VMs and AI on the same Intel Xeon. No forklift required.
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
