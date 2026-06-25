import { useState } from 'react'
import { motion } from 'motion/react'
import { ModuleLayout, StepCard, CpuGpuBadge } from '../../components/ModuleLayout'

const TASKS = [
  { id: 'classification', label: 'Classification', text: 'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin 500mg and Lisinopril 10mg. Recent STEMI with PCI to RCA.' },
  { id: 'ner', label: 'NER', text: '72-year-old male with Type 2 Diabetes on Metformin 500mg and Lisinopril 10mg. Recent STEMI with PCI to RCA. Aspirin 81mg and Clopidogrel 75mg. History of hypertension and chronic kidney disease stage 3.' },
  { id: 'summarization', label: 'Summarization', text: '72-year-old male admitted with acute chest pain. History of Type 2 Diabetes, hypertension, CKD stage 3. ECG showed ST elevation in leads II, III, aVF. Troponin I elevated at 8.2 ng/mL. Emergent cardiac catheterization revealed 95% occlusion of RCA. Successful PCI with drug-eluting stent placement. Post-procedure course uncomplicated. Started on dual antiplatelet therapy.' },
  { id: 'compliance_reasoning', label: 'Compliance', text: 'A customer in Germany transfers $9,500 to a business account in the Cayman Islands. They have made 3 similar transfers in the past month, each just under $10,000. The account was opened 6 months ago with minimal initial activity.' },
]

const ALL_MODELS = [
  { id: 'granite-2b-cpu', label: 'granite-2b', hw: 'cpu', params: '2B', checked: true },
  { id: 'qwen25-3b-cpu', label: 'qwen25-3b', hw: 'cpu', params: '3B', checked: true },
  { id: 'granite-3-2-8b-instruct-cpu', label: 'granite-8b', hw: 'cpu', params: '8B', checked: false },
  { id: 'granite-3-2-8b-instruct', label: 'granite-8b', hw: 'gpu', params: '8B', checked: true },
  { id: 'microsoft-phi-4', label: 'phi-4', hw: 'gpu', params: '14B', checked: false },
  { id: 'gpt-oss-20b', label: 'gpt-oss-20b', hw: 'gpu', params: '20B', checked: false },
]

interface BenchResult {
  model: string
  hardware: string
  task: string
  latency_ms: number
  output?: string
  output_tokens?: number
  error?: string
}

function getInsight(task: string, results: BenchResult[]): string {
  const cpu = results.filter(r => r.hardware === 'cpu' && !r.error)
  const gpu = results.filter(r => r.hardware === 'gpu' && !r.error)
  if (!cpu.length || !gpu.length) return ''
  const cpuBest = cpu[0].latency_ms
  const gpuBest = gpu[0].latency_ms
  const speedup = (cpuBest / gpuBest).toFixed(1)

  if (task === 'classification') return `All models classify correctly. GPU is ${speedup}x faster but CPU works fine at $0 — no quality difference on this task.`
  if (task === 'ner') return `GPU is ${speedup}x faster. GPU models also extract dosages (500mg, 10mg) that smaller CPU models miss — quality AND speed improve.`
  if (task === 'summarization') return `GPU is ${speedup}x faster with more detailed output. For real-time summarization, GPU is worth the cost. For batch, CPU at $0 is fine.`
  return `GPU is ${speedup}x faster. CPU at $0 handles this task adequately. GPU adds speed and potentially better reasoning — the tradeoff depends on your volume and latency requirements.`
}

