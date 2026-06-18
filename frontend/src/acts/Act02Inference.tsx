import { useState } from 'react'

export function Act02Inference() {
  const [classifyResult, setClassifyResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runClassify = async () => {
    setLoading(true)
    try {
      const resp = await fetch('http://localhost:8081/api/v1/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin and Lisinopril. Recent STEMI with PCI to RCA.' }),
      })
      setClassifyResult(await resp.json())
    } catch (e) {
      setClassifyResult({ error: 'Backend not reachable' })
    }
    setLoading(false)
  }

  return (
    <div className="demo-section">
      <h3><span className="section-num">02</span> The Proof: Inference on Xeon 6</h3>
      <div className="section-context">
        "Can it actually process our workloads?" Watch a clinical document flow through
        the LangGraph pipeline — classify, extract entities, check drug interactions,
        summarize. All on Intel Xeon 6 CPU. All at $0/token.
      </div>

      <div className="step-card">
        <span className="step-num">1</span>
        <strong>Classify a Clinical Document</strong>
        <div className="step-question">"What type of document is this?" → granite-2b-cpu on Xeon 6</div>

        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={runClassify} disabled={loading}>
            {loading ? 'Classifying on Xeon 6...' : 'Classify on Xeon 6'}
          </button>
        </div>

        {classifyResult && !classifyResult.error && (
          <div className="card" style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Classification</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--rh-green)' }}>{classifyResult.classification}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Latency</div>
                <div className="pipe-node-latency">{classifyResult.inference_ms}ms</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Model</div>
                <div className="mono" style={{ color: 'var(--intel-cyan)' }}>{classifyResult.model}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Accelerator</div>
                <div className="mono" style={{ color: 'var(--rh-green)' }}>{classifyResult.accelerator}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Cost</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--rh-green)' }}>$0.00</div>
              </div>
            </div>
          </div>
        )}

        {classifyResult?.error && (
          <div className="card" style={{ marginTop: 16, borderColor: 'var(--rh-orange)' }}>
            <span style={{ color: 'var(--rh-orange)' }}>{classifyResult.error}. Start the backend: <code>make up</code></span>
          </div>
        )}
      </div>
    </div>
  )
}
