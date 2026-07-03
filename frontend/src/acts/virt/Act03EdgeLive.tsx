import { useState } from 'react'
import { motion } from 'motion/react'
import { getConfig } from '../../config'

interface Props { onComplete?: () => void }

const SENSORS = [
  { id: 'VIB-X', label: 'Vibration X', value: 6.8, baseline: 4.2, unit: 'mm/s', pct: 62 },
  { id: 'VIB-Y', label: 'Vibration Y', value: 5.9, baseline: 3.8, unit: 'mm/s', pct: 55 },
  { id: 'TEMP', label: 'Bearing Temp', value: 192, baseline: 185, unit: '°F', pct: 4 },
  { id: 'PRESS', label: 'Pressure Out', value: 1200, baseline: 1200, unit: 'psi', pct: 0 },
  { id: 'FLOW', label: 'Flow Rate', value: 45.2, baseline: 45.2, unit: 'MMSCFD', pct: 0 },
]

export function Act03EdgeLive({ onComplete }: Props) {
  const [result, setResult] = useState<any>(null)
  const [running, setRunning] = useState(false)

  const runDetection = async () => {
    setRunning(true)
    const prompt = SENSORS.map(s =>
      `${s.label}: ${s.value} ${s.unit} (baseline ${s.baseline}${s.pct > 5 ? `, +${s.pct}%` : ''})`
    ).join('. ') + '. Trend: vibration increasing over 40 minutes. Is this an anomaly? What is the likely cause and recommended action?'

    try {
      const start = Date.now()
      const resp = await fetch('/litellm/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getConfig().litellmKey}` },
        body: JSON.stringify({
          model: 'bitnet-2b4t',
          messages: [
            { role: 'system', content: 'You are a field maintenance AI at a pipeline compressor station. Analyze sensor readings and provide concise, actionable alerts.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 96, temperature: 0.1,
        }),
      })
      const data = await resp.json()
      setResult({
        content: data.choices?.[0]?.message?.content || 'No response',
        ms: Date.now() - start,
        tokens: data.usage?.completion_tokens || 0,
      })
    } catch {
      setResult({ content: 'BitNet model not reachable — ensure edge module is enabled', ms: 0, tokens: 0, error: true })
    }
    setRunning(false)
  }

  return (
    <div className="demo-section">
      <h3><span className="section-num">03</span> Live: Sensor → BitNet Alert</h3>
      <div className="section-context">
        Compressor Station B — Permian Basin Lateral 42. Sensor readings streaming from the SCADA VM.
        BitNet analyzes them on the same hardware. No cloud. No GPU. No external calls.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, margin: '16px 0' }}>
        {SENSORS.map(s => {
          const alarm = s.pct > 20
          const warn = s.pct > 5
          return (
            <div key={s.id} style={{
              padding: 10, borderRadius: 8, textAlign: 'center',
              background: 'var(--surface-2)',
              border: `1px solid ${alarm ? 'var(--rh-red)' : warn ? 'orange' : 'var(--border)'}`,
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{s.label}</div>
              <div className="mono" style={{
                fontSize: 16, fontWeight: 700, marginTop: 4,
                color: alarm ? 'var(--rh-red)' : warn ? 'orange' : 'var(--rh-green)',
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{s.unit}</div>
              {s.pct > 5 && (
                <div className="mono" style={{ fontSize: 10, color: alarm ? 'var(--rh-red)' : 'orange', marginTop: 2 }}>
                  +{s.pct}%
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button className="btn btn-primary" onClick={runDetection} disabled={running}
          style={{ borderColor: 'var(--intel-cyan)' }}>
          {running ? 'Analyzing sensor data...' : 'Run Anomaly Detection (BitNet 1.58-bit)'}
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 16, padding: 14, borderRadius: 10,
            background: result.error ? 'rgba(255,80,80,0.08)' : 'var(--surface-2)',
            border: `1px solid ${result.error ? 'var(--rh-red)' : 'var(--intel-cyan)'}`,
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--intel-cyan)' }}>
              BitNet b1.58 Alert
            </span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>
              {result.ms}ms · {result.tokens} tokens · 0.4GB model · $0
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {result.content}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 8, fontStyle: 'italic' }}>
            This ran on the same Xeon CPU as the SCADA system. No cloud call. No GPU. No new hardware.
          </div>
        </motion.div>
      )}

      {result && !result.error && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button className="btn btn-secondary" onClick={onComplete} style={{ fontSize: 12 }}>
            Now see the same model at data center scale →
          </button>
        </div>
      )}
    </div>
  )
}
