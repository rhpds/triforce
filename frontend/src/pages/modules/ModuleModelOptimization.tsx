import { useState } from 'react'
import { motion } from 'motion/react'
import { ModuleLayout, StepCard } from '../../components/ModuleLayout'

export default function ModuleModelOptimization() {
  const [compareResult, setCompareResult] = useState<any>(null)
  const [running, setRunning] = useState(false)

  const runCompare = async () => {
    setRunning(true); setCompareResult(null)
    try {
      const resp = await fetch('/healthcare/api/v1/pipeline/compare', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin 500mg and Lisinopril 10mg. Recent STEMI with PCI to RCA. Aspirin 81mg and Clopidogrel 75mg.',
          classify_model: 'granite-2b-int8', ner_model: 'granite-2b-int8', summarize_model: 'granite-2b-int8',
          baseline_classify_model: 'granite-2b-cpu', baseline_ner_model: 'granite-2b-cpu', baseline_summarize_model: 'granite-2b-cpu' }) })
      setCompareResult(await resp.json())
    } catch { setCompareResult({ error: 'Backend not reachable — ensure services are running' }) }
    setRunning(false)
  }

  return (
    <ModuleLayout title="Model Optimization (INT8/AMX)" description="Same hardware, better inference. INT8 quantization via AMX instructions, optimized model variants, prompt tuning. Four independent levers that compound." status="live">
      <StepCard num={1} title="Optimization Levers">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { name: 'INT8 Quantization', desc: 'FP32 → INT8 reduces model size 4x. AMX instructions accelerate INT8 math.', status: 'Live', color: 'var(--rh-green)' },
            { name: 'Model Selection', desc: 'Right model per task: 2B for NER, 3B for classification. Don\'t overspend.', status: 'Live', color: 'var(--rh-green)' },
            { name: 'Prompt Tuning', desc: 'Shorter prompts = fewer input tokens = faster inference. Compact JSON output.', status: 'Live', color: 'var(--rh-green)' },
            { name: 'OMP Threads', desc: 'OMP_NUM_THREADS=32 on Xeon 6 128-core. Optimal thread-to-core ratio.', status: 'Live', color: 'var(--rh-green)' },
          ].map(o => (
            <div key={o.name} className="card" style={{ padding: 12, borderLeft: `3px solid ${o.color}` }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{o.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{o.desc}</div>
              <div className="mono" style={{ fontSize: 10, color: o.color, marginTop: 6 }}>{o.status}</div>
            </div>
          ))}
        </div>
      </StepCard>

      <StepCard num={2} title="Run FP32 vs INT8 Comparison">
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>Runs the full pipeline twice — once with FP32 models, once with INT8. Shows per-node latency delta.</p>
        <button className="btn btn-primary" onClick={runCompare} disabled={running} style={{ fontSize: 12 }}>{running ? 'Running comparison...' : 'Prove It — FP32 vs INT8 →'}</button>
      </StepCard>

      {compareResult && !compareResult.error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <StepCard num={3} title="Comparison Results">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-dim)' }}>Node</th>
                <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-dim)' }}>FP32</th>
                <th style={{ textAlign: 'right', padding: '8px', color: 'var(--intel-cyan)' }}>INT8</th>
                <th style={{ textAlign: 'right', padding: '8px', color: 'var(--rh-green)' }}>Delta</th>
              </tr></thead>
              <tbody>
                {compareResult.baseline?.inference_log?.map((b: any, i: number) => {
                  const o = compareResult.optimized?.inference_log?.[i]
                  const delta = o ? b.latency_ms - o.latency_ms : 0
                  const pct = b.latency_ms > 0 ? Math.round(delta / b.latency_ms * 100) : 0
                  return (
                    <tr key={b.node} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px' }}>{b.node}</td>
                      <td className="mono" style={{ padding: '8px', textAlign: 'right' }}>{b.latency_ms}ms</td>
                      <td className="mono" style={{ padding: '8px', textAlign: 'right', color: 'var(--intel-cyan)', fontWeight: 700 }}>{o?.latency_ms || '—'}ms</td>
                      <td className="mono" style={{ padding: '8px', textAlign: 'right', color: delta > 0 ? 'var(--rh-green)' : 'var(--rh-orange)', fontWeight: 600 }}>{delta > 0 ? `-${pct}%` : `+${Math.abs(pct)}%`}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 14, fontWeight: 700, color: 'var(--rh-green)' }}>{compareResult.speedup} faster · {compareResult.delta_ms}ms saved</div>
          </StepCard>
        </motion.div>
      )}

      {compareResult?.error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <StepCard num={3} title="Status">
            <div style={{ fontSize: 13, color: 'var(--text-disabled)', lineHeight: 1.6 }}>{compareResult.error}</div>
          </StepCard>
        </motion.div>
      )}
    </ModuleLayout>
  )
}
