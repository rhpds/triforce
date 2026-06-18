import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Act00Story } from './acts/Act00Story'
import { Act01Architecture } from './acts/Act01Architecture'
import { Act02Inference } from './acts/Act02Inference'
import { Act03Cost } from './acts/Act03Cost'
import { Act04Platform } from './acts/Act04Platform'
import { Act05HonestQuestion } from './acts/Act05HonestQuestion'

export default function App() {
  const [revealed, setRevealed] = useState(1) // start with act 00 visible

  const revealNext = () => setRevealed(prev => prev + 1)

  return (
    <div>
      {/* Header */}
      <div className="demo-header">
        <div className="demo-header-title">
          <span style={{ color: 'var(--intel-cyan)', marginRight: 8 }}>▲</span>
          TRIFORCE
          <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: 13, marginLeft: 12 }}>
            Power · Wisdom · Courage
          </span>
        </div>
        <div className="demo-header-health">
          <div className="health-dot alive" />
          <span>Intel Xeon 6 · granite-2b-cpu</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }} className="content-with-metrics">

        {/* Act 00 — Always visible */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Act00Story onComplete={revealNext} />
        </motion.div>

        {/* Act 01 — After story */}
        <AnimatePresence>
          {revealed >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Act01Architecture onComplete={revealNext} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Act 02 — After architecture */}
        <AnimatePresence>
          {revealed >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Act02Inference onComplete={revealNext} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Act 03 — After inference proof */}
        <AnimatePresence>
          {revealed >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Act03Cost onComplete={revealNext} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Act 04 — After cost proof */}
        <AnimatePresence>
          {revealed >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Act04Platform onComplete={revealNext} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Act 05 — After platform proof */}
        <AnimatePresence>
          {revealed >= 6 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Act05HonestQuestion />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer / Elixir — After honest question */}
        <AnimatePresence>
          {revealed >= 6 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="demo-section" style={{ textAlign: 'center', padding: '64px 0' }}>
                <div style={{ fontSize: 18, color: 'var(--text-dim)', marginBottom: 16 }}>
                  80% of enterprise AI doesn't need a GPU.
                </div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  That 80% runs today on the CPUs you already own.
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 24 }}>
                  <span style={{ color: 'var(--intel-cyan)' }}>Power</span> ·{' '}
                  <span style={{ color: 'var(--ibm-blue)' }}>Wisdom</span> ·{' '}
                  <span style={{ color: 'var(--rh-red)' }}>Courage</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-disabled)', marginTop: 8 }}>
                  github.com/rhpds/triforce
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
