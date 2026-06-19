import { motion } from 'motion/react'
import { useDemoMetrics } from '../DemoContext'

interface Props { onComplete?: () => void }

function fmt(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function Act05HonestQuestion({ onComplete }: Props) {
  const { pipeline } = useDemoMetrics()

  const p = pipeline || { classifyMs: 0, nerMs: 0, interactionsMs: 0, summarizeMs: 0, totalMs: 0, entities: 0, interactions: 0 }
  const hasLive = pipeline !== null

  const metrics = [
    { label: 'Clinical Pipeline', value: '4 nodes · 3 models', detail: 'classify → NER → interactions → summarize', color: 'var(--intel-cyan)' },
    { label: 'Entities Extracted', value: hasLive ? String(p.entities) : '—', detail: hasLive ? 'from live pipeline run' : 'run pipeline in Act 02', color: 'var(--rh-teal)' },
    { label: 'Drug Interactions', value: hasLive ? `${p.interactions} found` : '—', detail: 'curated FDA database via MCP', color: 'var(--rh-orange)' },
    { label: 'Fraud Scored', value: '2 transactions', detail: '1 blocked (CRITICAL), 1 approved (LOW)', color: 'var(--rh-red)' },
    { label: 'Total Cost', value: '$0.00', detail: 'every call on Xeon 6 CPU', color: 'var(--rh-green)' },
  ]

  const comparison = [
    { task: 'Classification', today: hasLive ? fmt(p.classifyMs) : '—', optimized: 'with INT8', cost: '$0.00' },
    { task: 'NER', today: hasLive ? fmt(p.nerMs) : '—', optimized: 'with INT8', cost: '$0.00' },
    { task: 'Summarization', today: hasLive ? fmt(p.summarizeMs) : '—', optimized: 'with INT8', cost: '$0.00' },
    { task: 'Drug Interaction Check', today: hasLive ? fmt(p.interactionsMs) : '—', optimized: 'data lookup', cost: '$0.00' },
    { task: 'Full Pipeline', today: hasLive ? fmt(p.totalMs) : '—', optimized: 'with INT8', cost: '$0.00' },
  ]

  return (
    <div className="demo-section">
      <h3><span className="section-num">06</span> The Punchline</h3>
      <div className="section-context">
        You just ran real AI workloads on Intel Xeon 6 CPUs. No GPUs. No cloud API.
        No per-token charges. Here are the real numbers from this demo run.
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>What you just saw</div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 10, marginBottom: 24,
      }}>
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            className="card"
            style={{ borderLeft: `3px solid ${m.color}`, padding: '12px 16px' }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{m.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{m.detail}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Real latency — from this run on Xeon 6
      </motion.div>

      <motion.table
        style={{ width: '100%', borderCollapse: 'collapse', margin: '0 0 16px', fontSize: 13 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 500 }}>Task</th>
            <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--intel-cyan)', fontWeight: 600 }}>Xeon 6 (this run)</th>
            <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 500 }}>Optimized</th>
            <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--rh-green)', fontWeight: 600 }}>Cost</th>
          </tr>
        </thead>
        <tbody>
          {comparison.map((row, i) => (
            <motion.tr
              key={row.task}
              style={{ borderBottom: '1px solid var(--border)' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.08 }}
            >
              <td style={{ padding: '10px 16px' }}>{row.task}</td>
              <td className="mono" style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--intel-cyan)', fontWeight: 700 }}>{row.today}</td>
              <td className="mono" style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-disabled)' }}>{row.optimized}</td>
              <td className="mono" style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--rh-green)', fontWeight: 700 }}>{row.cost}</td>
            </motion.tr>
          ))}
        </tbody>
      </motion.table>

      <motion.div
        className="card"
        style={{ background: 'var(--surface-2)', borderLeft: '3px solid var(--intel-cyan)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7 }}>
          {hasLive ? (
            <>
              This pipeline ran at <strong style={{ color: 'var(--intel-cyan)' }}>{fmt(p.totalMs)}</strong> on Intel Xeon 6.
              Classification in <strong style={{ color: 'var(--intel-cyan)' }}>{fmt(p.classifyMs)}</strong>.{' '}
              <strong style={{ color: 'var(--rh-green)' }}>Cost: $0.00.</strong><br /><br />
            </>
          ) : null}
          <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>
            GPU is faster. But for 80% of enterprise AI — classification, NER, fraud scoring,
            summarization — the question was never "is it the fastest?"
          </span><br />
          <strong style={{ color: 'var(--rh-green)', fontSize: 16 }}>
            The question is: "is it fast enough at $0?"
          </strong>
        </p>
      </motion.div>

      {onComplete && (
        <motion.div
          style={{ textAlign: 'center', marginTop: 32 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <button className="btn btn-primary" onClick={onComplete}>
            What's next →
          </button>
        </motion.div>
      )}
    </div>
  )
}
