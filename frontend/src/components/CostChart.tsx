const COST_DATA = [
  { name: 'Intel Xeon 6', annual: 15000, perRecord: 0, category: 'self-hosted', color: '#0071C5' },
  { name: 'NVIDIA A100', annual: 64000, perRecord: 0, category: 'self-hosted', color: '#76B900' },
  { name: 'AMD MI300X', annual: 83333, perRecord: 0, category: 'self-hosted', color: '#ED1C24' },
  { name: 'NVIDIA H100', annual: 119333, perRecord: 0, category: 'self-hosted', color: '#76B900' },
  { name: 'Claude Haiku', annual: 840 * 12, perRecord: 0.0084, category: 'api', color: '#D4A574' },
  { name: 'Gemini 2.5 Pro', annual: 1500 * 12, perRecord: 0.015, category: 'api', color: '#4285F4' },
  { name: 'Claude Sonnet', annual: 2520 * 12, perRecord: 0.0252, category: 'api', color: '#D4A574' },
  { name: 'Claude Opus', annual: 4200 * 12, perRecord: 0.042, category: 'api', color: '#D4A574' },
]

const MAX_ANNUAL = Math.max(...COST_DATA.map(d => d.annual))

export function CostChart() {
  return (
    <div data-testid="cost-chart" style={{ padding: 16 }}>
      <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
        Annual Infrastructure Cost — 100K records/month
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {COST_DATA.map(item => {
          const width = Math.max((item.annual / MAX_ANNUAL) * 100, 2)
          const savings = item.annual - COST_DATA[0].annual

          return (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 130, fontSize: 13, textAlign: 'right', flexShrink: 0 }}>
                {item.name}
              </div>

              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{
                  height: 28,
                  width: `${width}%`,
                  backgroundColor: item.color,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: 8,
                  transition: 'width 0.8s ease',
                  minWidth: 60,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>
                    ${item.annual.toLocaleString()}/yr
                  </span>
                </div>
              </div>

              <div style={{ width: 100, fontSize: 11, color: '#888', flexShrink: 0 }}>
                {savings > 0 ? `+$${savings.toLocaleString()}` : 'baseline'}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        marginTop: 24,
        padding: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(0,113,197,0.1)',
        border: '1px solid rgba(0,113,197,0.2)',
        fontSize: 13,
      }}>
        <strong>Intel Xeon 6</strong> handles classification, NER, summarization, embeddings — 80% of
        enterprise AI workloads — at <strong>$15,000/year</strong> infrastructure cost.
        No per-token charges. No GPU hardware to manage.
      </div>
    </div>
  )
}
