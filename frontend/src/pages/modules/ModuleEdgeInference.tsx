import { useState } from 'react'
import { motion } from 'motion/react'
import { ModuleLayout, StepCard } from '../../components/ModuleLayout'
import { getConfig } from '../../config'

export default function ModuleEdgeInference() {
  const [demoResult, setDemoResult] = useState<any>(null)
  const [running, setRunning] = useState(false)
  const [compareResult, setCompareResult] = useState<any>(null)
  const [comparing, setComparing] = useState(false)

  const SENSOR_PROMPT = 'Compressor B vibration X-axis: 6.8 mm/s (baseline 4.2), Y-axis: 5.9 mm/s (baseline 3.8). Trend: increasing 22% over 40 minutes. Bearing temperature 192F (baseline 185F). Is this an anomaly? If so, what is the likely cause and recommended action? Answer concisely.'

  const runDemo = async () => {
    setRunning(true)
    try {
      const start = Date.now()
      const resp = await fetch('/litellm/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getConfig().litellmKey}` },
        body: JSON.stringify({
          model: 'bitnet-2b4t',
          messages: [
            { role: 'system', content: 'You are a field maintenance AI assistant for pipeline compressor stations. Analyze sensor data and provide concise actionable alerts.' },
            { role: 'user', content: SENSOR_PROMPT },
          ],
          max_tokens: 128,
          temperature: 0.1,
        }),
      })
      const data = await resp.json()
      setDemoResult({
        content: data.choices?.[0]?.message?.content || 'No response',
        latency_ms: Date.now() - start,
        tokens: data.usage?.completion_tokens || 0,
        model: data.model || 'bitnet-2b4t',
      })
    } catch {
      setDemoResult({ error: 'BitNet model not reachable' })
    }
    setRunning(false)
  }

  const runCompare = async () => {
    setComparing(true)
    const prompt = 'Is vibration of 6.8 mm/s on a compressor with baseline 4.2 mm/s an anomaly? Answer yes or no with one sentence explanation.'
    const results: any = {}
    for (const model of ['bitnet-2b4t', 'granite-2b-cpu', 'granite-3-2-8b-instruct-cpu']) {
      try {
        const start = Date.now()
        const resp = await fetch('/litellm/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getConfig().litellmKey}` },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 32,
            temperature: 0.1,
          }),
        })
        const data = await resp.json()
        results[model] = {
          content: data.choices?.[0]?.message?.content?.substring(0, 80) || '',
          ms: Date.now() - start,
          tokens: data.usage?.completion_tokens || 0,
        }
      } catch {
        results[model] = { content: 'unavailable', ms: 0, tokens: 0 }
      }
    }
    setCompareResult(results)
    setComparing(false)
  }

  const models = [
    { name: 'BitNet b1.58 2B4T', params: '2.4B', bits: '1.58-bit', mem: '0.4 GB', speed: 'Live run', energy: 'Estimate', color: 'var(--intel-cyan)' },
    { name: 'Granite 2B (INT4)', params: '2B', bits: '4-bit', mem: '1.2 GB', speed: 'Live run', energy: 'Estimate', color: 'var(--text-dim)' },
    { name: 'Granite 8B (INT4)', params: '8B', bits: '4-bit', mem: '4.0 GB', speed: 'Live run', energy: 'Estimate', color: 'var(--text-dim)' },
    { name: 'Cloud API', params: '?', bits: 'N/A', mem: 'N/A', speed: 'Provider data', energy: 'N/A', color: 'var(--text-dim)' },
  ]

  return (
    <ModuleLayout
      title="Edge Inference (1-Bit / 2-Bit Models)"
      description="Sub-1B agentic AI on existing edge hardware. Ternary weights turn multiply-accumulate into add/subtract: pure CPU integer math with live latency measured by the demo."
      status="live"
    >
      <StepCard num={1} title="How 1-Bit Inference Works">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 12 }}>
          <div style={{ padding: 12, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 8 }}>STANDARD MODEL (FP16/INT4)</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--rh-red)' }}>weight = 0.7843</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--rh-red)' }}>output = input * 0.7843</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>Floating-point multiply — expensive on CPU</div>
          </div>
          <div style={{ padding: 12, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--intel-cyan)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--intel-cyan)', marginBottom: 8 }}>BITNET 1.58-BIT (TERNARY)</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--rh-green)' }}>{'weight = {-1, 0, +1}'}</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--rh-green)' }}>output = -input | 0 | +input</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>Add/subtract/skip — native CPU integer ops</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          Ternary weights eliminate multiply-accumulate entirely. Every parameter is -1, 0, or +1.
          The CPU does what it does best — integer arithmetic. No GPU, no specialized hardware.
        </div>
      </StepCard>

      <StepCard num={2} title="Model Comparison">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: 6 }}>Model</th>
              <th style={{ textAlign: 'right', padding: 6 }}>Params</th>
              <th style={{ textAlign: 'right', padding: 6 }}>Precision</th>
              <th style={{ textAlign: 'right', padding: 6 }}>Memory</th>
              <th style={{ textAlign: 'right', padding: 6 }}>Speed</th>
              <th style={{ textAlign: 'right', padding: 6 }}>Energy</th>
            </tr>
          </thead>
          <tbody>
            {models.map(m => (
              <tr key={m.name} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: 6, fontWeight: 600, color: m.color }}>{m.name}</td>
                <td className="mono" style={{ textAlign: 'right', padding: 6 }}>{m.params}</td>
                <td className="mono" style={{ textAlign: 'right', padding: 6 }}>{m.bits}</td>
                <td className="mono" style={{ textAlign: 'right', padding: 6 }}>{m.mem}</td>
                <td className="mono" style={{ textAlign: 'right', padding: 6 }}>{m.speed}</td>
                <td className="mono" style={{ textAlign: 'right', padding: 6 }}>{m.energy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </StepCard>

      <StepCard num={3} title="Live: Sensor Anomaly Detection">
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>
          Send a compressor station sensor reading to BitNet. The model runs on the same Xeon node
          as the SCADA simulator — 0.4GB, no cloud, no GPU.
        </div>
        <div style={{ padding: 10, borderRadius: 6, background: 'var(--surface-1)', fontSize: 10, fontFamily: 'monospace', marginBottom: 12, color: 'var(--text-secondary)' }}>
          VIB-X: 6.8mm/s (baseline 4.2) | VIB-Y: 5.9mm/s (baseline 3.8) | TEMP: 192F (baseline 185F) | Trend: +22% over 40min
        </div>
        <button className="btn btn-primary" onClick={runDemo} disabled={running} style={{ fontSize: 12, borderColor: 'var(--intel-cyan)' }}>
          {running ? 'Analyzing sensor data...' : 'Run Anomaly Detection'}
        </button>
        {demoResult && !demoResult.error && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 12, padding: 12, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--intel-cyan)' }}>
            <div style={{ fontSize: 10, color: 'var(--intel-cyan)', marginBottom: 6 }}>
              BitNet Response — {demoResult.latency_ms}ms | {demoResult.tokens} tokens
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>{demoResult.content}</div>
          </motion.div>
        )}
        {demoResult?.error && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: 'rgba(255,100,100,0.1)', fontSize: 11, color: 'var(--rh-red)' }}>
            {demoResult.error}
          </div>
        )}
      </StepCard>

      <StepCard num={4} title="Compare: BitNet vs Standard Models">
        <button className="btn btn-secondary" onClick={runCompare} disabled={comparing} style={{ fontSize: 12 }}>
          {comparing ? 'Running comparison...' : 'Compare BitNet vs Granite-2B vs Granite-8B'}
        </button>
        {compareResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: 6 }}>Model</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Latency</th>
                  <th style={{ textAlign: 'right', padding: 6 }}>Tokens</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Response</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(compareResult).map(([model, r]: [string, any]) => (
                  <tr key={model} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 6, fontWeight: 600, color: model === 'bitnet-2b4t' ? 'var(--intel-cyan)' : 'var(--text-dim)' }}>{model}</td>
                    <td className="mono" style={{ textAlign: 'right', padding: 6 }}>{r.ms}ms</td>
                    <td className="mono" style={{ textAlign: 'right', padding: 6 }}>{r.tokens}</td>
                    <td style={{ padding: 6, fontSize: 10, color: 'var(--text-secondary)' }}>{r.content}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </StepCard>

      <StepCard num={5} title="Edge at Scale">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Model Size', value: '0.4 GB', detail: '10x smaller than INT4 2B' },
            { label: 'Per Token', value: '$0', detail: 'On hardware you already own' },
            { label: 'Energy', value: 'Estimate', detail: 'Tracked in claim registry' },
            { label: 'Deployment', value: '0 GPUs', detail: 'CPU integer ops only' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: 10, borderRadius: 8, background: 'var(--surface-2)' }}>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--intel-cyan)' }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{s.detail}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>
          100 compressor stations x $0/station = $0 total AI infrastructure cost.
          The intelligence runs on hardware you've already depreciated.
        </div>
      </StepCard>
    </ModuleLayout>
  )
}
