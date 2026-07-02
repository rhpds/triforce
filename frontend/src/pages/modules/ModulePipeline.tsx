import { useState } from 'react'
import { motion } from 'motion/react'
import { ModuleLayout, StepCard, CpuGpuBadge } from '../../components/ModuleLayout'

const SAMPLES = [
  { label: 'Discharge Summary', text: 'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin 500mg and Lisinopril 10mg. Recent STEMI with PCI to RCA. Started on Aspirin 81mg and Clopidogrel 75mg. History of hypertension and chronic kidney disease stage 3.' },
  { label: 'Lab Report', text: 'LAB REPORT: WBC 18,000, Hemoglobin 12.4, Platelets 245,000. BMP: Na 138, K 4.2, Cl 102, CO2 24, BUN 28, Creatinine 1.8, Glucose 186. HbA1c 8.2%. Troponin I 8.2 ng/mL.' },
  { label: 'Progress Note', text: 'PROGRESS NOTE: Day 3 post-PCI. Patient reports decreased chest pain, 2/10 from 8/10 on admission. Vitals stable. Heart sounds regular, no murmurs. Lungs clear bilaterally. Dual antiplatelet therapy continued. Cardiology follow-up scheduled in 2 weeks.' },
]

interface PipelineResult {
  classification: string
  entities: { text: string; type: string }[]
  drug_interactions: { drug_a: string; drug_b: string; severity: string }[]
  summary: string
  inference_log: { node: string; model: string; latency_ms: number; kv_cache_hit?: boolean }[]
  total_ms: number
}

