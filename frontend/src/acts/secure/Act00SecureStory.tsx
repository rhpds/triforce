import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

export function Act00SecureStory({ onComplete }: Props) {
  const [beat, setBeat] = useState(0)

  return (
    <div className="demo-section" onClick={() => beat < 4 && setBeat(b => b + 1)}>
      <h3><span className="section-num">00</span> The Trust Question</h3>

      {/* Beat 1 — The exposure */}
      <AnimatePresence>
        {beat >= 0 && (
          <motion.div
            key="beat-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: 24 }}
          >
            <p style={{ fontSize: 18, color: 'var(--text-primary)', lineHeight: 1.7 }}>
              Every AI inference processes your most sensitive data.
            </p>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Patient records. Transaction histories. Subscriber identities.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beat 2 — The cost of failure */}
      <AnimatePresence>
        {beat >= 1 && (
          <motion.div
            key="beat-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: 24 }}
          >
            <div style={{
              fontSize: 48, fontFamily: 'var(--font-mono, monospace)', fontWeight: 700,
              color: 'var(--rh-red)', marginBottom: 8,
            }}>
              $1.5M
            </div>
            <p style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--text-dim)', margin: '0 0 16px' }}>
              average HIPAA violation fine — HHS Office for Civil Rights
            </p>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              But 80% of AI pilots never even considered encryption during processing.
            </p>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Protected at rest. Protected in transit.
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--rh-red)' }}>
              Naked in memory during inference.
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
              <p>NIST 800-171 requires CUI protection during processing.</p>
              <p>FedRAMP requires data sovereignty.</p>
              <p>PHMSA requires sensor data integrity.</p>
              <p>Every framework assumes encryption in use.</p>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                Almost no AI deployment provides it.
              </p>
            </div>
            <p style={{ fontSize: 9, fontStyle: 'italic', color: 'var(--text-dim)', marginTop: 8 }}>
              Sources: NIST SP 800-171 Rev 3 (2024), FedRAMP Authorization Boundary Guidance, PHMSA 49 CFR 192
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
              What if one line of YAML encrypted every byte of data during inference
              — in silicon, at the hardware level, where even root access can't read it?
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
              Intel TDX does exactly that.
            </p>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 24 }}>
              And it's running on this machine.
            </p>
            <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); onComplete?.() }}>
              See the proof →
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
