import { useState, useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import { PipelineAnimation, type PipelineNode } from '../components/PipelineAnimation'
import { useDemoMetrics } from '../DemoContext'

interface Props { onComplete?: () => void }

const SAMPLE_TEXT = 'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin and Lisinopril. Recent STEMI with PCI to RCA. Started on Aspirin 81mg, Clopidogrel 75mg, Atorvastatin 80mg. Monitoring for bleeding risk given dual antiplatelet therapy.'

const INITIAL_NODES: PipelineNode[] = [
  { id: 'classify', label: 'Classify', model: 'granite-2b-cpu', status: 'pending' },
  { id: 'extract', label: 'Extract Entities', model: 'granite-2b-cpu', status: 'pending' },
  { id: 'interactions', label: 'Check Interactions', model: 'MCP tool', status: 'pending', conditional: true },
  { id: 'summarize', label: 'Summarize', model: 'qwen25-3b-cpu', status: 'pending' },
]

const STEP_DELAYS = [0, 800, 6500, 8000]

interface PipelineResult {
  classification: string
  entities: Array<{ text: string; type: string }>
  drug_interactions: Array<{ drug_a?: string; drug_b?: string; severity?: string; description?: string }>
  summary: string
  inference_log: Array<{ node: string; model?: string; latency_ms: number }>
  total_ms: number
}

interface FraudResult {
  transaction_id: string
  risk_score: number
  risk_level: string
  signals: Array<{ signal: string; weight: number }>
  recommendation: string
  model: string
  inference_ms: number
}

const RISK_COLORS: Record<string, string> = {
  low: 'var(--rh-green)',
  medium: 'var(--rh-orange)',
  high: 'var(--rh-red)',
  critical: 'var(--rh-red)',
}

const FRAUD_TRANSACTIONS = [
  { id: 'tx-demo-001', label: 'Suspicious wire transfer', amount: 15000, currency: 'USD', merchant_category: 'wire_transfer', country: 'NG', customer_id: 'cust-042' },
  { id: 'tx-demo-002', label: 'Normal retail purchase', amount: 89.50, currency: 'USD', merchant_category: 'retail', country: 'US', customer_id: 'cust-042' },
]

export function Act02Inference({ onComplete }: Props) {
  const { setPipeline } = useDemoMetrics()
  const [nodes, setNodes] = useState<PipelineNode[]>(INITIAL_NODES)
  const [result, setResult] = useState<PipelineResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [healthcareDone, setHealthcareDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const [fraudResults, setFraudResults] = useState<FraudResult[]>([])
  const [fraudLoading, setFraudLoading] = useState(false)
  const [fraudDone, setFraudDone] = useState(false)

  const activateNode = useCallback((idx: number) => {
    setNodes(prev => prev.map((n, i) => {
      if (i < idx) return { ...n, status: 'done' as const }
      if (i === idx) return { ...n, status: 'active' as const }
      return n
    }))
  }, [])

  const reconcileWithResult = useCallback((data: PipelineResult) => {
    setNodes(prev => prev.map(n => {
      const logEntry = data.inference_log.find(e => {
        if (n.id === 'classify') return e.node === 'classify'
        if (n.id === 'extract') return e.node === 'extract_entities'
        if (n.id === 'interactions') return e.node === 'check_interactions'
        if (n.id === 'summarize') return e.node === 'summarize'
        return false
      })

      if (n.id === 'interactions' && !logEntry) {
        return { ...n, status: 'skipped' as const }
      }

      return {
        ...n,
        status: 'done' as const,
        latencyMs: logEntry?.latency_ms,
        detail: n.id === 'interactions' && data.drug_interactions.length > 0
          ? `${data.drug_interactions.length} found`
          : undefined,
      }
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
      const data: PipelineResult = await resp.json()

      timersRef.current.forEach(clearTimeout)
      reconcileWithResult(data)
      setResult(data)
      setHealthcareDone(true)
      const log = data.inference_log || []
      setPipeline({
        classifyMs: log.find(e => e.node === 'classify')?.latency_ms || 0,
        nerMs: log.find(e => e.node === 'extract_entities')?.latency_ms || 0,
        interactionsMs: log.find(e => e.node === 'check_interactions')?.latency_ms || 0,
        summarizeMs: log.find(e => e.node === 'summarize')?.latency_ms || 0,
        totalMs: data.total_ms,
        entities: data.entities?.length || 0,
        interactions: data.drug_interactions?.length || 0,
      })
    } catch {
      timersRef.current.forEach(clearTimeout)
      setNodes(INITIAL_NODES)
      setError('Backend not reachable. Start the stack: make up')
    }
    setLoading(false)
  }

  const runFraudScoring = async () => {
    setFraudLoading(true)
    setFraudResults([])
    try {
      const results = await Promise.all(
        FRAUD_TRANSACTIONS.map(async (tx) => {
          const resp = await fetch('/finserv/api/v1/score-transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tx),
          })
          return resp.json()
        })
      )
      setFraudResults(results)
      setFraudDone(true)
    } catch {
      setError('FinServ agent not reachable')
    }
    setFraudLoading(false)
  }

  const allDone = healthcareDone && fraudDone

  return (
    <div className="demo-section">
      <h3><span className="section-num">02</span> The Proof: Inference on Xeon 6</h3>
      <div className="section-context">
        Two verticals. Two languages. Same CPUs. Watch a clinical document flow through
        a Python/LangGraph pipeline, then score financial transactions with a Java/Quarkus
        agent — all on Intel Xeon 6, all at $0.
      </div>

      {/* Step 1: Healthcare Pipeline */}
      <div className="step-card">
        <span className="step-num">1</span>
        <strong>Healthcare: Clinical NLP Pipeline</strong>
        <div className="step-question">Python · LangGraph · 4 nodes, 3 models → classify, extract, check interactions, summarize</div>

        <div style={{
          marginTop: 12, padding: 12, background: 'var(--surface-2)', borderRadius: 8,
          fontSize: 13, color: 'var(--text-dim)', fontFamily: "'Red Hat Mono', monospace",
          lineHeight: 1.6,
        }}>
          {SAMPLE_TEXT}
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button className="btn btn-primary" onClick={runPipeline} disabled={loading}>
            {loading ? 'Running pipeline on Xeon 6...' : 'Run Pipeline on Xeon 6'}
          </button>
        </div>

        <PipelineAnimation nodes={nodes} />

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12, marginTop: 16,
            }}>
              <div className="card" style={{ borderLeft: '3px solid var(--rh-green)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Classification</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--rh-green)', marginTop: 4 }}>
                  {result.classification}
                </div>
              </div>

              <div className="card" style={{ borderLeft: '3px solid var(--intel-cyan)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Entities Found</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--intel-cyan)', marginTop: 4 }}>
                  {result.entities.length}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                  {result.entities.slice(0, 5).map(e => e.text).join(', ')}
                </div>
              </div>

              <div className="card" style={{ borderLeft: '3px solid var(--rh-orange)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Drug Interactions</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--rh-orange)', marginTop: 4 }}>
                  {result.drug_interactions.length}
                </div>
                {result.drug_interactions.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                    {result.drug_interactions.slice(0, 2).map(i =>
                      `${i.drug_a} + ${i.drug_b}: ${i.severity}`
                    ).join('; ')}
                  </div>
                )}
              </div>

              <div className="card" style={{ borderLeft: '3px solid var(--rh-purple)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Pipeline</div>
                <div className="pipe-node-latency" style={{ marginTop: 4 }}>
                  {result.total_ms}ms
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--rh-green)', marginTop: 4 }}>
                  $0.00
                </div>
              </div>
            </div>

            {result.summary && (
              <motion.div
                className="card"
                style={{ marginTop: 12, borderLeft: '3px solid var(--ibm-blue)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Clinical Summary
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  {result.summary}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Step 2: FinServ Fraud Scoring */}
      {healthcareDone && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="step-card" style={{ borderLeft: '3px solid var(--ibm-blue)' }}>
            <span className="step-num" style={{ background: 'var(--ibm-blue)' }}>2</span>
            <strong>FinServ: Fraud Scoring</strong>
            <div className="step-question">Java · Quarkus · Score transactions for fraud risk in real time</div>

            <div style={{ marginTop: 12 }}>
              {FRAUD_TRANSACTIONS.map((tx) => (
                <div key={tx.id} style={{
                  padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 8,
                  fontSize: 13, marginBottom: 6, display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', fontFamily: "'Red Hat Mono', monospace",
                }}>
                  <span style={{ color: 'var(--text-dim)' }}>{tx.label}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    ${tx.amount.toLocaleString()} {tx.currency} · {tx.country}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <button className="btn btn-primary" onClick={runFraudScoring} disabled={fraudLoading}
                style={{ background: 'var(--ibm-blue)' }}>
                {fraudLoading ? 'Scoring transactions...' : 'Score Transactions on Xeon 6'}
              </button>
            </div>

            {fraudResults.length > 0 && (
              <motion.div
                style={{ marginTop: 16 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {fraudResults.map((fr, i) => (
                  <motion.div
                    key={fr.transaction_id}
                    className="card"
                    style={{ borderLeft: `3px solid ${RISK_COLORS[fr.risk_level] || 'var(--border)'}` }}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{FRAUD_TRANSACTIONS[i]?.label}</div>
                        <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          ${FRAUD_TRANSACTIONS[i]?.amount.toLocaleString()} · {FRAUD_TRANSACTIONS[i]?.country}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Risk</div>
                          <div style={{
                            fontSize: 16, fontWeight: 700,
                            color: RISK_COLORS[fr.risk_level] || 'var(--text-secondary)',
                          }}>
                            {fr.risk_level.toUpperCase()}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Score</div>
                          <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--intel-cyan)' }}>
                            {fr.risk_score}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Action</div>
                          <div style={{
                            fontSize: 14, fontWeight: 600,
                            color: fr.recommendation === 'approve' ? 'var(--rh-green)' : 'var(--rh-red)',
                          }}>
                            {fr.recommendation.toUpperCase()}
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Latency</div>
                          <div className="pipe-node-latency" style={{ fontSize: 14 }}>
                            {fr.inference_ms}ms
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Cost</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--rh-green)' }}>$0.00</div>
                        </div>
                      </div>
                    </div>
                    {fr.signals.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {fr.signals.map((s, j) => (
                          <span key={j} className="mono" style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 4,
                            background: 'var(--rh-orange-dim)', color: 'var(--rh-orange)',
                          }}>
                            {s.signal}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}

                <motion.div
                  className="card card-accent-intel"
                  style={{ textAlign: 'center', marginTop: 12 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Two verticals — Python + Java — same Xeon 6, same $0.00
                  </span>
                </motion.div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {error && (
        <div className="card" style={{ marginTop: 16, borderColor: 'var(--rh-orange)' }}>
          <span style={{ color: 'var(--rh-orange)' }}>{error}</span>
        </div>
      )}

      {allDone && (
        <motion.div
          style={{ textAlign: 'center', marginTop: 24 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button className="btn btn-primary" onClick={onComplete}>
            See the cost story →
          </button>
        </motion.div>
      )}
    </div>
  )
}
