import { motion } from 'motion/react'

interface Props { onComplete?: () => void }

const COSTS = [
  { name: 'Intel Xeon 6', annual: 15000, color: 'var(--intel-cyan)', honest: 'baseline' },
  { name: 'gpt-oss-20b (Vertex)', annual: 562, color: 'var(--rh-green)', honest: 'API wins at low volume' },
  { name: 'Claude Haiku', annual: 10080, color: 'var(--rh-teal)', honest: 'API wins below 149K rec/mo' },
  { name: 'NVIDIA A100 server', annual: 64000, color: '#76B900', honest: '+$49K' },
  { name: 'AMD MI300X server', annual: 83333, color: '#ED1C24', honest: '+$68K' },
  { name: 'Claude Opus', annual: 50400, color: 'var(--rh-purple)', honest: '+$35K' },
  { name: 'NVIDIA H100 server', annual: 119333, color: '#76B900', honest: '+$104K' },
]

const MAX = Math.max(...COSTS.map(c => c.annual))

export function Act03Cost({ onComplete }: Props) {
  return (
    <div className="demo-section">
      <h3><span className="section-num">03</span> The Proof: Cost at Scale</h3>
      <div className="section-context">
        "Can I afford it?" Here's the honest comparison — including where the API
        is cheaper. Below 149K records/month, use Claude Haiku. Above that line,
        Xeon 6 saves $85K–$489K per year.
      </div>

      <div style={{ margin: '24px 0' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
          Annual Cost — 100K records/month (3 LLM calls per record)
        </div>

        {COSTS.map((c, i) => (
          <motion.div
            className="cost-row"
            key={c.name}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
          >
            <div className="cost-label">{c.name}</div>
            <div className="cost-track">
              <motion.div
                className="cost-fill"
                style={{ background: c.color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.max((c.annual / MAX) * 100, 3)}%` }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.08 }}
              >
                <span>${c.annual.toLocaleString()}/yr</span>
              </motion.div>
            </div>
            <div className="cost-delta" style={{
              color: c.annual <= 15000 ? 'var(--rh-green)' : c.annual < 30000 ? 'var(--rh-teal)' : 'var(--rh-orange)',
            }}>
              {c.honest}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="card card-accent-intel"
        style={{ marginTop: 24 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
      >
        <strong style={{ color: 'var(--intel-cyan)' }}>The honest take:</strong>
        <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
          At low volume, APIs win. At enterprise scale (&gt;149K records/month),
          Xeon 6 wins — $0/token, no rate limits, your data stays on your hardware.
        </span>
      </motion.div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button className="btn btn-primary" onClick={onComplete}>
          See the platform →
        </button>
      </div>
    </div>
  )
}
