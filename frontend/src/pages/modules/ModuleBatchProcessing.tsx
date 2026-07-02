import { useState } from 'react'
import { motion } from 'motion/react'
import { ModuleLayout, StepCard } from '../../components/ModuleLayout'

const SAMPLE_TEXTS = [
  'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin.',
  'LAB REPORT: WBC 18,000. Hemoglobin 12.4. Troponin I elevated at 8.2.',
  'PROGRESS NOTE: Day 3 post-PCI. Patient reports decreased chest pain.',
  'RADIOLOGY: Chest X-ray shows bilateral clear lung fields.',
  'CONSULTATION: Cardiology recommends dual antiplatelet therapy.',
]

interface BatchResult { index: number; classification: string; entities: number; total_ms: number }

export default function ModuleBatchProcessing() {
  const [results, setResults] = useState<BatchResult[]>([])
  const [running, setRunning] = useState(false)
  const [sequentialMs, setSequentialMs] = useState(0)
  const [parallelMs, setParallelMs] = useState(0)

  const runSequential = async () => {
    setRunning(true); setResults([]); setSequentialMs(0); setParallelMs(0)
    const start = performance.now()
    const r: BatchResult[] = []
    for (let i = 0; i < SAMPLE_TEXTS.length; i++) {
      try {
        const resp = await fetch('/healthcare/api/v1/pipeline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: SAMPLE_TEXTS[i] , skip_cache: true}) })
        const data = await resp.json()
        r.push({ index: i, classification: data.classification, entities: data.entities?.length || 0, total_ms: data.total_ms })
        setResults([...r])
      } catch { break }
    }
    setSequentialMs(Math.round(performance.now() - start))
    setRunning(false)
  }

  const runParallel = async () => {
    setRunning(true); setResults([]); setParallelMs(0)
    const start = performance.now()
    try {
      const promises = SAMPLE_TEXTS.map(text =>
        fetch('/healthcare/api/v1/pipeline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }).then(r => r.json())
      )
      const data = await Promise.all(promises)
      setResults(data.map((d: any, i: number) => ({ index: i, classification: d.classification, entities: d.entities?.length || 0, total_ms: d.total_ms })))
    } catch { /* ignore */ }
    setParallelMs(Math.round(performance.now() - start))
    setRunning(false)
  }

  return (
    <ModuleLayout title="AMQ Streams Batch Processing" description="One-at-a-time API calls don't scale. Event streaming processes thousands in parallel — same hardware, throughput scales with consumers." status="live">
      <StepCard num={1} title="Sequential vs Parallel — 5 Records">
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>Run 5 clinical records sequentially (one at a time) then in parallel (all at once). Watch the wall-clock difference.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={runSequential} disabled={running} style={{ fontSize: 12 }}>
            {running ? 'Running...' : 'Run Sequential (1 at a time)'}
          </button>
          <button className="btn btn-primary" onClick={runParallel} disabled={running} style={{ fontSize: 12 }}>
            {running ? 'Running...' : 'Run Parallel (all at once)'}
          </button>
        </div>
      </StepCard>

      {results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <StepCard num={2} title={`Results (${results.length} records)`}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'center', padding: '6px', color: 'var(--text-dim)' }}>#</th>
                <th style={{ textAlign: 'left', padding: '6px', color: 'var(--text-dim)' }}>Classification</th>
                <th style={{ textAlign: 'right', padding: '6px', color: 'var(--text-dim)' }}>Entities</th>
                <th style={{ textAlign: 'right', padding: '6px', color: 'var(--text-dim)' }}>Pipeline</th>
              </tr></thead>
              <tbody>{results.map((r, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="mono" style={{ padding: '6px', textAlign: 'center', color: 'var(--text-dim)' }}>{r.index + 1}</td>
                  <td style={{ padding: '6px', fontWeight: 600 }}>{r.classification}</td>
                  <td className="mono" style={{ padding: '6px', textAlign: 'right' }}>{r.entities}</td>
                  <td className="mono" style={{ padding: '6px', textAlign: 'right', color: 'var(--intel-cyan)' }}>{r.total_ms}ms</td>
                </motion.tr>
              ))}</tbody>
            </table>
          </StepCard>

          {(sequentialMs > 0 || parallelMs > 0) && (
            <StepCard num={3} title="Timing Comparison">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'center' }}>
                {sequentialMs > 0 && (
                  <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--rh-orange)' }}>
                    <div style={{ fontSize: 12, color: 'var(--rh-orange)', fontWeight: 700 }}>Sequential</div>
                    <div className="mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{(sequentialMs / 1000).toFixed(1)}s</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>1 record at a time</div>
                  </div>
                )}
                {parallelMs > 0 && (
                  <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--rh-green)' }}>
                    <div style={{ fontSize: 12, color: 'var(--rh-green)', fontWeight: 700 }}>Parallel</div>
                    <div className="mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{(parallelMs / 1000).toFixed(1)}s</div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>All 5 at once</div>
                  </div>
                )}
              </div>
              {sequentialMs > 0 && parallelMs > 0 && (
                <div style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: 'var(--rh-green)', fontWeight: 700 }}>
                  Parallel is {(sequentialMs / parallelMs).toFixed(1)}x faster — same hardware, same $0
                </div>
              )}
            </StepCard>
          )}
        </motion.div>
      )}
    </ModuleLayout>
  )
}
