import { useState } from 'react'
import { motion } from 'motion/react'

interface Props { onComplete?: () => void }

const TASKS = [
  { id: 'classification', label: 'Classification', text: 'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin 500mg and Lisinopril 10mg. Recent STEMI with PCI to RCA.' },
  { id: 'ner', label: 'NER', text: '72-year-old male with Type 2 Diabetes on Metformin 500mg and Lisinopril 10mg. Recent STEMI with PCI to RCA. Aspirin 81mg and Clopidogrel 75mg.' },
  { id: 'summarization', label: 'Summarization', text: '72-year-old male admitted with acute chest pain. History of Type 2 Diabetes, hypertension, CKD stage 3. ECG showed ST elevation. Troponin I elevated at 8.2. Emergent catheterization revealed 95% occlusion of RCA. Successful PCI with drug-eluting stent.' },
  { id: 'compliance_reasoning', label: 'Compliance', text: 'A customer transfers $9,500 to a business account in the Cayman Islands. They have made 3 similar transfers in the past month, each just under $10,000.' },
]

const MODELS = ['granite-2b-cpu', 'qwen25-3b-cpu', 'granite-3-2-8b-instruct-cpu']

interface BenchmarkResult {
  model: string
  hardware: string
  task: string
  latency_ms: number
  output?: string
  output_tokens?: number
  error?: string
}

function hardwareColor(hw: string) {
  return hw === 'gpu' ? 'var(--gpu-amber)' : 'var(--intel-cyan)'
}

function getInsight(task: string, results: BenchmarkResult[]): string {
  const valid = results.filter(r => !r.error)
  if (valid.length < 2) return ''
  const cpuResults = valid.filter(r => r.hardware === 'cpu')
  const gpuResults = valid.filter(r => r.hardware === 'gpu')
  if (cpuResults.length === 0 || gpuResults.length === 0) {
    const fastest = valid[0]
    return `Fastest: ${fastest.model} at ${fastest.latency_ms}ms`
  }
  const cpuBest = cpuResults[0]
  const gpuBest = gpuResults[0]
  const speedup = (cpuBest.latency_ms / gpuBest.latency_ms).toFixed(1)
  if (task === 'classification') return `Classification: all models correct. Gaudi is ${speedup}x faster but CPU is fine at $0.`
  if (task === 'ner') return `NER: Gaudi is ${speedup}x faster. Gaudi models extract dosages (500mg, 10mg) that CPU models miss.`
  if (task === 'summarization') return `Summarization: Gaudi is ${speedup}x faster with more detailed output. Worth the cost for real-time use.`
  return `Gaudi is ${speedup}x faster. CPU at $0 vs GPU at $/token — the tradeoff depends on your volume.`
}

export function Act03Benchmark({ onComplete }: Props) {
  const [selectedTask, setSelectedTask] = useState(0)
  const [results, setResults] = useState<BenchmarkResult[] | null>(null)
  const [running, setRunning] = useState(false)

  const runBenchmark = async () => {
    setRunning(true)
    setResults(null)
    const task = TASKS[selectedTask]
    try {
      const resp = await fetch('/healthcare/api/v1/benchmark/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: task.id, text: task.text, models: MODELS }),
      })
      const data = await resp.json()
      setResults(data.results || [])
    } catch {
      setResults([{ model: 'error', hardware: 'cpu', task: task.id, latency_ms: 0, error: 'Backend not reachable' }])
    }
    setRunning(false)
  }

  return (
    <div className="demo-section">
      <h3><span className="section-num">03</span> The Challenge: CPU vs GPU</h3>
      <div className="section-context">
        CPU proved it works. But does it work well enough for every task?
        Same clinical text. Same question. Different models on different hardware.
        Watch the tradeoff: latency, quality, and cost side by side.
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {TASKS.map((t, i) => (
          <button key={t.id}
            className={`btn ${i === selectedTask ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 13, padding: '6px 14px' }}
            onClick={() => { setSelectedTask(i); setResults(null) }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 16, fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
        <strong>Input:</strong> {TASKS[selectedTask].text.slice(0, 150)}...
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={runBenchmark} disabled={running}
          style={{ minWidth: 200 }}>
          {running ? 'Running benchmark...' : `Run ${TASKS[selectedTask].label} Benchmark →`}
        </button>
      </div>

      {results && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-dim)' }}>Model</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', color: 'var(--text-dim)' }}>Hardware</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text-dim)' }}>Latency</th>
                <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text-dim)' }}>Tokens</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-dim)' }}>Output</th>
              </tr>
            </thead>
            <tbody>
              {results.filter(r => !r.error).map((r, i) => (
                <motion.tr key={r.model}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="mono" style={{ padding: '10px', fontWeight: 600 }}>{r.model}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                      background: r.hardware === 'gpu' ? 'var(--gpu-amber-dim)' : 'var(--intel-cyan-dim)',
                      color: hardwareColor(r.hardware),
                    }}>
                      {r.hardware.toUpperCase()}
                    </span>
                  </td>
                  <td className="mono" style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: i === 0 ? 'var(--rh-green)' : 'var(--text-primary)' }}>
                    {r.latency_ms}ms
                  </td>
                  <td className="mono" style={{ padding: '10px', textAlign: 'right', color: 'var(--text-dim)' }}>
                    {r.output_tokens || '—'}
                  </td>
                  <td style={{ padding: '10px', fontSize: 12, color: 'var(--text-dim)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {(r.output || '').slice(0, 60)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {results.filter(r => !r.error).length >= 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'var(--surface-2)', fontSize: 13, color: 'var(--rh-green)', fontWeight: 600, textAlign: 'center' }}>
              {getInsight(TASKS[selectedTask].id, results)}
            </motion.div>
          )}

          {results.some(r => r.error) && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-disabled)', textAlign: 'center' }}>
              {results.filter(r => r.error).map(r => `${r.model}: ${r.error}`).join(' · ')}
            </div>
          )}
        </motion.div>
      )}

      {results && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button className="btn btn-primary" onClick={onComplete}>
            See how it scales →
          </button>
        </div>
      )}
    </div>
  )
}
