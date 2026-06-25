import { useState } from 'react'
import { motion } from 'motion/react'
import { ModuleLayout, StepCard } from '../../components/ModuleLayout'

const SAMPLES = [
  { label: '2+ Medications (full pipeline)', text: 'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin 500mg and Lisinopril 10mg. Recent STEMI with PCI to RCA. Started on Aspirin 81mg and Clopidogrel 75mg.', expectSkip: false },
  { label: '1 Medication (skip interactions)', text: 'LAB REPORT: Patient on Metformin 500mg. HbA1c 7.2%. Fasting glucose 142. Renal function normal.', expectSkip: true },
  { label: '0 Medications (skip interactions)', text: 'RADIOLOGY REPORT: Chest X-ray shows bilateral clear lung fields. No focal consolidation. Heart size normal. No pleural effusion.', expectSkip: true },
]

interface PipelineResult {
  classification: string; entities: { text: string; type: string }[]; drug_interactions: any[]; summary: string
  inference_log: { node: string; model: string; latency_ms: number }[]; total_ms: number
}

export default function ModuleConditionalPipeline() {
  const [results, setResults] = useState<{ label: string; result: PipelineResult; expectSkip: boolean }[]>([])
  const [running, setRunning] = useState(false)

  const runAll = async () => {
    setRunning(true); setResults([])
    const r: typeof results = []
    for (const s of SAMPLES) {
      try {
        const resp = await fetch('/healthcare/api/v1/pipeline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: s.text }) })
        r.push({ label: s.label, result: await resp.json(), expectSkip: s.expectSkip })
      } catch { /* skip */ }
      setResults([...r])
    }
    setRunning(false)
  }

  return (
    <ModuleLayout title="Conditional Pipeline" description="LangGraph skips inference steps that aren't needed. <2 medications → skip drug interaction check. The pipeline adapts per record." status="live">
      <StepCard num={1} title="Run 3 Different Document Types">
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>Watch the pipeline adapt: documents with 2+ medications run all 4 nodes. Documents with 0-1 medications skip the interaction check.</p>
        <button className="btn btn-primary" onClick={runAll} disabled={running} style={{ fontSize: 12 }}>{running ? 'Running...' : 'Run 3 Pipelines →'}</button>
      </StepCard>

      {results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <StepCard num={2} title="Results — Pipeline Adaptation">
            {results.map((r, idx) => {
              const meds = r.result.entities?.filter(e => e.type === 'medication').length || 0
              const nodes = r.result.inference_log?.length || 0
              const interactionNode = r.result.inference_log?.find(e => e.node === 'check_interactions')
              const skipped = !interactionNode || interactionNode.model === 'skipped'
              return (
                <motion.div key={idx} className="card" style={{ padding: 14, marginBottom: 12, borderLeft: `3px solid ${skipped ? 'var(--rh-orange)' : 'var(--rh-green)'}` }}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{r.label}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                    <span>Classification: <strong>{r.result.classification}</strong></span>
                    <span>Medications: <strong style={{ color: meds >= 2 ? 'var(--rh-green)' : 'var(--rh-orange)' }}>{meds}</strong></span>
                    <span>Nodes run: <strong>{nodes}</strong></span>
                    <span>Interactions: <strong style={{ color: skipped ? 'var(--rh-orange)' : 'var(--rh-green)' }}>{skipped ? 'SKIPPED' : `${r.result.drug_interactions?.length || 0} found`}</strong></span>
                    <span className="mono">Total: <strong>{r.result.total_ms}ms</strong></span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    {r.result.inference_log?.map((e, i) => (
                      <span key={i} className="mono" style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: e.model === 'skipped' ? 'var(--rh-orange-dim)' : 'var(--rh-green-dim)', color: e.model === 'skipped' ? 'var(--rh-orange)' : 'var(--rh-green)' }}>
                        {e.node} {e.latency_ms}ms
                      </span>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </StepCard>

          {results.length >= 3 && (
            <StepCard num={3} title="Insight">
              <div style={{ fontSize: 14, color: 'var(--rh-green)', fontWeight: 600, lineHeight: 1.7 }}>
                Documents with {'<'}2 medications skip the drug interaction check entirely — no inference call, no latency, no compute.
                At scale, ~25% of records skip at least one step. That's 25% fewer LLM calls on the same $0 hardware.
              </div>
            </StepCard>
          )}
        </motion.div>
      )}
    </ModuleLayout>
  )
}