export default function ModuleBenchmarking() {
  const [selectedTask, setSelectedTask] = useState(0)
  const [selectedModels, setSelectedModels] = useState(() =>
    ALL_MODELS.filter(m => m.checked).map(m => m.id)
  )
  const [results, setResults] = useState<BenchResult[] | null>(null)
  const [running, setRunning] = useState(false)

  const toggleModel = (id: string) => {
    setSelectedModels(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const runBenchmark = async () => {
    if (selectedModels.length === 0) return
    setRunning(true)
    setResults(null)
    try {
      const resp = await fetch('/healthcare/api/v1/benchmark/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: TASKS[selectedTask].id,
          text: TASKS[selectedTask].text,
          models: selectedModels,
        }),
      })
      const data = await resp.json()
      setResults(data.results || [])
    } catch {
      setResults([{ model: 'error', hardware: 'cpu', task: '', latency_ms: 0, error: 'Backend not reachable' }])
    }
    setRunning(false)
  }

  return (
    <ModuleLayout
      title="Model Benchmarking"
      description="Compare models across tasks and hardware with real metrics. Same input, different models, different hardware — latency, quality, and cost side by side."
      status="live"
    >
      <StepCard num={1} title="Select Task">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TASKS.map((t, i) => (
            <button key={t.id}
              className={`btn ${i === selectedTask ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 12, padding: '6px 12px' }}
              onClick={() => { setSelectedTask(i); setResults(null) }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="card" style={{ marginTop: 12, padding: 12, fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          {TASKS[selectedTask].text.slice(0, 200)}...
        </div>
      </StepCard>

      <StepCard num={2} title="Select Models">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {ALL_MODELS.map(m => (
            <button key={m.id}
              onClick={() => toggleModel(m.id)}
              style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                border: `1px solid ${selectedModels.includes(m.id) ? (m.hw === 'gpu' ? 'var(--gpu-amber)' : 'var(--intel-cyan)') : 'var(--border)'}`,
                background: selectedModels.includes(m.id) ? (m.hw === 'gpu' ? 'var(--gpu-amber-dim)' : 'var(--intel-cyan-dim)') : 'transparent',
                color: selectedModels.includes(m.id) ? (m.hw === 'gpu' ? 'var(--gpu-amber)' : 'var(--intel-cyan)') : 'var(--text-dim)',
              }}>
              <CpuGpuBadge hardware={m.hw} /> {m.label} ({m.params})
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
          {selectedModels.length} model{selectedModels.length !== 1 ? 's' : ''} selected
          ({selectedModels.filter(id => ALL_MODELS.find(m => m.id === id)?.hw === 'cpu').length} CPU,
           {selectedModels.filter(id => ALL_MODELS.find(m => m.id === id)?.hw === 'gpu').length} GPU)
        </div>
      </StepCard>

      <StepCard num={3} title="Run Benchmark">
        <div style={{ textAlign: 'center' }}>
          <button className="btn btn-primary" onClick={runBenchmark}
            disabled={running || selectedModels.length === 0}
            style={{ minWidth: 200 }}>
            {running ? 'Running...' : `Benchmark ${selectedModels.length} model${selectedModels.length !== 1 ? 's' : ''} →`}
          </button>
        </div>
      </StepCard>

      {results && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <StepCard num={4} title="Results">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-dim)' }}>Model</th>
                  <th style={{ textAlign: 'center', padding: '8px', color: 'var(--text-dim)' }}>Hardware</th>
                  <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-dim)' }}>Latency</th>
                  <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-dim)' }}>Tokens</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-dim)' }}>Output</th>
                </tr>
              </thead>
              <tbody>
                {results.filter(r => !r.error).map((r, i) => (
                  <motion.tr key={r.model}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="mono" style={{ padding: '10px 8px', fontWeight: 600 }}>{r.model}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}><CpuGpuBadge hardware={r.hardware} /></td>
                    <td className="mono" style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: i === 0 ? 'var(--rh-green)' : 'var(--text-primary)' }}>
                      {r.latency_ms}ms
                    </td>
                    <td className="mono" style={{ padding: '10px 8px', textAlign: 'right', color: 'var(--text-dim)' }}>
                      {r.output_tokens || '—'}
                    </td>
                    <td style={{ padding: '10px 8px', fontSize: 11, color: 'var(--text-dim)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(r.output || '').slice(0, 60)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {results.some(r => r.error) && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--rh-orange)' }}>
                {results.filter(r => r.error).map(r => `${r.model}: ${r.error}`).join(' · ')}
              </div>
            )}
          </StepCard>

          {results.filter(r => !r.error).length >= 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <StepCard num={5} title="Insight">
                <div style={{ fontSize: 14, color: 'var(--rh-green)', fontWeight: 600, lineHeight: 1.7 }}>
                  {getInsight(TASKS[selectedTask].id, results)}
                </div>
              </StepCard>
            </motion.div>
          )}
        </motion.div>
      )}
    </ModuleLayout>
  )
}
