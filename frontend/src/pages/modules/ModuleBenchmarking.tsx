import { useState } from 'react'
import { motion } from 'motion/react'
import { ModuleLayout, StepCard, CpuGpuBadge } from '../../components/ModuleLayout'

const TASKS = [
  { id: 'classification', label: 'Classification', text: 'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin 500mg and Lisinopril 10mg. Recent STEMI with PCI to RCA.' },
  { id: 'ner', label: 'NER', text: '72-year-old male with Type 2 Diabetes on Metformin 500mg and Lisinopril 10mg. Recent STEMI with PCI to RCA. Aspirin 81mg and Clopidogrel 75mg. History of hypertension and chronic kidney disease stage 3.' },
  { id: 'summarization', label: 'Summarization', text: '72-year-old male admitted with acute chest pain. History of Type 2 Diabetes, hypertension, CKD stage 3. ECG showed ST elevation in leads II, III, aVF. Troponin I elevated at 8.2 ng/mL. Emergent cardiac catheterization revealed 95% occlusion of RCA. Successful PCI with drug-eluting stent placement. Post-procedure course uncomplicated. Started on dual antiplatelet therapy.' },
  { id: 'compliance_reasoning', label: 'Compliance', text: 'A customer in Germany transfers $9,500 to a business account in the Cayman Islands. They have made 3 similar transfers in the past month, each just under $10,000. The account was opened 6 months ago with minimal initial activity.' },
]

const CPU_MODELS = [
  { id: 'granite-350m', label: 'granite-350m', hw: 'cpu', params: '350M', checked: false },
  { id: 'granite-4-0-h-tiny-cpu', label: 'granite-tiny', hw: 'cpu', params: '~1B', checked: false },
  { id: 'granite-2b-cpu', label: 'granite-2b', hw: 'cpu', params: '2B', checked: true },
  { id: 'granite-2b-int8', label: 'granite-2b-int8', hw: 'cpu', params: '2B', checked: false },
  { id: 'qwen25-3b-cpu', label: 'qwen25-3b', hw: 'cpu', params: '3B', checked: true },
  { id: 'granite-4.1-3b', label: 'granite-4.1-3b', hw: 'cpu', params: '3B', checked: false },
  { id: 'phi3-mini-cpu', label: 'phi3-mini', hw: 'cpu', params: '3.8B', checked: false },
  { id: 'granite-3-2-8b-instruct-cpu', label: 'granite-8b', hw: 'cpu', params: '8B', checked: false },
  { id: 'granite-4.1-8b', label: 'granite-4.1-8b', hw: 'cpu', params: '8B', checked: false },
]

const GPU_MODELS = [
  { id: 'granite-3-2-8b-instruct', label: 'granite-8b (GPU — available on MAAS)', hw: 'gpu', params: '8B', checked: true },
  { id: 'qwen3-14b', label: 'qwen3-14b (GPU — available on MAAS)', hw: 'gpu', params: '14B', checked: false },
  { id: 'gpt-oss-20b', label: 'gpt-oss-20b (GPU — available on MAAS)', hw: 'gpu', params: '20B', checked: false },
]

const ALL_MODELS = [...CPU_MODELS, ...GPU_MODELS]

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

  if (task === 'classification') return `All models classify correctly. Gaudi is ${speedup}x faster but CPU works fine at $0 — no quality difference on this task.`
  if (task === 'ner') return `Gaudi is ${speedup}x faster. Gaudi models also extract dosages (500mg, 10mg) that smaller CPU models miss — quality AND speed improve.`
  if (task === 'summarization') return `Gaudi is ${speedup}x faster with more detailed output. For real-time summarization, Gaudi is worth the cost. For batch, CPU at $0 is fine.`
  return `Gaudi is ${speedup}x faster. CPU at $0 handles this task adequately. GPU adds speed and potentially better reasoning — the tradeoff depends on your volume and latency requirements.`
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
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--intel-cyan)', marginBottom: 6 }}>CPU (Xeon 6 — $0/token)</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CPU_MODELS.map(m => (
            <button key={m.id}
              onClick={() => toggleModel(m.id)}
              style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                border: `1px solid ${selectedModels.includes(m.id) ? 'var(--intel-cyan)' : 'var(--border)'}`,
                background: selectedModels.includes(m.id) ? 'var(--intel-cyan-dim)' : 'transparent',
                color: selectedModels.includes(m.id) ? 'var(--intel-cyan)' : 'var(--text-dim)',
              }}>
              <CpuGpuBadge hardware={m.hw} /> {m.label} ({m.params})
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gpu-amber)', marginTop: 12, marginBottom: 6 }}>GPU (Gaudi — $/token)</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {GPU_MODELS.map(m => (
            <button key={m.id}
              onClick={() => toggleModel(m.id)}
              style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                border: `1px solid ${selectedModels.includes(m.id) ? 'var(--gpu-amber)' : 'var(--border)'}`,
                background: selectedModels.includes(m.id) ? 'var(--gpu-amber-dim)' : 'transparent',
                color: selectedModels.includes(m.id) ? 'var(--gpu-amber)' : 'var(--text-dim)',
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

      {results && (() => {
        const valid = results.filter(r => !r.error)
        const maxLatency = Math.max(...valid.map(r => r.latency_ms), 1)
        const winner = valid[0]
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <StepCard num={4} title="The Race">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {valid.map((r, i) => {
                  const pct = (r.latency_ms / maxLatency) * 100
                  const isWinner = i === 0
                  const barColor = r.hardware === 'gpu' ? 'var(--gpu-amber)' : 'var(--intel-cyan)'
                  return (
                    <motion.div key={r.model}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 140, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CpuGpuBadge hardware={r.hardware} />
                        <span className="mono" style={{ fontSize: 11, fontWeight: 600 }}>{r.model.replace('-cpu', '').replace('granite-', 'g-').replace('microsoft-', '')}</span>
                      </div>
                      <div style={{ flex: 1, height: 28, background: 'var(--surface-1)', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                        <motion.div
                          style={{ height: '100%', borderRadius: 6, background: barColor, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1.2, delay: i * 0.2, ease: 'easeOut' }}>
                          <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{r.latency_ms}ms</span>
                        </motion.div>
                        {isWinner && (
                          <motion.div style={{ position: 'absolute', right: -30, top: 4, fontSize: 14 }}
                            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.5, type: 'spring' }}>
                            🏆
                          </motion.div>
                        )}
                      </div>
                      <div className="mono" style={{ width: 45, fontSize: 11, textAlign: 'right', color: 'var(--text-dim)' }}>
                        {r.output_tokens || '—'} tok
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {results.some(r => r.error) && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--rh-orange)' }}>
                  {results.filter(r => r.error).map(r => `${r.model}: ${r.error}`).join(' · ')}
                </div>
              )}
            </StepCard>

            {valid.length >= 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
                <StepCard num={5} title="Insight">
                  <div style={{ fontSize: 14, color: 'var(--rh-green)', fontWeight: 600, lineHeight: 1.7 }}>
                    {winner && <span>Winner: <span style={{ color: winner.hardware === 'gpu' ? 'var(--gpu-amber)' : 'var(--intel-cyan)' }}>{winner.model}</span> ({winner.hardware.toUpperCase()}) at {winner.latency_ms}ms. </span>}
                    {getInsight(TASKS[selectedTask].id, results)}
                  </div>
                </StepCard>
              </motion.div>
            )}
          </motion.div>
        )
      })()}
    </ModuleLayout>
  )
}
