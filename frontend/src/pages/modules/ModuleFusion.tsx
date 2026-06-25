import { useState } from 'react'
import { motion } from 'motion/react'
import { ModuleLayout, StepCard } from '../../components/ModuleLayout'

const SCENARIOS = [
  { id: 'compliance', label: 'AML Compliance', prompt: 'A customer in Germany transfers $9,500 to a business account in the Cayman Islands. They have made 3 similar transfers in the past month, each just under $10,000. Does this pattern indicate potential structuring under AML regulations? Explain your reasoning.' },
  { id: 'diagnosis', label: 'Differential Diagnosis', prompt: 'Patient: 45-year-old female. Symptoms: sudden onset severe headache, neck stiffness, photophobia, fever 38.9C, altered mental status. Labs: WBC 18,000, CSF shows elevated protein, low glucose, neutrophilic pleocytosis. What are the top 3 differential diagnoses ranked by likelihood?' },
  { id: 'fraud', label: 'Fraud Investigation', prompt: 'A corporate credit card shows 47 transactions over 3 days at various electronics retailers, all between $450-$490 (just under the $500 receipt-required threshold). The card holder reports they were traveling internationally during this period. Assess the fraud risk and recommend next steps.' },
]

interface FusionResult {
  status: string
  panel: { models: string[]; count: number; latency_ms: number; responses: { model: string; latency_ms: number; tokens: number }[] }
  judge: { model: string; latency_ms: number; synthesis: string; tokens: number }
  total_ms: number
  total_models_called: number
  error?: string
}

export default function ModuleFusion() {
  const [selectedScenario, setSelectedScenario] = useState(0)
  const [customPrompt, setCustomPrompt] = useState('')
  const [result, setResult] = useState<FusionResult | null>(null)
  const [singleResult, setSingleResult] = useState<{ model: string; latency_ms: number; output: string } | null>(null)
  const [running, setRunning] = useState(false)
  const [runningSingle, setRunningSingle] = useState(false)

  const activePrompt = customPrompt || SCENARIOS[selectedScenario].prompt

  const runFusion = async () => {
    setRunning(true)
    setResult(null)
    try {
      const resp = await fetch('/healthcare/api/v1/fusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: SCENARIOS[selectedScenario].id, prompt: activePrompt }),
      })
      setResult(await resp.json())
    } catch {
      setResult({ status: 'error', panel: { models: [], count: 0, latency_ms: 0, responses: [] }, judge: { model: '', latency_ms: 0, synthesis: '', tokens: 0 }, total_ms: 0, total_models_called: 0, error: 'Backend not reachable' })
    }
    setRunning(false)
  }

  const runSingle = async () => {
    setRunningSingle(true)
    setSingleResult(null)
    try {
      const resp = await fetch('/healthcare/api/v1/benchmark/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: SCENARIOS[selectedScenario].id, text: activePrompt, models: ['granite-2b-cpu'] }),
      })
      const data = await resp.json()
      const r = data.results?.[0]
      setSingleResult(r ? { model: r.model, latency_ms: r.latency_ms, output: r.output || '' } : null)
    } catch {
      setSingleResult({ model: 'error', latency_ms: 0, output: 'Backend not reachable' })
    }
    setRunningSingle(false)
  }

  return (
    <ModuleLayout
      title="Multi-Model Fusion"
      description="For critical decisions, send the same question to 3 models in parallel. A judge compares their responses and synthesizes consensus, contradictions, and blind spots."
      status="live"
    >
      <StepCard num={1} title="Select Scenario">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {SCENARIOS.map((s, i) => (
            <button key={s.id}
              className={`btn ${i === selectedScenario ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 12, padding: '6px 12px' }}
              onClick={() => { setSelectedScenario(i); setResult(null); setSingleResult(null); setCustomPrompt('') }}>
              {s.label}
            </button>
          ))}
        </div>
        <textarea
          value={customPrompt || SCENARIOS[selectedScenario].prompt}
          onChange={e => setCustomPrompt(e.target.value)}
          style={{ width: '100%', minHeight: 80, padding: 10, fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', resize: 'vertical' }}
        />
      </StepCard>

      <StepCard num={2} title="Compare: Single Model vs Fusion">
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={runSingle} disabled={runningSingle} style={{ fontSize: 12, minWidth: 160 }}>
            {runningSingle ? 'Running...' : 'Single Model (granite-2b)'}
          </button>
          <button className="btn btn-primary" onClick={runFusion} disabled={running} style={{ fontSize: 12, minWidth: 160 }}>
            {running ? 'Running 3 + judge...' : 'Fusion Panel (3 + judge)'}
          </button>
        </div>
      </StepCard>

      {(singleResult || result) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <StepCard num={3} title="Results">
            <div style={{ display: 'grid', gridTemplateColumns: singleResult && result ? '1fr 1fr' : '1fr', gap: 16 }}>
              {singleResult && (
                <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--intel-cyan)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--intel-cyan)', marginBottom: 8 }}>Single Model</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>{singleResult.model} · {singleResult.latency_ms}ms</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, maxHeight: 200, overflow: 'auto' }}>
                    {singleResult.output.slice(0, 500)}
                  </div>
                </div>
              )}
              {result && result.status === 'complete' && (
                <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--ibm-blue)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ibm-blue)', marginBottom: 8 }}>Fusion ({result.panel.count} + judge)</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                    Panel: {result.panel.latency_ms}ms · Judge: {result.judge.latency_ms}ms · Total: {result.total_ms}ms
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, maxHeight: 200, overflow: 'auto' }}>
                    {result.judge.synthesis.slice(0, 500)}
                  </div>
                </div>
              )}
            </div>
          </StepCard>
        </motion.div>
      )}

      {result && result.status === 'complete' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <StepCard num={4} title="Panel Breakdown">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-dim)' }}>Model</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--text-dim)' }}>Latency</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--text-dim)' }}>Tokens</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-dim)' }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {result.panel.responses.map((r, i) => (
                  <tr key={r.model} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="mono" style={{ padding: '6px 8px', fontWeight: 600 }}>{r.model}</td>
                    <td className="mono" style={{ padding: '6px 8px', textAlign: 'right' }}>{r.latency_ms}ms</td>
                    <td className="mono" style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-dim)' }}>{r.tokens}</td>
                    <td style={{ padding: '6px 8px', color: 'var(--ibm-blue)' }}>Panel #{i + 1}</td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--surface-2)' }}>
                  <td className="mono" style={{ padding: '6px 8px', fontWeight: 700 }}>{result.judge.model}</td>
                  <td className="mono" style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{result.judge.latency_ms}ms</td>
                  <td className="mono" style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--text-dim)' }}>{result.judge.tokens}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: 'var(--ibm-blue)' }}>Judge</td>
                </tr>
              </tbody>
            </table>
          </StepCard>

          <StepCard num={5} title="Insight">
            <div style={{ fontSize: 14, color: 'var(--rh-green)', fontWeight: 600, lineHeight: 1.7 }}>
              Single model: one perspective. Fusion: {result.panel.count} independent answers + judge synthesis.
              The judge catches what individual models miss — contradictions, blind spots, incomplete reasoning.
              For compliance and diagnostic decisions, the cost of being wrong exceeds the cost of 3 extra calls.
            </div>
          </StepCard>
        </motion.div>
      )}
    </ModuleLayout>
  )
}
