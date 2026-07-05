import { useState } from 'react'
import { motion } from 'motion/react'
import { ModuleLayout, StepCard, CpuGpuBadge } from '../../components/ModuleLayout'

const SAMPLE_PROMPTS = [
  { label: 'Simple — Classification', text: 'Classify this clinical document: DISCHARGE SUMMARY', expected: 'simple' },
  { label: 'Simple — Labeling', text: 'What type of report is this? LAB REPORT', expected: 'simple' },
  { label: 'Medium — Summarize', text: 'Summarize this patient record for physician handoff', expected: 'medium' },
  { label: 'Medium — Extract', text: 'Extract the key findings from this clinical report', expected: 'medium' },
  { label: 'Complex — Diagnosis', text: 'Analyze the drug interactions between Warfarin and Aspirin considering the patients renal function and provide a differential diagnosis for chest pain with elevated troponin', expected: 'complex' },
  { label: 'Complex — Reasoning', text: 'Evaluate the cardiovascular risk factors and synthesize a comprehensive treatment plan considering comorbidities and contraindications', expected: 'complex' },
]

interface RouteResult {
  route: string
  model: string
  model_params: string
  confidence: number
  method: string
  hardware: string
  heterogeneous: boolean
  latency_ms: number
  word_count: number
  scores: Record<string, number>
}

export default function ModuleHeterogeneous() {
  const [customText, setCustomText] = useState('')
  const [results, setResults] = useState<{ text: string; result: RouteResult }[]>([])
  const [running, setRunning] = useState(false)

  const classifyText = async (text: string) => {
    try {
      const resp = await fetch('/router/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      return await resp.json()
    } catch {
      return { route: 'error', model: 'unavailable', hardware: 'unknown', confidence: 0, latency_ms: 0, method: 'error', scores: {} }
    }
  }

  const runAllSamples = async () => {
    setRunning(true)
    setResults([])
    const newResults: { text: string; result: RouteResult }[] = []
    for (const sample of SAMPLE_PROMPTS) {
      const result = await classifyText(sample.text)
      newResults.push({ text: sample.label, result })
      setResults([...newResults])
    }
    setRunning(false)
  }

  const runCustom = async () => {
    if (!customText.trim()) return
    setRunning(true)
    const result = await classifyText(customText)
    setResults(prev => [...prev, { text: customText.slice(0, 50) + '...', result }])
    setRunning(false)
  }

  const cpuCount = results.filter(r => r.result.hardware === 'cpu').length
  const gpuCount = results.filter(r => r.result.hardware === 'gpu').length

  return (
    <ModuleLayout
      title="Heterogeneous Compute Routing"
      description="The semantic router classifies each request by complexity and routes to the configured hardware tier. Simple requests stay on CPU; complex requests can use the Helm-configured complex model."
      status="live"
    >
      <StepCard num={1} title="Run Sample Prompts">
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>
          Watch 6 prompts route by complexity. Classification and labeling stay on CPU. Diagnosis and reasoning route to the configured complex tier.
        </p>
        <button className="btn btn-primary" onClick={runAllSamples} disabled={running} style={{ fontSize: 12 }}>
          {running ? 'Routing...' : 'Route 6 Sample Prompts →'}
        </button>
      </StepCard>

      {results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <StepCard num={2} title="Routing Decisions">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-dim)' }}>Prompt</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--text-dim)' }}>Route</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--text-dim)' }}>Hardware</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-dim)' }}>Model</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--text-dim)' }}>Confidence</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--text-dim)' }}>Latency</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <motion.tr key={i}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.text}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: r.result.route === 'complex' ? 'var(--gpu-amber)' : r.result.route === 'medium' ? 'var(--rh-blue)' : 'var(--rh-green)' }}>
                        {r.result.route?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}><CpuGpuBadge hardware={r.result.hardware || 'cpu'} /></td>
                    <td className="mono" style={{ padding: '8px', fontSize: 11 }}>{r.result.model}</td>
                    <td className="mono" style={{ padding: '8px', textAlign: 'right' }}>{(r.result.confidence * 100).toFixed(0)}%</td>
                    <td className="mono" style={{ padding: '8px', textAlign: 'right', color: 'var(--text-dim)' }}>{r.result.latency_ms}ms</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {results.length >= 4 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'var(--surface-2)', textAlign: 'center', fontSize: 13 }}>
                <span style={{ color: 'var(--intel-cyan)', fontWeight: 700 }}>{cpuCount} CPU ($0)</span>
                {' · '}
                <span style={{ color: 'var(--gpu-amber)', fontWeight: 700 }}>{gpuCount} GPU ($/token)</span>
                {' · '}
                <span style={{ color: 'var(--rh-green)', fontWeight: 600 }}>
                  {cpuCount > 0 ? Math.round(cpuCount / results.length * 100) : 0}% of workload runs free
                </span>
              </motion.div>
            )}
          </StepCard>
        </motion.div>
      )}

      <StepCard num={3} title="Try Your Own">
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            placeholder="Type any prompt and watch it route..."
            onKeyDown={e => e.key === 'Enter' && runCustom()}
            style={{ flex: 1, padding: '8px 12px', fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
          />
          <button className="btn btn-secondary" onClick={runCustom} disabled={running || !customText.trim()} style={{ fontSize: 12 }}>
            Route →
          </button>
        </div>
      </StepCard>

      {results.length >= 4 && (
        <StepCard num={4} title="Insight">
          <div style={{ fontSize: 14, color: 'var(--rh-green)', fontWeight: 600, lineHeight: 1.7 }}>
            The semantic router makes the CPU vs complex-tier decision before the model call.
            Simple tasks stay on CPU. Complex reasoning routes to the configured tier where quality matters.
            This run routed {Math.round(cpuCount / results.length * 100)}% to CPU and {Math.round(gpuCount / results.length * 100)}% to the complex tier.
          </div>
        </StepCard>
      )}
    </ModuleLayout>
  )
}
