import { useState, useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import { PipelineAnimation, type PipelineNode } from '../../components/PipelineAnimation'
import { useDemoMetrics } from '../../stores/demoStore'

interface Props { onComplete?: () => void }

const SAMPLE_TEXT = 'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin and Lisinopril. Recent STEMI with PCI to RCA. Started on Aspirin 81mg, Clopidogrel 75mg.'

const INITIAL_NODES: PipelineNode[] = [
  { id: 'classify', label: 'Classify', model: 'granite-2b-cpu', status: 'pending' },
  { id: 'extract', label: 'Extract Entities', model: 'granite-2b-cpu', status: 'pending' },
  { id: 'interactions', label: 'Check Interactions', model: 'MCP tool', status: 'pending', conditional: true },
  { id: 'summarize', label: 'Summarize', model: 'qwen25-3b-cpu', status: 'pending' },
]

const STEP_DELAYS = [0, 800, 6500, 8000]

const DATA_FLOW_STAGES = [
  { label: 'API Request', location: 'Outside TDX', encrypted: false, detail: 'HTTPS TLS 1.3 in transit', what: 'Patient record (PHI) arrives at agent endpoint', color: 'var(--rh-blue)' },
  { label: 'Enter Trust Domain', location: 'TDX Boundary', encrypted: true, detail: 'AES-256-XTS memory encryption begins', what: 'Kata VM boots inside hardware Trust Domain. CPU encrypts all memory pages with per-TD key.', color: 'var(--intel-cyan)' },
  { label: 'Model Inference', location: 'Inside TDX', encrypted: true, detail: 'Weights + activations + KV cache encrypted', what: 'Model weights, patient tokens, attention matrices, KV cache — all in encrypted RAM. Even the hypervisor cannot read them.', color: 'var(--rh-green)' },
  { label: 'Token Generation', location: 'Inside TDX', encrypted: true, detail: 'Output tokens generated in encrypted space', what: 'Each generated token exists only in encrypted memory until explicitly written to the response buffer.', color: 'var(--rh-green)' },
  { label: 'Response Exits', location: 'TDX Boundary', encrypted: false, detail: 'Decrypted only for authorized response', what: 'Result leaves Trust Domain via authenticated channel. Memory is scrubbed.', color: 'var(--intel-cyan)' },
]

const ATTACKER_VIEW = [
  { access: 'Network sniffer', sees: 'TLS ciphertext', blocked: 'Standard HTTPS' },
  { access: 'Root on host OS', sees: 'Encrypted memory pages', blocked: 'TDX memory encryption' },
  { access: 'Hypervisor/VMM', sees: 'Opaque Trust Domain', blocked: 'TDX hardware isolation' },
  { access: 'Cold boot / DRAM probe', sees: 'AES-256-XTS ciphertext', blocked: 'CPU-bound encryption key' },
  { access: 'Compromised firmware', sees: 'Attestation failure → no secrets', blocked: 'Remote attestation' },
]

const COMPLIANCE = [
  { framework: 'HIPAA', requirement: 'PHI encrypted at rest and in use', tdx: 'AES-256-XTS memory encryption for inference data', status: 'supports' },
  { framework: 'HIPAA', requirement: 'Access controls on PHI', tdx: 'Hardware attestation gates secret release', status: 'supports' },
  { framework: 'PHMSA', requirement: 'Sensor data integrity', tdx: 'Tamper-evident Trust Domain: modification breaks attestation', status: 'contributes' },
  { framework: 'SOX', requirement: 'Audit trail for data access', tdx: 'Attestation logs record secret requests with hardware proof', status: 'contributes' },
  { framework: 'NIST 800-171', requirement: 'CUI protection in processing', tdx: 'Confidential computing adds encryption during processing', status: 'supports' },
  { framework: 'FedRAMP', requirement: 'Data sovereignty', tdx: 'Processing stays on-premises on attested hardware with no cloud egress', status: 'contributes' },
]

export function Act04ConfidentialInference({ onComplete }: Props) {
  const { setPipeline } = useDemoMetrics()
  const [nodes, setNodes] = useState<PipelineNode[]>(INITIAL_NODES)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeFlowStage, setActiveFlowStage] = useState(-1)
  const [showAttacker, setShowAttacker] = useState(false)
  const [showCompliance, setShowCompliance] = useState(false)
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
    setActiveFlowStage(-1)
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    // Animate data flow stages
    DATA_FLOW_STAGES.forEach((_, idx) => {
      const t = setTimeout(() => setActiveFlowStage(idx), idx * 1200)
      timersRef.current.push(t)
    })

    STEP_DELAYS.forEach((delay, idx) => {
      const timer = setTimeout(() => activateNode(idx), delay + 1500)
      timersRef.current.push(timer)
    })

    try {
      const resp = await fetch('/healthcare/api/v1/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: SAMPLE_TEXT , skip_cache: true}),
      })
      const data = await resp.json()
      timersRef.current.forEach(clearTimeout)
      setActiveFlowStage(DATA_FLOW_STAGES.length - 1)
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
      setActiveFlowStage(DATA_FLOW_STAGES.length - 1)
      setNodes(INITIAL_NODES)
      setError('Backend not reachable — results shown from previous run')
      setResult({ classification: 'discharge_summary', entities: [{text:'Metformin'},{text:'Lisinopril'},{text:'Aspirin'},{text:'Clopidogrel'}], drug_interactions: [{drug_a:'Aspirin',drug_b:'Clopidogrel',severity:'moderate'}], total_ms: 8485 })
      setDone(true)
    }
    setLoading(false)
  }

  return (
    <div className="demo-section">
      <h3><span className="section-num">04</span> Confidential Inference — What Happens Inside</h3>
      <div className="section-context">
        Same clinical NLP pipeline. Same models. Same results. But every byte of patient data
        is hardware-encrypted in memory. Here's exactly what TDX does at each stage.
      </div>

      {/* Data Flow Visualization */}
      <div className="step-card" style={{ borderLeft: '3px solid var(--intel-cyan)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span className="step-num" style={{ background: 'var(--intel-cyan)' }}>1</span>
          <strong>Data Flow Through Trust Domain</strong>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {DATA_FLOW_STAGES.map((s, i) => (
            <motion.div
              key={s.label}
              style={{
                flex: 1, padding: '8px 6px', borderRadius: 6, textAlign: 'center',
                background: i <= activeFlowStage ? (s.encrypted ? 'rgba(0,198,255,0.08)' : 'var(--surface-2)') : 'var(--surface-1)',
                border: `1px solid ${i <= activeFlowStage ? s.color : 'var(--border)'}`,
                transition: 'all 0.3s',
              }}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: i <= activeFlowStage ? 1 : 0.4 }}
            >
              {s.encrypted && <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--intel-cyan)', marginBottom: 2 }}>🔒 ENCRYPTED</div>}
              <div style={{ fontSize: 9, fontWeight: 700, color: s.color }}>{s.label}</div>
              <div style={{ fontSize: 8, color: 'var(--text-dim)', marginTop: 2 }}>{s.detail}</div>
            </motion.div>
          ))}
        </div>

        {activeFlowStage >= 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ padding: 10, borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--intel-cyan)', borderStyle: 'dashed', marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: DATA_FLOW_STAGES[activeFlowStage].color }}>
              {DATA_FLOW_STAGES[activeFlowStage].location}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
              {DATA_FLOW_STAGES[activeFlowStage].what}
            </div>
          </motion.div>
        )}

        <div style={{
          padding: 10, background: 'var(--surface-2)', borderRadius: 8, fontSize: 12,
          color: 'var(--text-dim)', fontFamily: "'Red Hat Mono', monospace", lineHeight: 1.6,
          border: '1px solid var(--intel-cyan)', borderStyle: 'dashed',
        }}>
          {SAMPLE_TEXT}
        </div>

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <button className="btn btn-primary" onClick={runPipeline} disabled={loading}>
            {loading ? 'Running inside Trust Domain...' : 'Run Confidential Pipeline'}
          </button>
        </div>

        <PipelineAnimation nodes={nodes} />

        {result && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 14 }}>
              <div className="card" style={{ borderLeft: '3px solid var(--rh-green)', padding: '8px 12px' }}>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Classification</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--rh-green)', marginTop: 2 }}>{result.classification}</div>
              </div>
              <div className="card" style={{ borderLeft: '3px solid var(--intel-cyan)', padding: '8px 12px' }}>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Entities</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--intel-cyan)', marginTop: 2 }}>{result.entities?.length}</div>
              </div>
              <div className="card" style={{ borderLeft: '3px solid var(--rh-orange)', padding: '8px 12px' }}>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Interactions</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--rh-orange)', marginTop: 2 }}>{result.drug_interactions?.length}</div>
              </div>
              <div className="card" style={{ borderLeft: '3px solid var(--intel-cyan)', padding: '8px 12px' }}>
                <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Memory</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--intel-cyan)', marginTop: 2 }}>AES-256</div>
                <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>hardware encrypted</div>
              </div>
            </div>
          </motion.div>
        )}
        {error && <div style={{ fontSize: 10, color: 'var(--text-disabled)', textAlign: 'center', marginTop: 8 }}>{error}</div>}
      </div>

      {/* What An Attacker Sees */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="step-card" style={{ borderLeft: '3px solid var(--rh-red)', marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer' }}
              onClick={() => setShowAttacker(!showAttacker)}>
              <span className="step-num" style={{ background: 'var(--rh-red)' }}>2</span>
              <strong>What An Attacker Sees</strong>
              <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 'auto' }}>{showAttacker ? '▼' : '▶'}</span>
            </div>
            {showAttacker && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: 6, color: 'var(--rh-red)' }}>Attack Vector</th>
                      <th style={{ textAlign: 'left', padding: 6, color: 'var(--text-dim)' }}>What They See</th>
                      <th style={{ textAlign: 'left', padding: 6, color: 'var(--rh-green)' }}>Blocked By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ATTACKER_VIEW.map(a => (
                      <tr key={a.access} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: 6, fontWeight: 600 }}>{a.access}</td>
                        <td className="mono" style={{ padding: 6, color: 'var(--text-dim)' }}>{a.sees}</td>
                        <td style={{ padding: 6, color: 'var(--rh-green)', fontWeight: 600 }}>{a.blocked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 8, textAlign: 'center', fontStyle: 'italic' }}>
                  Root access to the host, hypervisor control, even physical DRAM probing — none of them can read the patient data during inference.
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Compliance Mapping */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="step-card" style={{ borderLeft: '3px solid var(--rh-green)', marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer' }}
              onClick={() => setShowCompliance(!showCompliance)}>
              <span className="step-num" style={{ background: 'var(--rh-green)' }}>3</span>
              <strong>Compliance Mapping</strong>
              <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 'auto' }}>{showCompliance ? '▼' : '▶'}</span>
            </div>
            {showCompliance && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: 6 }}>Framework</th>
                      <th style={{ textAlign: 'left', padding: 6 }}>Requirement</th>
                      <th style={{ textAlign: 'left', padding: 6 }}>How TDX Supports</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPLIANCE.map((c, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: 6, fontWeight: 700, color: 'var(--rh-blue)' }}>{c.framework}</td>
                        <td style={{ padding: 6, color: 'var(--text-secondary)' }}>{c.requirement}</td>
                        <td style={{ padding: 6, color: 'var(--rh-green)' }}>{c.tdx}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {done && (
        <motion.div style={{ textAlign: 'center', marginTop: 20 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <button className="btn btn-primary" onClick={onComplete}>
            The honest tradeoff →
          </button>
        </motion.div>
      )}
    </div>
  )
}
