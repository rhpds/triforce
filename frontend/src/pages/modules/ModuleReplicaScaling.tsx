import { useState } from 'react'
import { motion } from 'motion/react'
import { ModuleLayout, StepCard } from '../../components/ModuleLayout'

export default function ModuleReplicaScaling() {
  const [results, setResults] = useState<{ concurrency: number; avgMs: number; maxMs: number; wallMs: number }[]>([])
  const [running, setRunning] = useState(false)

  const runLoadTest = async (n: number) => {
    setRunning(true)
    const start = performance.now()
    const promises = Array.from({ length: n }, () =>
      fetch('/healthcare/api/v1/pipeline', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin.' , skip_cache: true}) })
        .then(r => r.json()).then(d => d.total_ms).catch(() => 0)
    )
    const latencies = await Promise.all(promises)
    const wallMs = Math.round(performance.now() - start)
    const valid = latencies.filter(l => l > 0)
    setResults(prev => [...prev, {
      concurrency: n,
      avgMs: valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0,
      maxMs: valid.length ? Math.max(...valid) : 0,
      wallMs,
    }])
    setRunning(false)
  }

  return (
    <ModuleLayout title="Agent + Model Replica Scaling" description="Scale agent pods and model serving replicas independently. Agent replicas reduce latency ~20-30%. Model serving replicas unlock throughput." status="live">
      <StepCard num={1} title="Load Test at Different Concurrency">
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>
          Fire concurrent pipeline requests. Watch latency climb as concurrency increases — this shows where you need more replicas.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {[3, 5, 10].map(n => (
            <button key={n} className="btn btn-secondary" onClick={() => runLoadTest(n)} disabled={running} style={{ fontSize: 12 }}>
              {running ? '...' : `${n} concurrent`}
            </button>
          ))}
          <button className="btn btn-secondary" onClick={() => setResults([])} disabled={running} style={{ fontSize: 12 }}>Clear</button>
        </div>
      </StepCard>

      {results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <StepCard num={2} title="Results">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-dim)' }}>Concurrent</th>
                <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-dim)' }}>Avg Latency</th>
                <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-dim)' }}>Max Latency</th>
                <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-dim)' }}>Wall Clock</th>
              </tr></thead>
              <tbody>{results.map((r, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="mono" style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>{r.concurrency}</td>
                  <td className="mono" style={{ padding: '8px', textAlign: 'right', color: 'var(--intel-cyan)' }}>{(r.avgMs / 1000).toFixed(1)}s</td>
                  <td className="mono" style={{ padding: '8px', textAlign: 'right', color: 'var(--rh-orange)' }}>{(r.maxMs / 1000).toFixed(1)}s</td>
                  <td className="mono" style={{ padding: '8px', textAlign: 'right' }}>{(r.wallMs / 1000).toFixed(1)}s</td>
                </motion.tr>
              ))}</tbody>
            </table>
          </StepCard>

          {results.length >= 2 && (
            <StepCard num={3} title="Insight">
              <div style={{ fontSize: 14, color: 'var(--rh-green)', fontWeight: 600, lineHeight: 1.7 }}>
                Latency climbs with concurrency — the model serving layer is the bottleneck.
                Adding agent replicas helps latency ~20-30%. Adding vLLM workers behind LiteLLM is where throughput scales linearly.
                Both are config changes on existing hardware. No new procurement.
              </div>
            </StepCard>
          )}
        </motion.div>
      )}
    </ModuleLayout>
  )
}
