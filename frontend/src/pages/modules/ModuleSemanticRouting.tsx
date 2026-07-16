import { useState } from 'react'
import { motion } from 'motion/react'
import { ModuleLayout, StepCard } from '../../components/ModuleLayout'

const SAMPLES = [
  { label: 'Simple — Classify', text: 'Classify this clinical document type' },
  { label: 'Simple — Label', text: 'What type of report is this' },
  { label: 'Medium — Summarize', text: 'Summarize this patient record for physician handoff' },
  { label: 'Medium — Extract', text: 'List all medications mentioned in this clinical note' },
  { label: 'Complex — Diagnosis', text: 'Provide a differential diagnosis for this presentation considering drug interactions and renal function' },
  { label: 'Complex — Reasoning', text: 'Synthesize the findings and evaluate the cardiovascular risk given comorbidities and contraindications' },
]

interface RouteResult { route: string; model: string; model_params: string; confidence: number; method: string; hardware: string; latency_ms: number; scores: Record<string, number> }

export default function ModuleSemanticRouting() {
  const [customText, setCustomText] = useState('')
  const [results, setResults] = useState<{ label: string; result: RouteResult }[]>([])
  const [running, setRunning] = useState(false)

  const classify = async (text: string) => {
    try {
      const resp = await fetch('/router/classify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      return await resp.json()
    } catch { return { route: 'error', model: 'unavailable', confidence: 0, latency_ms: 0, method: 'error', hardware: 'unknown', scores: {} } }
  }

  const runAll = async () => {
    setRunning(true); setResults([])
    const r: { label: string; result: RouteResult }[] = []
    for (const s of SAMPLES) { r.push({ label: s.label, result: await classify(s.text) }); setResults([...r]) }
    setRunning(false)
  }

  const runCustom = async () => {
    if (!customText.trim()) return
    setRunning(true)
    const result = await classify(customText)
    setResults(prev => [...prev, { label: customText.slice(0, 40), result }])
    setRunning(false)
  }

  return (
    <ModuleLayout title="vLLM Semantic Router" description="Embedding-based classification routes each request to the right-sized model in <1ms (after embedding model warm-up). No LLM call — pure vector similarity." status="live">
      <StepCard num={1} title="Route Sample Prompts">
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>6 prompts classified by complexity. Watch simple tasks route to 2B model, complex to 3.8B.</p>
        <button className="btn btn-primary" onClick={runAll} disabled={running} style={{ fontSize: 12 }}>{running ? 'Routing...' : 'Route 6 Prompts →'}</button>
      </StepCard>

      {results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <StepCard num={2} title="Routing Decisions">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-dim)' }}>Prompt</th>
                <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--text-dim)' }}>Route</th>
                <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-dim)' }}>Model</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--text-dim)' }}>Confidence</th>
                <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--text-dim)' }}>Latency</th>
              </tr></thead>
              <tbody>{results.map((r, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '6px 8px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                    <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: r.result.route === 'complex' ? 'var(--rh-purple)' : r.result.route === 'medium' ? 'var(--rh-blue)' : 'var(--rh-green)' }}>{r.result.route?.toUpperCase()}</span>
                  </td>
                  <td className="mono" style={{ padding: '6px 8px', fontSize: 11 }}>{r.result.model}</td>
                  <td className="mono" style={{ padding: '6px 8px', textAlign: 'right' }}>{(r.result.confidence * 100).toFixed(0)}%</td>
                  <td className="mono" style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-dim)' }}>{r.result.latency_ms}ms</td>
                </motion.tr>
              ))}</tbody>
            </table>
          </StepCard>
        </motion.div>
      )}

      {results.length >= 4 && (() => {
        const simple = results.filter(r => r.result.route === 'simple').length
        const medium = results.filter(r => r.result.route === 'medium').length
        const complex = results.filter(r => r.result.route === 'complex').length
        const cpuCount = results.filter(r => r.result.hardware === 'cpu').length
        const gpuCount = results.filter(r => r.result.hardware === 'gpu').length
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <StepCard num={3} title="What This Means">
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 16 }}>
                {[
                  { label: 'SIMPLE', count: simple, color: 'var(--rh-green)', desc: 'Classification, labeling' },
                  { label: 'MEDIUM', count: medium, color: 'var(--rh-blue)', desc: 'Summarization, extraction' },
                  { label: 'COMPLEX', count: complex, color: 'var(--rh-purple)', desc: 'Reasoning, diagnosis' },
                ].map(s => (
                  <div key={s.label} className="card" style={{ padding: '12px 16px', textAlign: 'center', borderLeft: `3px solid ${s.color}`, minWidth: 100 }}>
                    <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.count}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <span style={{ color: 'var(--intel-cyan)', fontWeight: 700 }}>{cpuCount} CPU ($0)</span>
                {gpuCount > 0 && <>{' · '}<span style={{ color: 'var(--gpu-amber)', fontWeight: 700 }}>{gpuCount} GPU ($/token)</span></>}
                {' · '}
                <span style={{ color: 'var(--rh-green)', fontWeight: 600 }}>
                  {Math.round(cpuCount / results.length * 100)}% of workload runs free
                </span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--rh-green)', fontWeight: 600, lineHeight: 1.7, textAlign: 'center' }}>
                The router classified {results.length} requests in {'<'}1ms each (after embedding model warm-up) using pure vector similarity — no LLM call.
                Simple tasks stay on the smallest, fastest model. Complex tasks route to larger models or GPU.
                One API, the system decides.
              </div>
            </StepCard>
          </motion.div>
        )
      })()}

      <StepCard num={results.length >= 4 ? 4 : 3} title="Try Your Own">
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" value={customText} onChange={e => setCustomText(e.target.value)} placeholder="Type any prompt..." onKeyDown={e => e.key === 'Enter' && runCustom()}
            style={{ flex: 1, padding: '8px 12px', fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)' }} />
          <button className="btn btn-secondary" onClick={runCustom} disabled={running || !customText.trim()} style={{ fontSize: 12 }}>Route →</button>
        </div>
      </StepCard>
    </ModuleLayout>
  )
}
