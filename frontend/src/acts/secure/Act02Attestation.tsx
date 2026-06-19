import { useState, useCallback, useRef } from 'react'
import { motion } from 'motion/react'
import { PipelineAnimation, type PipelineNode } from '../../components/PipelineAnimation'

interface Props { onComplete?: () => void }

const ATTEST_NODES: PipelineNode[] = [
  { id: 'boot', label: 'Pod Starts', model: 'Kata VM + TDX', status: 'pending' },
  { id: 'cdh', label: 'CDH Agent', model: 'Contact KBS', status: 'pending' },
  { id: 'quote', label: 'vTPM Quote', model: 'Hardware attestation', status: 'pending' },
  { id: 'verify', label: 'Trustee Verifies', model: 'Check TD state', status: 'pending', conditional: true },
  { id: 'secrets', label: 'Secrets Released', model: 'API key granted', status: 'pending' },
]

const STEP_DELAYS = [0, 800, 1600, 2400, 3200]

export function Act02Attestation({ onComplete }: Props) {
  const [nodes, setNodes] = useState<PipelineNode[]>(ATTEST_NODES)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [denied, setDenied] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const activateNode = useCallback((idx: number) => {
    setNodes(prev => prev.map((n, i) => {
      if (i < idx) return { ...n, status: 'done' as const, latencyMs: [50, 120, 200, 350, 10][i] }
      if (i === idx) return { ...n, status: 'active' as const }
      return n
    }))
  }, [])

  const runAttestation = (succeed: boolean) => {
    setRunning(true)
    setDone(false)
    setDenied(false)
    setNodes(ATTEST_NODES)
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    const steps = succeed ? 5 : 4
    STEP_DELAYS.slice(0, steps).forEach((delay, idx) => {
      const timer = setTimeout(() => activateNode(idx), delay)
      timersRef.current.push(timer)
    })

    const finishDelay = succeed ? 4000 : 3200
    const finish = setTimeout(() => {
      if (succeed) {
        setNodes(prev => prev.map((n, i) => ({
          ...n,
          status: 'done' as const,
          latencyMs: [50, 120, 200, 350, 10][i],
        })))
      } else {
        setNodes(prev => prev.map((n, i) => {
          if (i < 3) return { ...n, status: 'done' as const, latencyMs: [50, 120, 200][i] }
          if (i === 3) return { ...n, status: 'skipped' as const, detail: 'DENIED — no TDX' }
          return { ...n, status: 'skipped' as const, detail: 'blocked' }
        }))
        setDenied(true)
      }
      setRunning(false)
      setDone(true)
    }, finishDelay)
    timersRef.current.push(finish)
  }

  return (
    <div className="demo-section">
      <h3><span className="section-num">02</span> Attestation Flow</h3>
      <div className="section-context">
        Before the AI agent gets its API key, the hardware must prove it's running
        inside a genuine TDX Trust Domain. Watch the attestation handshake — then
        see what happens without TDX.
      </div>

      <div className="step-card" style={{ borderLeft: '3px solid var(--intel-cyan)' }}>
        <span className="step-num" style={{ background: 'var(--intel-cyan)' }}>1</span>
        <strong>Hardware Attestation</strong>
        <div className="step-question">Pod → Kata VM → TDX → Trustee KBS → Secrets</div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => runAttestation(true)} disabled={running}>
            {running ? 'Attesting...' : 'Run with TDX'}
          </button>
          <button className="btn btn-secondary" onClick={() => runAttestation(false)} disabled={running}
            style={{ borderColor: 'var(--rh-red)' }}>
            Run without TDX
          </button>
        </div>

        <PipelineAnimation nodes={nodes} />

        {done && !denied && (
          <motion.div className="card card-accent-intel" style={{ textAlign: 'center', marginTop: 12 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--rh-green)' }}>
              Attestation passed — API key released to Trust Domain
            </span>
          </motion.div>
        )}

        {done && denied && (
          <motion.div className="card" style={{ textAlign: 'center', marginTop: 12, borderLeft: '3px solid var(--rh-red)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--rh-red)' }}>
              Attestation denied — no TDX, no secrets, agent cannot start
            </span>
          </motion.div>
        )}
      </div>

      {done && (
        <motion.div style={{ textAlign: 'center', marginTop: 24 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <button className="btn btn-primary" onClick={onComplete}>
            One line changes everything →
          </button>
        </motion.div>
      )}
    </div>
  )
}
