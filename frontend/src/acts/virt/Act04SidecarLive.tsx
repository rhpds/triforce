import { useState } from 'react'
import { motion } from 'motion/react'

interface Props { onComplete?: () => void }

export function Act04SidecarLive({ onComplete }: Props) {
  const [result, setResult] = useState<any>(null)
  const [running, setRunning] = useState(false)

  const runSidecar = async () => {
    setRunning(true)
    const prompt = 'Compressor B vibration X-axis 6.8mm/s (baseline 4.2), Y-axis 5.9mm/s (baseline 3.8), trending up 22% over 40 minutes. Is this an anomaly? Brief answer.'
    try {
      const start = Date.now()
      const resp = await fetch('/bitnet/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'bitnet-2b4t',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 48, temperature: 0.1,
        }),
      })
      const data = await resp.json()
      setResult({
        content: data.choices?.[0]?.message?.content || '',
        ms: Date.now() - start,
        tokens: data.usage?.completion_tokens || 0,
        model: data.model || 'bitnet-2b4t',
      })
    } catch {
      setResult({ error: true, content: 'LiteLLM proxy not reachable' })
    }
    setRunning(false)
  }

  return (
    <div className="demo-section">
      <h3><span className="section-num">04</span> Same Model, Kubernetes Scale</h3>
      <div className="section-context">
        Same BitNet model, same prompt — but now routed through LiteLLM alongside 9 other models.
        At the edge, it's localhost. At the data center, it's a Kubernetes service.
      </div>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', margin: '16px 0' }}>
        <div style={{ padding: 14, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', flex: '1 1 180px', maxWidth: 220 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)' }}>EDGE MODE</div>
          <div className="mono" style={{ fontSize: 10, marginTop: 6, color: 'var(--text-secondary)' }}>
            SCADA VM → localhost:8080 → BitNet
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>Air-gapped. No external calls.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 20, color: 'var(--text-dim)' }}>→</div>
        <div style={{ padding: 14, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--intel-cyan)', flex: '1 1 180px', maxWidth: 220 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--intel-cyan)' }}>DATA CENTER MODE</div>
          <div className="mono" style={{ fontSize: 10, marginTop: 6, color: 'var(--text-secondary)' }}>
            App → LiteLLM → bitnet-server Pod
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>K8s service. 10 models routed.</div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button className="btn btn-primary" onClick={runSidecar} disabled={running}
          style={{ borderColor: 'var(--intel-cyan)' }}>
          {running ? 'Routing via LiteLLM...' : 'Run via LiteLLM Proxy (Data Center Mode)'}
        </button>
      </div>

      {result && !result.error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--intel-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--intel-cyan)' }}>
              BitNet via LiteLLM → bitnet-server Pod
            </span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>
              {result.ms}ms · {result.tokens} tok
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>{result.content}</div>
          <div style={{ fontSize: 10, color: 'var(--rh-green)', marginTop: 8, fontWeight: 600 }}>
            Same model. Same answer. Same $0/token. Different deployment mode.
          </div>
        </motion.div>
      )}

      {result && !result.error && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button className="btn btn-secondary" onClick={onComplete} style={{ fontSize: 12 }}>
            The math →
          </button>
        </div>
      )}
    </div>
  )
}
