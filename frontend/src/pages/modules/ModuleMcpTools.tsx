import { useState } from 'react'
import { motion } from 'motion/react'
import { ModuleLayout, StepCard } from '../../components/ModuleLayout'

export default function ModuleMcpTools() {
  const [pipelineResult, setPipelineResult] = useState<any>(null)
  const [running, setRunning] = useState(false)

  const runPipeline = async () => {
    setRunning(true); setPipelineResult(null)
    try {
      const resp = await fetch('/healthcare/api/v1/pipeline', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin 500mg and Lisinopril 10mg. Started on Aspirin 81mg and Clopidogrel 75mg.' }) })
      setPipelineResult(await resp.json())
    } catch { setPipelineResult({ error: 'Backend not reachable' }) }
    setRunning(false)
  }

  const interactionEntry = pipelineResult?.inference_log?.find((e: any) => e.node === 'check_interactions')
  const nerEntry = pipelineResult?.inference_log?.find((e: any) => e.node === 'extract_entities')

  return (
    <ModuleLayout title="MCP Tools (Data, Not LLM)" description="Drug interactions come from a curated database via MCP tool in ~15ms. An LLM call for the same answer takes 3-8 seconds. Not everything needs inference." status="live">
      <StepCard num={1} title="Run Pipeline — Compare MCP vs LLM">
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>
          The pipeline uses an MCP tool for drug interaction checking instead of an LLM call. Watch the latency difference.
        </p>
        <button className="btn btn-primary" onClick={runPipeline} disabled={running} style={{ fontSize: 12 }}>{running ? 'Running...' : 'Run Pipeline →'}</button>
      </StepCard>

      {pipelineResult && !pipelineResult.error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <StepCard num={2} title="MCP Tool vs LLM Call">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--rh-teal)', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--rh-teal)' }}>MCP Tool (Drug Interactions)</div>
                <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--rh-green)', marginTop: 8 }}>{interactionEntry?.latency_ms || '—'}ms</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Database lookup via JSON-RPC</div>
              </div>
              <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--rh-orange)', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--rh-orange)' }}>LLM Call (NER)</div>
                <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--rh-orange)', marginTop: 8 }}>{nerEntry?.latency_ms || '—'}ms</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{nerEntry?.model || 'unknown'}</div>
              </div>
            </div>
            {interactionEntry && nerEntry && (
              <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--rh-green)', fontWeight: 700 }}>
                MCP tool is {Math.round(nerEntry.latency_ms / Math.max(interactionEntry.latency_ms, 1))}x faster than an LLM call for the same data
              </div>
            )}
          </StepCard>

          <StepCard num={3} title="Drug Interactions Found">
            {pipelineResult.drug_interactions?.length > 0 ? (
              pipelineResult.drug_interactions.map((di: any, i: number) => (
                <div key={i} className="card" style={{ padding: 10, marginBottom: 8, borderLeft: `3px solid ${di.severity === 'major' ? 'var(--rh-red)' : 'var(--rh-orange)'}` }}>
                  <strong>{di.drug_a}</strong> + <strong>{di.drug_b}</strong>
                  <span className="mono" style={{ marginLeft: 8, fontSize: 11, color: di.severity === 'major' ? 'var(--rh-red)' : 'var(--rh-orange)' }}>{di.severity}</span>
                  {di.description && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{di.description}</div>}
                </div>
              ))
            ) : <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>No interactions found</div>}
          </StepCard>

          <StepCard num={4} title="Insight">
            <div style={{ fontSize: 14, color: 'var(--rh-green)', fontWeight: 600, lineHeight: 1.7 }}>
              Not every question needs an LLM. Drug interactions are facts — a database lookup at {interactionEntry?.latency_ms}ms
              is more accurate AND {Math.round(nerEntry?.latency_ms / Math.max(interactionEntry?.latency_ms, 1))}x faster than asking a language model.
              The MCP Gateway federates 8 tools. Each replaces an LLM call with a deterministic lookup.
            </div>
          </StepCard>
        </motion.div>
      )}
    </ModuleLayout>
  )
}
