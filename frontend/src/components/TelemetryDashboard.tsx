interface Stats {
  total_requests: number
  avg_latency_ms: number
  p95_latency_ms: number
  cpu_requests: number
  gpu_requests: number
  kv_cache_hit_rate: number
}

interface InferenceEntry {
  model: string
  task_type: string
  latency_ms: number
  accelerator: string
}

interface Props {
  stats: Stats
  inferences: InferenceEntry[]
}

function KpiCard({ label, value, unit, color }: { label: string; value: string; unit?: string; color: string }) {
  return (
    <div style={{
      padding: '16px 20px',
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      minWidth: 140,
    }}>
      <div style={{ fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>
        {value}
        {unit && <span style={{ fontSize: 14, fontWeight: 400, marginLeft: 2 }}>{unit}</span>}
      </div>
    </div>
  )
}

export function TelemetryDashboard({ stats, inferences }: Props) {
  const cpuPercent = stats.total_requests > 0
    ? Math.round((stats.cpu_requests / stats.total_requests) * 100)
    : 0

  return (
    <div data-testid="telemetry-dashboard">
      {/* KPI Row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <KpiCard label="Total Requests" value={stats.total_requests.toString()} color="#fff" />
        <KpiCard
          label="Avg Latency"
          value={stats.avg_latency_ms.toLocaleString()}
          unit="ms"
          color="#00AEEF"
        />
        <KpiCard
          label="P95 Latency"
          value={stats.p95_latency_ms.toLocaleString()}
          unit="ms"
          color="#F0AB00"
        />
        <KpiCard label="CPU Inference" value={`${cpuPercent}%`} color="#2ecc71" />
      </div>

      {/* CPU vs GPU donut */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 100, height: 100 }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke="#0071C5" strokeWidth="12"
                strokeDasharray={`${cpuPercent * 2.51} 251`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700,
            }}>
              {cpuPercent}%
            </div>
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>CPU / GPU Split</div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Accelerator Breakdown</div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
            <div><span style={{ color: '#0071C5' }}>■</span> Xeon 6 CPU: {stats.cpu_requests}</div>
            <div><span style={{ color: '#76B900' }}>■</span> GPU: {stats.gpu_requests}</div>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
            Zero GPU required — all inference on Intel Xeon 6
          </div>
        </div>
      </div>

      {/* Recent inferences table */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Recent Inference Calls</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#888', fontWeight: 500 }}>Model</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#888', fontWeight: 500 }}>Task</th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: '#888', fontWeight: 500 }}>Latency</th>
              <th style={{ textAlign: 'center', padding: '8px 12px', color: '#888', fontWeight: 500 }}>Accelerator</th>
            </tr>
          </thead>
          <tbody>
            {inferences.slice(0, 10).map((inf, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '8px 12px' }}>{inf.model}</td>
                <td style={{ padding: '8px 12px' }}>{inf.task_type}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{inf.latency_ms.toLocaleString()}ms</td>
                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    backgroundColor: inf.accelerator === 'cpu' ? 'rgba(0,113,197,0.2)' : 'rgba(118,185,0,0.2)',
                    color: inf.accelerator === 'cpu' ? '#0071C5' : '#76B900',
                  }}>
                    {inf.accelerator === 'cpu' ? 'Xeon 6' : 'GPU'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
