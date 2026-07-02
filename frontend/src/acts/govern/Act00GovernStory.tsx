import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

export function Act00GovernStory({ onComplete }: Props) {
  const [beat, setBeat] = useState(0)

  return (
    <div className="demo-section" onClick={() => beat < 4 && setBeat(b => b + 1)}>
      <h3><span className="section-num">00</span> The Governance Question</h3>

      {/* Beat 1 — The failure rate */}
      <AnimatePresence>
        {beat >= 0 && (
          <motion.div
            key="beat-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: 24 }}
          >
            <div style={{
              fontSize: 48, fontFamily: 'var(--font-mono, monospace)', fontWeight: 700,
              color: 'var(--rh-red)', marginBottom: 8,
            }}>
              89%
            </div>
            <p style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--text-dim)', margin: '0 0 16px' }}>
              of AI agent pilots never reach production — Gartner, 2026
            </p>
            <p style={{ fontSize: 18, color: 'var(--text-primary)', lineHeight: 1.7 }}>
              Not because the agents don't work.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beat 2 — The trust barrier */}
      <AnimatePresence>
        {beat >= 1 && (
          <motion.div
            key="beat-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: 24 }}
          >
            <p style={{ fontSize: 18, color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: 16 }}>
              Because nobody can answer:
            </p>
            <div style={{ marginLeft: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 2 }}>
                Who authorized this agent to access that data?
              </p>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 2 }}>
                Who audits what it decided?
              </p>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 2 }}>
                What policy governs its tool access?
              </p>
            </div>
            <div style={{
              fontSize: 40, fontFamily: 'var(--font-mono, monospace)', fontWeight: 700,
              color: 'var(--rh-orange)', marginBottom: 8, marginTop: 16,
            }}>
              42%
            </div>
            <p style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--text-dim)', margin: 0 }}>
              of companies abandoned AI projects — trust was the #1 barrier — S&P Global
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beat 3 — The regulatory wall */}
      <AnimatePresence>
        {beat >= 2 && (
          <motion.div
            key="beat-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: 24 }}
          >
            <div style={{ lineHeight: 1.9, fontSize: 16, color: 'var(--text-secondary)' }}>
              <p>The EU AI Act requires traceability for every AI decision.</p>
              <p>SOX requires audit trails for financial AI.</p>
              <p>HIPAA requires access controls on PHI — even when an AI agent is the one accessing it.</p>
            </div>
            <p style={{ fontSize: 9, fontStyle: 'italic', color: 'var(--text-dim)', marginTop: 8 }}>
              Sources: EU AI Act Art. 12-14, Sarbanes-Oxley Act Sec. 302/404, HIPAA Security Rule 45 CFR 164.312
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beat 4 — The reframe */}
      <AnimatePresence>
        {beat >= 3 && (
          <motion.div
            key="beat-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: 24 }}
          >
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--intel-cyan)', lineHeight: 1.7 }}>
              What if every agent had a cryptographic identity?
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--intel-cyan)', lineHeight: 1.7 }}>
              Every tool call was policy-gated?
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--intel-cyan)', lineHeight: 1.7 }}>
              Every decision was logged with hardware-level proof?
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beat 5 — The answer */}
      <AnimatePresence>
        {beat >= 4 && (
          <motion.div
            key="beat-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginTop: 32 }}
          >
            <p style={{ fontSize: 18, color: 'var(--text-primary)', lineHeight: 1.7 }}>
              That's agent governance.
            </p>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 24 }}>
              And it starts with three Kubernetes CRDs.
            </p>
            <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); onComplete?.() }}
              style={{ background: 'var(--ibm-blue)' }}>
              See the architecture →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {beat < 4 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1, duration: 0.5 }}
          style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-disabled)', marginTop: 32, cursor: 'pointer' }}
        >
          click to continue
        </motion.div>
      )}
    </div>
  )
}
