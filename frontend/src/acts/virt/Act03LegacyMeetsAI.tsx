import { useState } from 'react'
import { motion } from 'motion/react'
import { useDemoMetrics } from '../../DemoContext'

interface Props { onComplete?: () => void }

export function Act03LegacyMeetsAI({ onComplete }: Props) {
  const { setPipeline } = useDemoMetrics()
  const [callResult, setCallResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const makeCall = async () => {
    setLoading(true)
    try {
      const resp = await fetch('/healthcare/api/v1/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin.' }),
      })
      const data = await resp.json()
      setCallResult(data)
      setPipeline({
        classifyMs: data.inference_ms || 0,
        nerMs: 0, interactionsMs: 0, summarizeMs: 0,
        totalMs: data.inference_ms || 0,
        entities: 0, interactions: 0,
      })
    } catch {
      setCallResult({ classification: 'discharge_summary', inference_ms: 828, model: 'granite-2b-cpu', simulated: true })
    }
    setLoading(false)
    setDone(true)
  }

  return (
    <div className="demo-section">
      <h3><span className="section-num">03</span> Legacy Meets AI</h3>
      <div className="section-context">
        The legacy database VM needs to classify a clinical document. It doesn't
        need a new API gateway or a bridge network. It calls the AI agent the same
        way any Kubernetes pod would — via Service DNS.
      </div>

      <div className="step-card" style={{ borderLeft: '3px solid var(--rh-green)' }}>
        <span className="step-num" style={{ background: 'var(--rh-green)' }}>1</span>
        <strong>VM Calls AI Agent</strong>
        <div className="step-question">From inside the legacy VM → standard K8s Service → Healthcare Agent</div>

        <motion.div style={{
          marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 0, flexWrap: 'wrap',
        }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <motion.div style={{
            padding: '14px 18px', borderRadius: 10, background: 'var(--surface-2)',
            border: '2px solid var(--rh-red)', textAlign: 'center', minWidth: 130,
          }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--rh-red)' }}>Legacy VM</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>RHEL 9 · database</div>
            <motion.div className="mono" style={{ fontSize: 9, color: 'var(--rh-green)', marginTop: 6, padding: '2px 8px', borderRadius: 4, background: 'var(--rh-green-dim)', display: 'inline-block' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              $ virtctl ssh
            </motion.div>
          </motion.div>

          <motion.div style={{ padding: '0 4px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <svg width="50" height="20" viewBox="0 0 50 20">
              <motion.line x1="0" y1="10" x2="38" y2="10" stroke="var(--rh-green)" strokeWidth="2"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.7, duration: 0.5 }} />
              <polygon points="36,6 44,10 36,14" fill="var(--rh-green)" />
            </svg>
          </motion.div>

          <motion.div style={{
            padding: '14px 18px', borderRadius: 10, background: 'var(--surface-2)',
            border: '2px solid var(--intel-cyan)', textAlign: 'center', minWidth: 130,
          }} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--intel-cyan)' }}>Healthcare Agent</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>Python · granite-2b</div>
          </motion.div>
        </motion.div>

        <motion.div style={{
          marginTop: 16, padding: 12, background: 'var(--surface-2)', borderRadius: 8,
          fontFamily: "'Red Hat Mono', monospace", fontSize: 12, lineHeight: 1.8,
        }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>
          <div style={{ color: 'var(--rh-green)' }}>$ curl http://healthcare-agent:8081/api/v1/classify \</div>
          <div style={{ color: 'var(--text-dim)' }}>{'    '}-H "Content-Type: application/json" \</div>
          <div style={{ color: 'var(--text-dim)' }}>{'    '}-d '{`{"text": "DISCHARGE SUMMARY: 72-year-old male..."}`}'</div>
        </motion.div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={makeCall} disabled={loading}>
            {loading ? 'Calling from VM...' : done ? 'Call again' : 'Simulate VM → Agent call'}
          </button>
        </div>

        {callResult && (
          <motion.div style={{ marginTop: 16 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <div className="card" style={{ borderLeft: '3px solid var(--rh-green)', padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Classification</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--rh-green)', marginTop: 2 }}>{callResult.classification}</div>
              </div>
              <div className="card" style={{ borderLeft: '3px solid var(--intel-cyan)', padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Latency</div>
                <div className="pipe-node-latency" style={{ marginTop: 2, fontSize: 16 }}>{callResult.inference_ms}ms</div>
              </div>
              <div className="card" style={{ borderLeft: '3px solid var(--intel-cyan)', padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Model</div>
                <div className="mono" style={{ fontSize: 13, color: 'var(--intel-cyan)', marginTop: 2 }}>{callResult.model}</div>
              </div>
            </div>
            {callResult.simulated && (
              <div style={{ fontSize: 10, color: 'var(--text-disabled)', textAlign: 'center', marginTop: 6 }}>simulated — backend not connected</div>
            )}

            <motion.div className="card card-accent-redhat" style={{ textAlign: 'center', marginTop: 12 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Legacy VM called AI agent via standard K8s networking. <strong style={{ color: 'var(--rh-green)' }}>No re-architecture.</strong>
              </span>
            </motion.div>
          </motion.div>
        )}
      </div>

      {done && (
        <motion.div style={{ textAlign: 'center', marginTop: 24 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <button className="btn btn-primary" onClick={onComplete}>The migration path →</button>
        </motion.div>
      )}
    </div>
  )
}
