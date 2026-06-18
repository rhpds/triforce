import { motion } from 'motion/react'

export function Act05HonestQuestion() {
  const metrics = [
    { label: 'Clinical Pipeline', value: '4 nodes · 3 models', detail: 'classify → NER → interactions → summarize', color: 'var(--intel-cyan)' },
    { label: 'Entities Extracted', value: '8', detail: '5 medications, 2 conditions, 1 procedure', color: 'var(--rh-teal)' },
    { label: 'Drug Interactions', value: '4 found', detail: 'from curated FDA database via MCP', color: 'var(--rh-orange)' },
    { label: 'Fraud Scored', value: '2 transactions', detail: '1 blocked (CRITICAL), 1 approved (LOW)', color: 'var(--rh-red)' },
    { label: 'Total Cost', value: '$0.00', detail: 'every call on Xeon 6 CPU', color: 'var(--rh-green)' },
  ]

  const comparison = [
    { task: 'Classification', today: '~800ms', optimized: '~300ms', cost: '$0.00' },
    { task: 'NER', today: '~4.3s', optimized: '~1.5s', cost: '$0.00' },
    { task: 'Summarization', today: '~4.5s', optimized: '~1.5s', cost: '$0.00' },
    { task: 'Drug Interaction Check', today: '16ms', optimized: '16ms', cost: '$0.00' },
    { task: 'Full Pipeline', today: '~9.6s', optimized: '~3.3s', cost: '$0.00' },
  ]

  return (
    <div className="demo-section">
      <h3><span className="section-num">06</span> The Punchline</h3>
      <div className="section-context">
        You just ran real AI workloads on Intel Xeon 6 CPUs. No GPUs. No cloud API.
        No per-token charges. Here's what that means when you apply the
        efficiency stack.
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
        The honest tradeoff — reframed
      </motion.div>

      <motion.table
        style={{ width: '100%', borderCollapse: 'collapse', margin: '0 0 16px' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 500, fontSize: 13 }}>Task</th>
            <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 500, fontSize: 13 }}>Xeon 6 Today</th>
            <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--intel-cyan)', fontWeight: 600, fontSize: 13 }}>Xeon 6 Optimized</th>
            <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--rh-green)', fontWeight: 600, fontSize: 13 }}>Cost</th>
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
              <td style={{ padding: '10px 16px', fontSize: 13 }}>{row.task}</td>
              <td className="mono" style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--text-dim)', fontSize: 13 }}>{row.today}</td>
              <td className="mono" style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--intel-cyan)', fontWeight: 700, fontSize: 13 }}>{row.optimized}</td>
              <td className="mono" style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--rh-green)', fontWeight: 700, fontSize: 13 }}>{row.cost}</td>
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
          Today's 9.6s pipeline becomes 3.3s with quantization and model optimization.<br />
          <strong style={{ color: 'var(--intel-cyan)' }}>Cost stays $0. The engineering is the product.</strong><br /><br />
          <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>
            GPU is faster. But for 80% of enterprise AI — classification, NER, fraud scoring,
            summarization — the question was never "is it the fastest?"
          </span><br />
          <strong style={{ color: 'var(--rh-green)', fontSize: 16 }}>
            The question is: "is it fast enough at $0?"
          </strong>
        </p>
      </motion.div>
    </div>
  )
}
