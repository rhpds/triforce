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
    <ModuleLayout title="vLLM Semantic Router" description="Embedding-based classification routes each request to the right-sized model in <1ms. No LLM call — pure vector similarity." status="live">
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

      <StepCard num={3} title="Try Your Own">
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" value={customText} onChange={e => setCustomText(e.target.value)} placeholder="Type any prompt..." onKeyDown={e => e.key === 'Enter' && runCustom()}
            style={{ flex: 1, padding: '8px 12px', fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)' }} />
          <button className="btn btn-secondary" onClick={runCustom} disabled={running || !customText.trim()} style={{ fontSize: 12 }}>Route →</button>
        </div>
      </StepCard>
    </ModuleLayout>
  )
}
