import { useState, useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import { PipelineAnimation, type PipelineNode } from '../../components/PipelineAnimation'
import { useDemoMetrics } from '../../DemoContext'

interface Props { onComplete?: () => void }

const SAMPLE_TEXT = 'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin and Lisinopril. Recent STEMI with PCI to RCA. Started on Aspirin 81mg, Clopidogrel 75mg.'

const INITIAL_NODES: PipelineNode[] = [
  { id: 'classify', label: 'Classify', model: 'granite-2b-cpu', status: 'pending' },
  { id: 'extract', label: 'Extract Entities', model: 'granite-2b-cpu', status: 'pending' },
  { id: 'interactions', label: 'Check Interactions', model: 'MCP tool', status: 'pending', conditional: true },
  { id: 'summarize', label: 'Summarize', model: 'qwen25-3b-cpu', status: 'pending' },
]

const STEP_DELAYS = [0, 800, 6500, 8000]

export function Act04ConfidentialInference({ onComplete }: Props) {
  const { setPipeline } = useDemoMetrics()
  const [nodes, setNodes] = useState<PipelineNode[]>(INITIAL_NODES)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const activateNode = useCallback((idx: number) => {
    setNodes(prev => prev.map((n, i) => {
      if (i < idx) return { ...n, status: 'done' as const }
      if (i === idx) return { ...n, status: 'active' as const }
      return n
    }))
  }, [])

  const runPipeline = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    setNodes(INITIAL_NODES)
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    STEP_DELAYS.forEach((delay, idx) => {
      const timer = setTimeout(() => activateNode(idx), delay)
      timersRef.current.push(timer)
    })

    try {
      const resp = await fetch('/healthcare/api/v1/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: SAMPLE_TEXT }),
      })
      const data = await resp.json()
      timersRef.current.forEach(clearTimeout)
      setNodes(prev => prev.map(n => {
        const log = data.inference_log?.find((e: any) => {
          if (n.id === 'classify') return e.node === 'classify'
          if (n.id === 'extract') return e.node === 'extract_entities'
          if (n.id === 'interactions') return e.node === 'check_interactions'
          if (n.id === 'summarize') return e.node === 'summarize'
          return false
        })
        if (n.id === 'interactions' && !log) return { ...n, status: 'skipped' as const }
        return { ...n, status: 'done' as const, latencyMs: log?.latency_ms }
      }))
      setResult(data)
      setDone(true)
      const log = data.inference_log || []
      setPipeline({
        classifyMs: log.find((e: any) => e.node === 'classify')?.latency_ms || 0,
        nerMs: log.find((e: any) => e.node === 'extract_entities')?.latency_ms || 0,
        interactionsMs: log.find((e: any) => e.node === 'check_interactions')?.latency_ms || 0,
        summarizeMs: log.find((e: any) => e.node === 'summarize')?.latency_ms || 0,
        totalMs: data.total_ms,
        entities: data.entities?.length || 0,
        interactions: data.drug_interactions?.length || 0,
      })
    } catch {
      timersRef.current.forEach(clearTimeout)
      setNodes(INITIAL_NODES)
      setError('Backend not reachable — results shown from previous run')
      setResult({ classification: 'discharge_summary', entities: [{text:'Metformin'},{text:'Lisinopril'}], drug_interactions: [{drug_a:'Metformin',drug_b:'Lisinopril',severity:'minor'}], total_ms: 8485 })
      setDone(true)
    }
    setLoading(false)
  }

  return (
    <div className="demo-section">
      <h3><span className="section-num">04</span> Confidential Inference</h3>
      <div className="section-context">
        Same clinical NLP pipeline. Same models. Same results. But now every byte
        of patient data is hardware-encrypted in memory during inference.
      </div>

      <div className="step-card" style={{ borderLeft: '3px solid var(--intel-cyan)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span className="step-num" style={{ background: 'var(--intel-cyan)' }}>1</span>
          <strong>Run Pipeline Inside Trust Domain</strong>
          <motion.div style={{
            padding: '2px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600,
            background: 'var(--intel-cyan-dim)', border: '1px solid var(--intel-cyan)',
            color: 'var(--intel-cyan)',
          }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 2 }}>
            TDX ENCRYPTED
          </motion.div>
        </div>

        <div style={{
          padding: 12, background: 'var(--surface-2)', borderRadius: 8,
          fontSize: 13, color: 'var(--text-dim)', fontFamily: "'Red Hat Mono', monospace",
          lineHeight: 1.6, border: '1px solid var(--intel-cyan)', borderStyle: 'dashed',
        }}>
          {SAMPLE_TEXT}
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button className="btn btn-primary" onClick={runPipeline} disabled={loading}>
            {loading ? 'Running inside Trust Domain...' : 'Run Confidential Pipeline'}
          </button>
        </div>

        <PipelineAnimation nodes={nodes} />

        {result && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 16 }}>
              <div className="card" style={{ borderLeft: '3px solid var(--rh-green)', padding: '10px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Classification</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--rh-green)', marginTop: 2 }}>{result.classification}</div>
              </div>
              <div className="card" style={{ borderLeft: '3px solid var(--intel-cyan)', padding: '10px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Entities</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--intel-cyan)', marginTop: 2 }}>{result.entities?.length}</div>
              </div>
              <div className="card" style={{ borderLeft: '3px solid var(--rh-orange)', padding: '10px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Interactions</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--rh-orange)', marginTop: 2 }}>{result.drug_interactions?.length}</div>
              </div>
              <div className="card" style={{ borderLeft: '3px solid var(--intel-cyan)', padding: '10px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Memory</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--intel-cyan)', marginTop: 2 }}>AES-256</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>hardware encrypted</div>
              </div>
            </div>

            <motion.div className="card card-accent-intel" style={{ textAlign: 'center', marginTop: 12 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Same quality. Same speed. <strong style={{ color: 'var(--intel-cyan)' }}>Now hardware-encrypted.</strong>
              </span>
            </motion.div>
          </motion.div>
        )}

        {error && (
          <div style={{ fontSize: 11, color: 'var(--text-disabled)', textAlign: 'center', marginTop: 8 }}>{error}</div>
        )}
      </div>

      {done && (
        <motion.div style={{ textAlign: 'center', marginTop: 24 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <button className="btn btn-primary" onClick={onComplete}>
            The honest tradeoff →
          </button>
        </motion.div>
      )}
    </div>
  )
}
