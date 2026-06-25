import { useState } from 'react'
import { motion } from 'motion/react'
import { ModuleLayout, StepCard } from '../../components/ModuleLayout'

interface CacheStats {
  cache_size: number
  total_lookups: number
  cache_hits: number
  cache_misses: number
  hit_rate: number
  llm_reduction_pct: number
  enabled: boolean
}

interface PipelineRun {
  classification: string
  total_ms: number
  classify_model: string
  classify_ms: number
  cache_hit: boolean
}

const SAMPLE_TEXT = 'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin 500mg and Lisinopril 10mg. Recent STEMI with PCI to RCA.'

export default function ModuleAdaptiveCache() {
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [runs, setRuns] = useState<PipelineRun[]>([])
  const [running, setRunning] = useState(false)
  const [resetting, setResetting] = useState(false)

  const fetchStats = async () => {
    try {
      const resp = await fetch('/healthcare/api/v1/adaptive/stats')
      setStats(await resp.json())
    } catch {
      setStats(null)
    }
  }

  const resetCache = async () => {
    setResetting(true)
    try {
      await fetch('/healthcare/api/v1/adaptive/reset', { method: 'POST' })
      setRuns([])
      await fetchStats()
    } catch { /* ignore */ }
    setResetting(false)
  }

  const runPipeline = async () => {
    setRunning(true)
    try {
      const resp = await fetch('/healthcare/api/v1/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: SAMPLE_TEXT }),
      })
      const data = await resp.json()
      const classifyEntry = data.inference_log?.[0] || {}
      const run: PipelineRun = {
        classification: data.classification,
        total_ms: data.total_ms,
        classify_model: classifyEntry.model || 'unknown',
        classify_ms: classifyEntry.latency_ms || 0,
        cache_hit: classifyEntry.model === 'adaptive-cache' || classifyEntry.kv_cache_hit === true,
      }
      setRuns(prev => [...prev, run])
      await fetchStats()
    } catch { /* ignore */ }
    setRunning(false)
  }

  const runBatch = async (count: number) => {
    setRunning(true)
    for (let i = 0; i < count; i++) {
      try {
        const resp = await fetch('/healthcare/api/v1/pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: SAMPLE_TEXT }),
        })
        const data = await resp.json()
        const classifyEntry = data.inference_log?.[0] || {}
        setRuns(prev => [...prev, {
          classification: data.classification,
          total_ms: data.total_ms,
          classify_model: classifyEntry.model || 'unknown',
          classify_ms: classifyEntry.latency_ms || 0,
          cache_hit: classifyEntry.model === 'adaptive-cache' || classifyEntry.kv_cache_hit === true,
        }])
      } catch { break }
    }
    await fetchStats()
    setRunning(false)
  }

  return (
    <ModuleLayout
      title="Adaptive Classification"
      description="The system learns from its own LLM results. First call classifies via LLM. Subsequent identical documents return from cache in <1ms. Watch the hit rate climb."
      status="live"
    >
      <StepCard num={1} title="Reset Cache">
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>
          Start fresh — clear the classification cache so you can watch it learn from scratch.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={resetCache} disabled={resetting} style={{ fontSize: 12 }}>
            {resetting ? 'Resetting...' : 'Reset Cache'}
          </button>
          <button className="btn btn-secondary" onClick={fetchStats} style={{ fontSize: 12 }}>
            Check Stats
          </button>
          {stats && (
            <span className="mono" style={{ fontSize: 12, color: stats.cache_size === 0 ? 'var(--rh-green)' : 'var(--text-dim)' }}>
              cache={stats.cache_size} hits={stats.cache_hits} rate={stats.hit_rate > 0 ? (stats.hit_rate * 100).toFixed(0) + '%' : '0%'}
            </span>
          )}
        </div>
      </StepCard>

      <StepCard num={2} title="Run Pipeline — Watch the Cache Learn">
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>
          Run the same clinical text multiple times. First call: LLM classifies (~800ms). Every call after: cache returns in {'<'}1ms.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={runPipeline} disabled={running} style={{ fontSize: 12 }}>
            {running ? 'Running...' : 'Run 1 Pipeline'}
          </button>
          <button className="btn btn-secondary" onClick={() => runBatch(5)} disabled={running} style={{ fontSize: 12 }}>
            Run 5x
          </button>
          <button className="btn btn-secondary" onClick={() => runBatch(10)} disabled={running} style={{ fontSize: 12 }}>
            Run 10x
          </button>
        </div>
      </StepCard>

      {runs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Visual hit rate gauge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 120, height: 60, overflow: 'hidden', margin: '0 auto' }}>
                <div style={{ width: 120, height: 120, borderRadius: '50%', border: '8px solid var(--surface-2)', borderBottomColor: 'transparent', borderRightColor: 'transparent', transform: 'rotate(225deg)', position: 'absolute', top: 0 }} />
                <motion.div
                  style={{ width: 120, height: 120, borderRadius: '50%', border: '8px solid var(--rh-green)', borderBottomColor: 'transparent', borderRightColor: 'transparent', position: 'absolute', top: 0 }}
                  initial={{ rotate: 225 }}
                  animate={{ rotate: 225 + (stats ? stats.hit_rate * 270 : 0) }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <motion.div className="mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--rh-green)', marginTop: -4 }}
                key={stats?.hit_rate}
                initial={{ scale: 1.3 }} animate={{ scale: 1 }}>
                {stats ? (stats.hit_rate * 100).toFixed(0) : 0}%
              </motion.div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Cache Hit Rate</div>
            </div>
          </div>

          <StepCard num={3} title={`Results (${runs.length} runs)`}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'center', padding: '6px', color: 'var(--text-dim)' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '6px', color: 'var(--text-dim)' }}>Classify Model</th>
                  <th style={{ textAlign: 'right', padding: '6px', color: 'var(--text-dim)' }}>Classify</th>
                  <th style={{ textAlign: 'right', padding: '6px', color: 'var(--text-dim)' }}>Total</th>
                  <th style={{ textAlign: 'center', padding: '6px', color: 'var(--text-dim)' }}>Cache</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r, i) => (
                  <motion.tr key={i}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: '1px solid var(--border)', background: r.cache_hit ? 'var(--rh-green-dim)' : 'transparent' }}>
                    <td className="mono" style={{ padding: '6px', textAlign: 'center', color: 'var(--text-dim)' }}>{i + 1}</td>
                    <td className="mono" style={{ padding: '6px', fontWeight: 600, color: r.cache_hit ? 'var(--rh-green)' : 'var(--intel-cyan)' }}>{r.classify_model}</td>
                    <td className="mono" style={{ padding: '6px', textAlign: 'right', fontWeight: 700, color: r.cache_hit ? 'var(--rh-green)' : 'var(--text-primary)' }}>{r.classify_ms}ms</td>
                    <td className="mono" style={{ padding: '6px', textAlign: 'right', color: 'var(--text-dim)' }}>{r.total_ms}ms</td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>
                      {r.cache_hit
                        ? <span style={{ color: 'var(--rh-green)', fontWeight: 700 }}>HIT</span>
                        : <span style={{ color: 'var(--rh-orange)' }}>MISS</span>}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </StepCard>
        </motion.div>
      )}

      {stats && stats.total_lookups > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <StepCard num={4} title="Cache Stats">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, textAlign: 'center' }}>
              {[
                { label: 'Cache Size', value: stats.cache_size, color: 'var(--intel-cyan)' },
                { label: 'Hit Rate', value: (stats.hit_rate * 100).toFixed(0) + '%', color: 'var(--rh-green)' },
                { label: 'LLM Reduction', value: stats.llm_reduction_pct + '%', color: 'var(--rh-green)' },
                { label: 'Total Lookups', value: stats.total_lookups, color: 'var(--text-dim)' },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: '12px 8px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{s.label}</div>
                  <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </StepCard>

          <StepCard num={5} title="Insight">
            <div style={{ fontSize: 14, color: 'var(--rh-green)', fontWeight: 600, lineHeight: 1.7 }}>
              {stats.hit_rate > 0.5
                ? `${stats.llm_reduction_pct}% fewer LLM calls. The system learned from ${stats.cache_size} unique classifications. At 1M records/month, this means ${Math.round(stats.llm_reduction_pct / 100 * 1000000)} records skip the LLM entirely. Only possible at $0/token — cloud APIs give no incentive to cache.`
                : `Cache is warming up. Run more records to see the hit rate climb. After ~50 unique document types, 95%+ of classifications come from cache.`}
            </div>
          </StepCard>
        </motion.div>
      )}
    </ModuleLayout>
  )
}
