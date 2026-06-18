import { useState } from 'react'
import { motion } from 'motion/react'

interface Props { onComplete?: () => void }

export function Act02Inference({ onComplete }: Props) {
  const [classifyResult, setClassifyResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const runClassify = async () => {
    setLoading(true)
    try {
      const resp = await fetch('/healthcare/api/v1/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin and Lisinopril. Recent STEMI with PCI to RCA.' }),
      })
      const data = await resp.json()
      setClassifyResult(data)
      setDone(true)
    } catch (e) {
      setClassifyResult({ error: 'Backend not reachable' })
    }
    setLoading(false)
  }

  return (
    <div className="demo-section">
      <h3><span className="section-num">02</span> The Proof: Inference on Xeon 6</h3>
      <div className="section-context">
        "Can it actually process our workloads?" Watch a clinical document get classified
        by IBM Granite running on Intel Xeon 6 CPU. Real inference. Real latency. $0 cost.
      </div>

      <div className="step-card">
        <span className="step-num">1</span>
        <strong>Classify a Clinical Document</strong>
        <div className="step-question">"What type of document is this?" → granite-2b-cpu on Xeon 6</div>

        <div style={{ marginTop: 12, padding: 12, background: 'var(--surface-2)', borderRadius: 8, fontSize: 13, color: 'var(--text-dim)', fontFamily: "'Red Hat Mono', monospace" }}>
          DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin and Lisinopril. Recent STEMI with PCI to RCA.
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={runClassify} disabled={loading}>
            {loading ? '⏳ Classifying on Xeon 6...' : '⚡ Classify on Xeon 6'}
          </button>
        </div>

        {classifyResult && !classifyResult.error && (
          <motion.div
            className="card"
            style={{ marginTop: 16 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Classification</div>
                <motion.div
                  style={{ fontSize: 22, fontWeight: 700, color: 'var(--rh-green)' }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                >
                  {classifyResult.classification}
                </motion.div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Latency</div>
                <motion.div
                  className="pipe-node-latency"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {classifyResult.inference_ms}ms
                </motion.div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Model</div>
                <div className="mono" style={{ color: 'var(--intel-cyan)', fontSize: 15 }}>{classifyResult.model}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Hardware</div>
                <div className="mono" style={{ color: 'var(--rh-green)', fontSize: 15 }}>Xeon 6 CPU</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Cost</div>
                <motion.div
                  style={{ fontSize: 22, fontWeight: 700, color: 'var(--rh-green)' }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.3 }}
                >
                  $0.00
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {classifyResult?.error && (
          <div className="card" style={{ marginTop: 16, borderColor: 'var(--rh-orange)' }}>
            <span style={{ color: 'var(--rh-orange)' }}>⚠ {classifyResult.error}. Start the backend: <code>make up</code></span>
          </div>
        )}
      </div>

      {done && (
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
