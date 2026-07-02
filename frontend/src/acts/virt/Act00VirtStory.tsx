import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

export function Act00VirtStory({ onComplete }: Props) {
  const [beat, setBeat] = useState(0)

  return (
    <div className="demo-section" onClick={() => beat < 4 && setBeat(b => b + 1)}>
      <h3><span className="section-num">00</span> The Modernization Question</h3>

      {/* Beat 1 — The price shock */}
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
              300-1200%
            </div>
            <p style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--text-dim)', margin: '0 0 16px' }}>
              VMware price increases after Broadcom acquisition
            </p>
            <p style={{ fontSize: 18, color: 'var(--text-primary)', lineHeight: 1.7 }}>
              Every enterprise with VMs is looking for the exit.
            </p>
            <p style={{ fontSize: 9, fontStyle: 'italic', color: 'var(--text-dim)', marginTop: 8 }}>
              Source: Industry reports, 2025
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beat 2 — The migration trap */}
      <AnimatePresence>
        {beat >= 1 && (
          <motion.div
            key="beat-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: 24 }}
          >
            <p style={{ fontSize: 18, color: 'var(--text-primary)', lineHeight: 1.7 }}>
              But you can't containerize 500 VMs overnight.
            </p>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Your SCADA systems run in VMs. Your databases. Your middleware.
            </p>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              The migration will take years.
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--rh-orange)' }}>
              AI can't wait years.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beat 3 — The stranded asset */}
      <AnimatePresence>
        {beat >= 2 && (
          <motion.div
            key="beat-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: 24 }}
          >
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Meanwhile, Xeon PCs at every field site — compressor stations, cell towers,
              branch offices — running at 10% utilization.
            </p>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Air-gapped. Can't reach the cloud. Can't run a GPU.
            </p>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              That idle compute is a stranded asset.
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
              What if your VMs and AI agents ran on the same hardware?
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--intel-cyan)', lineHeight: 1.7 }}>
              What if a 0.4GB model turned your SCADA PC into an anomaly detector — for $0?
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
              OpenShift Virtualization + BitNet.
            </p>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Same Xeon. Same rack. No new hardware.
            </p>
            <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); onComplete?.() }}>
              See it running →
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