export default function ModulePipeline() {
  const [selectedSample, setSelectedSample] = useState(0)
  const [customText, setCustomText] = useState('')
  const [result, setResult] = useState<PipelineResult | null>(null)
  const [running, setRunning] = useState(false)
  const [activeNode, setActiveNode] = useState(-1)

  const activeText = customText || SAMPLES[selectedSample].text

  const runPipeline = async () => {
    setRunning(true)
    setResult(null)
    setActiveNode(0)

    const nodeTimers = [800, 3000, 5000]
    nodeTimers.forEach((delay, i) => {
      setTimeout(() => setActiveNode(i + 1), delay)
    })

    try {
      const resp = await fetch('/healthcare/api/v1/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: activeText , skip_cache: true}),
      })
      const data = await resp.json()
      setResult(data)
      setActiveNode(4)
    } catch {
      setActiveNode(-1)
    }
    setRunning(false)
  }

  const nodes = [
    { name: 'Classify', desc: 'Document type identification' },
    { name: 'Extract Entities', desc: 'Medical NER (medications, conditions, procedures)' },
    { name: 'Check Interactions', desc: 'Drug-drug interactions via MCP tool' },
    { name: 'Summarize', desc: 'Clinical summary for handoff' },
  ]

  return (
    <ModuleLayout
      title="Clinical NLP Pipeline"
      description="4-node LangGraph pipeline: classify → extract entities → check drug interactions → summarize. Each node uses a different model optimized for its task. Watch it execute step by step."
      status="live"
    >
      <StepCard num={1} title="Select Clinical Text">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {SAMPLES.map((s, i) => (
            <button key={s.label}
              className={`btn ${i === selectedSample && !customText ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 12, padding: '6px 12px' }}
              onClick={() => { setSelectedSample(i); setCustomText(''); setResult(null) }}>
              {s.label}
            </button>
          ))}
        </div>
        <textarea
          value={customText || SAMPLES[selectedSample].text}
          onChange={e => setCustomText(e.target.value)}
          style={{ width: '100%', minHeight: 60, padding: 10, fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', resize: 'vertical' }}
        />
      </StepCard>

      <StepCard num={2} title="Execute Pipeline">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <button className="btn btn-primary" onClick={runPipeline} disabled={running} style={{ minWidth: 200 }}>
            {running ? 'Running pipeline...' : 'Run Pipeline →'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, alignItems: 'center' }}>
          {nodes.map((n, i) => {
            const logEntry = result?.inference_log?.[i]
            const isDone = result && i < (result.inference_log?.length || 0)
            const isActive = !result && activeNode === i
            return (
              <motion.div key={n.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <motion.div style={{
                  padding: '8px 12px', borderRadius: 6, textAlign: 'center', minWidth: 90,
                  border: `1px solid ${isDone ? 'var(--rh-green)' : isActive ? 'var(--intel-cyan)' : 'var(--border)'}`,
                  background: isDone ? 'var(--rh-green-dim)' : isActive ? 'var(--intel-cyan-dim)' : 'var(--surface-1)',
                }}
                  animate={isActive ? { scale: [1, 1.03, 1] } : {}}
                  transition={isActive ? { repeat: Infinity, duration: 1 } : {}}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: isDone ? 'var(--rh-green)' : isActive ? 'var(--intel-cyan)' : 'var(--text-dim)' }}>{n.name}</div>
                  {isDone && logEntry && (
                    <div className="mono" style={{ fontSize: 10, color: 'var(--rh-green)', marginTop: 2 }}>
                      {logEntry.latency_ms}ms
                    </div>
                  )}
                </motion.div>
                {i < 3 && <span style={{ color: 'var(--text-disabled)', fontSize: 14 }}>→</span>}
              </motion.div>
            )
          })}
        </div>
      </StepCard>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <StepCard num={3} title="Results">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="card" style={{ padding: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Classification</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--intel-cyan)', marginTop: 4 }}>{result.classification}</div>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Pipeline</div>
                <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--rh-green)', marginTop: 4 }}>{(result.total_ms / 1000).toFixed(1)}s</div>
              </div>
            </div>

            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Inference Log</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-dim)' }}>Node</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-dim)' }}>Model</th>
                  <th style={{ textAlign: 'center', padding: '6px 8px', color: 'var(--text-dim)' }}>Hardware</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--text-dim)' }}>Latency</th>
                </tr>
              </thead>
              <tbody>
                {result.inference_log.map((entry, i) => (
                  <motion.tr key={entry.node}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>{entry.node}</td>
                    <td className="mono" style={{ padding: '6px 8px' }}>{entry.model}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}><CpuGpuBadge hardware="cpu" /></td>
                    <td className="mono" style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--intel-cyan)' }}>{entry.latency_ms}ms</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {result.entities.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Entities ({result.entities.length})</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {result.entities.map((e, i) => (
                    <span key={i} style={{
                      padding: '3px 8px', borderRadius: 4, fontSize: 11,
                      background: e.type === 'medication' ? 'var(--ibm-blue-dim)' : e.type === 'condition' ? 'var(--rh-orange-dim)' : 'var(--rh-teal-dim)',
                      color: e.type === 'medication' ? 'var(--ibm-blue)' : e.type === 'condition' ? 'var(--rh-orange)' : 'var(--rh-teal)',
                    }}>
                      {e.text} <span style={{ opacity: 0.6 }}>({e.type})</span>
                    </span>
                  ))}
                </div>
              </>
            )}

            {result.drug_interactions.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Drug Interactions ({result.drug_interactions.length})</div>
                {result.drug_interactions.map((di, i) => (
                  <div key={i} className="card" style={{ padding: 10, marginBottom: 8, borderLeft: `3px solid ${di.severity === 'major' ? 'var(--rh-red)' : 'var(--rh-orange)'}` }}>
                    <span style={{ fontWeight: 600 }}>{di.drug_a}</span> + <span style={{ fontWeight: 600 }}>{di.drug_b}</span>
                    <span className="mono" style={{ marginLeft: 8, fontSize: 11, color: di.severity === 'major' ? 'var(--rh-red)' : 'var(--rh-orange)' }}>{di.severity}</span>
                  </div>
                ))}
              </>
            )}

            {result.summary && (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Summary</div>
                <div className="card" style={{ padding: 12, fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>
                  {result.summary}
                </div>
              </>
            )}
          </StepCard>
        </motion.div>
      )}
    </ModuleLayout>
  )
}
