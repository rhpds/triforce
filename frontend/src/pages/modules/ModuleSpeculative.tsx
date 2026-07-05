import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { ModuleLayout, StepCard } from '../../components/ModuleLayout'

interface SpeculativeStatus {
  enabled: boolean
  baseline_model: string
  target_model: string
  draft_model: string
  speculative_model: string
  api_base_configured: boolean
  num_speculative_tokens: number
  claim_threshold: number
}

interface SpeculativeRun {
  status: string
  message: string
  speedup: number | null
  claim_threshold: number
  baseline: {
    model: string
    latency_ms: number
    output: string
    output_tokens: number
  }
  speculative: {
    model: string
    latency_ms: number
    output: string
    output_tokens: number
  }
}

const SAMPLE_TEXT = '72-year-old male admitted with acute chest pain. History of Type 2 Diabetes, hypertension, CKD stage 3. ECG showed ST elevation. Troponin I elevated at 8.2. Emergent catheterization revealed 95% occlusion of RCA. Summarize key findings for physician handoff.'

export default function ModuleSpeculative() {
  const [status, setStatus] = useState<SpeculativeStatus | null>(null)
  const [result, setResult] = useState<SpeculativeRun | null>(null)
  const [text, setText] = useState(SAMPLE_TEXT)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    fetch('/healthcare/api/v1/speculative/status')
      .then(resp => resp.json())
      .then(setStatus)
      .catch(() => setStatus(null))
  }, [])

  const runMeasurement = async () => {
    setRunning(true)
    setResult(null)
    try {
      const resp = await fetch('/healthcare/api/v1/speculative/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'summarization', text, max_tokens: 128 }),
      })
      setResult(await resp.json())
    } catch {
      setResult({
        status: 'error',
        message: 'Speculative endpoint not reachable',
        speedup: null,
        claim_threshold: status?.claim_threshold || 1.5,
        baseline: { model: status?.baseline_model || 'granite-2b-cpu', latency_ms: 0, output: '', output_tokens: 0 },
        speculative: { model: status?.speculative_model || 'granite-2b-cpu-speculative', latency_ms: 0, output: '', output_tokens: 0 },
      })
    }
    setRunning(false)
  }

  const speedupLabel = result?.speedup ? `${result.speedup.toFixed(2)}x` : 'Measured after run'
  const claimThreshold = result?.claim_threshold || status?.claim_threshold || 1.5
  const claimLabel = result?.speedup && result.speedup >= claimThreshold
    ? 'Measured faster on this prompt'
    : 'Configured and measured'

  return (
    <ModuleLayout
      title="Speculative Decoding"
      description="A small draft model proposes tokens ahead while the target model verifies them in batches. The demo reports the measured result for the active Oberon deployment."
      status="live"
    >
      <StepCard num={1} title="Serving Path">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { label: 'Draft', value: status?.draft_model || 'granite-350m', detail: `Proposes ${status?.num_speculative_tokens || 5} tokens` },
            { label: 'Target', value: status?.target_model || 'granite-2b-cpu', detail: 'Baseline model' },
            { label: 'Speculative Alias', value: status?.speculative_model || 'granite-2b-cpu-speculative', detail: 'vLLM draft_model worker' },
          ].map(item => (
            <div key={item.label} className="card" style={{ padding: 12, borderLeft: '3px solid var(--intel-blue)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--intel-blue)', marginBottom: 6 }}>{item.label}</div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>{item.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>{item.detail}</div>
            </div>
          ))}
        </div>
      </StepCard>

      <StepCard num={2} title="Run Measurement">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ width: '100%', minHeight: 90, padding: 10, fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', resize: 'vertical', marginBottom: 12 }}
        />
        <button className="btn btn-primary" onClick={runMeasurement} disabled={running || !text.trim()} style={{ fontSize: 12 }}>
          {running ? 'Measuring...' : 'Measure Baseline vs Speculative'}
        </button>
      </StepCard>

      {result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <StepCard num={3} title="Measured Result">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
              <Metric label="Baseline" value={`${result.baseline.latency_ms}ms`} detail={result.baseline.model} />
              <Metric label="Speculative" value={`${result.speculative.latency_ms}ms`} detail={result.speculative.model} />
              <Metric label="Speedup" value={speedupLabel} detail={claimLabel} />
            </div>
            <div style={{ padding: 12, borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.6 }}>
              {result.message}
            </div>
          </StepCard>

          <StepCard num={4} title="Outputs">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <OutputCard title="Baseline Output" tokens={result.baseline.output_tokens} text={result.baseline.output} />
              <OutputCard title="Speculative Output" tokens={result.speculative.output_tokens} text={result.speculative.output} />
            </div>
          </StepCard>
        </motion.div>
      )}
    </ModuleLayout>
  )
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="card" style={{ padding: 12, textAlign: 'center' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{label}</div>
      <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--rh-green)', marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{detail}</div>
    </div>
  )
}

function OutputCard({ title, tokens, text }: { title: string; tokens: number; text: string }) {
  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--intel-blue)', marginBottom: 6 }}>{title}</div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>{tokens} output tokens</div>
      <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6, maxHeight: 180, overflow: 'auto' }}>{text || 'No output returned'}</div>
    </div>
  )
}
