import { motion } from 'motion/react'
import { useDemoMetrics } from '../stores/demoStore'

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
    { label: 'CPU Cost', value: '$0.00', detail: 'every call on Xeon 6 CPU', color: 'var(--rh-green)' },
  ]

  const comparison = [
    { task: 'Classification', cpu: hasLive ? fmt(p.classifyMs) : '—', gpu: '~500ms (MAAS)', routing: 'CPU — no quality diff' },
    { task: 'NER', cpu: hasLive ? fmt(p.nerMs) : '—', gpu: '~3.8s (MAAS)', routing: 'CPU — good enough for batch' },
    { task: 'Summarization', cpu: hasLive ? fmt(p.summarizeMs) : '—', gpu: '~1.6s (MAAS)', routing: 'GPU — 3.3x faster (MAAS baseline), better output' },
    { task: 'Drug Interactions', cpu: hasLive ? fmt(p.interactionsMs) : '—', gpu: 'n/a', routing: 'MCP tool — no LLM needed' },
    { task: 'Full Pipeline', cpu: hasLive ? fmt(p.totalMs) : '—', gpu: '~3.5s (MAAS)', routing: 'Hybrid — CPU + GPU combined' },
  ]

  return (
    <div className="demo-section">
      <h3><span className="section-num">06</span> The Punchline</h3>
      <div className="section-context">
        You just ran real AI workloads. You benchmarked CPU vs GPU. You saw the efficiency stack.
        Here's the honest answer.
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
        The routing decision — CPU vs GPU per task
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
            <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--intel-cyan)', fontWeight: 600 }}>CPU (this run)</th>
            <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--gpu-amber)', fontWeight: 600 }}>Gaudi</th>
            <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 500 }}>Routing Decision</th>
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
              <td className="mono" style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--intel-cyan)', fontWeight: 700 }}>{row.cpu}</td>
              <td className="mono" style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--gpu-amber)', fontWeight: 600 }}>{row.gpu}</td>
              <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-dim)' }}>{row.routing}</td>
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
              This pipeline ran at <strong style={{ color: 'var(--intel-cyan)' }}>{fmt(p.totalMs)}</strong> on Intel Xeon 6 CPU.{' '}
              <strong style={{ color: 'var(--rh-green)' }}>Cost: $0.00.</strong><br /><br />
            </>
          ) : null}
          <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>
            The question isn't "CPU or GPU." It's: which tasks need which hardware?
            Classification and NER run fine on CPU at $0. Summarization and reasoning benefit from GPU.
            The semantic router makes that decision in {'<'}1ms per request.
          </span><br /><br />
          <strong style={{ color: 'var(--rh-green)', fontSize: 16 }}>
            Most inference tasks ran within SLA on CPU at $0/token. GPU pays for itself where quality or speed demands it. The system decides for you.
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
