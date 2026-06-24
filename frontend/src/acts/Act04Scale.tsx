import { useState, useRef, useCallback } from 'react'
import { motion } from 'motion/react'

interface Props { onComplete?: () => void }

const TIERS = [
  { count: 10, label: '10 records' },
  { count: 30, label: '30 records' },
  { count: 50, label: '50 records' },
]

const SAMPLE_TEXTS = [
  'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin and Lisinopril. Recent STEMI with PCI to RCA.',
  'PROGRESS NOTE: 58-year-old female with Hypertension on Amlodipine 10mg. Blood pressure well controlled at 128/82.',
  'LAB REPORT: 45-year-old male. HbA1c 7.2%, fasting glucose 142 mg/dL. Currently on Metformin 1000mg BID.',
  'CONSULTATION: 67-year-old female presenting with chest pain. History of Atrial Fibrillation on Warfarin.',
  'DISCHARGE SUMMARY: 81-year-old male with CHF on Furosemide and Lisinopril. Admitted for fluid overload.',
]

interface TierResult {
  count: number
  completed: number
  avgLatencyMs: number
  totalMs: number
  throughputPerMin: number
}

export function Act04Scale({ onComplete }: Props) {
  const [tierIdx, setTierIdx] = useState(-1)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(0)
  const [latencies, setLatencies] = useState<number[]>([])
  const [tierResults, setTierResults] = useState<TierResult[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const runTier = useCallback(async (count: number, idx: number) => {
    setRunning(true)
    setCompleted(0)
    setLatencies([])
    setTierIdx(idx)

    const controller = new AbortController()
    abortRef.current = controller

    const startAll = performance.now()
    const promises = Array.from({ length: count }, (_, i) => {
      const text = SAMPLE_TEXTS[i % SAMPLE_TEXTS.length]
      return fetch('/healthcare/api/v1/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      })
        .then(r => r.json())
        .then(data => {
          setCompleted(prev => prev + 1)
          setLatencies(prev => [...prev, data.total_ms])
          return data.total_ms
        })
        .catch(() => {
          setCompleted(prev => prev + 1)
          return 0
        })
    })

    const results = await Promise.all(promises)
    const totalWallMs = performance.now() - startAll
    const valid = results.filter(r => r > 0)
    const avg = valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0
    const throughput = totalWallMs > 0 ? Math.round((valid.length / totalWallMs) * 60000) : 0

    const tierResult: TierResult = {
      count,
      completed: valid.length,
      avgLatencyMs: avg,
      totalMs: Math.round(totalWallMs),
      throughputPerMin: throughput,
    }
    setTierResults(prev => [...prev, tierResult])
    setRunning(false)
  }, [])

  const pointMade = tierResults.length >= 2

  return (
    <div className="demo-section">
      <h3><span className="section-num">04</span> Scale & Tradeoffs</h3>
      <div className="section-context">
        The benchmarks showed per-request tradeoffs. Now let's test throughput.
        Fire concurrent requests and watch latency climb under load on CPU.
        This is where heterogeneous routing earns its keep — GPU handles the
        overflow when CPU hits its ceiling.
      </div>

      <div className="step-card">
        <span className="step-num">1</span>
        <strong>Live Scale Test</strong>
        <div className="step-question">Concurrent clinical NLP pipeline requests — watch latency climb while cost stays flat</div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {TIERS.map((tier, i) => {
            const isDone = tierResults.some(r => r.count === tier.count)
            const isCurrent = tierIdx === i && running
            return (
              <button
                key={tier.count}
                className={isDone ? 'btn btn-primary' : 'btn btn-secondary'}
                disabled={running || isDone}
                onClick={() => runTier(tier.count, i)}
                style={isDone ? { opacity: 0.7 } : isCurrent ? { borderColor: 'var(--intel-cyan)' } : {}}
              >
                {isCurrent ? `Running ${tier.label}...` : isDone ? `${tier.label} done` : `Run ${tier.label}`}
              </button>
            )
          })}
        </div>

        {running && (
          <motion.div
            style={{ textAlign: 'center', marginTop: 20 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Completed</div>
                <motion.div
                  className="pipe-node-latency"
                  style={{ fontSize: 28 }}
                  key={completed}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                >
                  {completed}/{TIERS[tierIdx]?.count}
                </motion.div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Avg Latency</div>
                <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : '—'}ms
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Cost</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--rh-green)' }}>$0.00</div>
              </div>
            </div>

            <div style={{ marginTop: 16, maxWidth: 400, margin: '16px auto 0' }}>
              <div className="cost-track">
                <motion.div
                  className="cost-fill"
                  style={{ background: 'var(--intel-cyan)' }}
                  animate={{ width: `${(completed / (TIERS[tierIdx]?.count || 1)) * 100}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {tierResults.length > 0 && !running && (
          <motion.div
            style={{ marginTop: 20 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-dim)', fontWeight: 500 }}>Concurrency</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-dim)', fontWeight: 500 }}>Avg Latency</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-dim)', fontWeight: 500 }}>Wall Clock</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--text-dim)', fontWeight: 500 }}>Throughput</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', color: 'var(--rh-green)', fontWeight: 600 }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {tierResults.map((r, i) => (
                  <motion.tr
                    key={r.count}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <td className="mono" style={{ padding: '8px 12px' }}>{r.count} records</td>
                    <td className="mono" style={{
                      padding: '8px 12px', textAlign: 'right',
                      color: r.avgLatencyMs > 15000 ? 'var(--rh-orange)' : 'var(--intel-cyan)',
                    }}>
                      {(r.avgLatencyMs / 1000).toFixed(1)}s
                    </td>
                    <td className="mono" style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                      {(r.totalMs / 1000).toFixed(1)}s
                    </td>
                    <td className="mono" style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--intel-cyan)' }}>
                      {r.throughputPerMin} rec/min
                    </td>
                    <td className="mono" style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--rh-green)' }}>
                      $0.00
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {tierResults.length >= 2 && (
              <motion.div
                style={{
                  marginTop: 12, fontSize: 13, color: 'var(--text-secondary)',
                  textAlign: 'center', lineHeight: 1.7,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Latency increased{' '}
                {`from ${(tierResults[0].avgLatencyMs / 1000).toFixed(1)}s to ${(tierResults[tierResults.length - 1].avgLatencyMs / 1000).toFixed(1)}s`}
                {' '}under load.
                Cost didn't move. <strong style={{ color: 'var(--intel-cyan)' }}>That's the trade.</strong>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {pointMade && !running && (
        <motion.div
          style={{ textAlign: 'center', marginTop: 20 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.7 }}>
            CPU latency climbs under concurrent load. Cost stays at $0.
            <br />
            <span style={{ color: 'var(--gpu-amber)' }}>GPU would handle this at ~1s latency</span> — but at $/token.
            <br />
            <strong style={{ color: 'var(--intel-cyan)' }}>The efficiency stack decides when CPU is enough and when to route to GPU.</strong>
          </div>
          <button className="btn btn-primary" onClick={onComplete}>
            See how we engineer it →
          </button>
        </motion.div>
      )}
    </div>
  )
}
