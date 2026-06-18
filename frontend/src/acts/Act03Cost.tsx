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

export function Act03Cost() {
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

        {COSTS.map(c => (
          <div className="cost-row" key={c.name}>
            <div className="cost-label">{c.name}</div>
            <div className="cost-track">
              <div className="cost-fill" style={{
                width: `${Math.max((c.annual / MAX) * 100, 3)}%`,
                background: c.color,
              }}>
                <span>${c.annual.toLocaleString()}/yr</span>
              </div>
            </div>
            <div className="cost-delta" style={{
              color: c.annual <= 15000 ? 'var(--rh-green)' : c.annual < 30000 ? 'var(--rh-teal)' : 'var(--rh-orange)',
            }}>
              {c.honest}
            </div>
          </div>
        ))}
      </div>

      <div className="card card-accent-intel" style={{ marginTop: 24 }}>
        <strong style={{ color: 'var(--intel-cyan)' }}>The honest take:</strong>
        <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
          At low volume, APIs win. At enterprise scale (&gt;149K records/month),
          Xeon 6 wins — $0/token, no rate limits, your data stays on your hardware.
        </span>
      </div>
    </div>
  )
}
