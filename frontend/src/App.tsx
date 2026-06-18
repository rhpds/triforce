import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Act00Story } from './acts/Act00Story'
import { Act01Architecture } from './acts/Act01Architecture'
import { Act02Inference } from './acts/Act02Inference'
import { Act03Cost } from './acts/Act03Cost'
import { Act04Scale } from './acts/Act04Scale'
import { Act04Efficiency } from './acts/Act04Efficiency'
import { Act05HonestQuestion } from './acts/Act05HonestQuestion'

export default function App() {
  const [revealed, setRevealed] = useState(1)

  const revealNext = () => {
    setRevealed(prev => prev + 1)
    setTimeout(() => {
      const next = document.getElementById(`act-${revealed + 1}`)
      if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  }

  return (
    <div>
      {/* Header */}
      <div className="demo-header">
        <div className="demo-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/logos/redhat.svg" alt="Red Hat" style={{ height: 20 }} />
            <span style={{ color: 'var(--text-disabled)', fontSize: 13 }}>×</span>
            <img src="/logos/intel.png" alt="Intel" style={{ height: 20 }} />
            <span style={{ color: 'var(--text-disabled)', fontSize: 13 }}>×</span>
            <img src="/logos/ibm.png" alt="IBM" style={{ height: 18 }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: "'Red Hat Display', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: 1 }}>
            <span style={{ color: 'var(--rh-red)' }}>▲</span> TRIFORCE
          </div>
          <div className="demo-header-health">
            <div className="health-dot alive" />
            <span style={{ fontSize: 12 }}>
              <span style={{ color: 'var(--rh-red)' }}>Courage</span> ·{' '}
              <span style={{ color: 'var(--intel-cyan)' }}>Power</span> ·{' '}
              <span style={{ color: 'var(--ibm-blue)' }}>Wisdom</span>
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }} className="content-with-metrics">

        {/* Act 00 — The Story */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Act00Story onComplete={revealNext} />
        </motion.div>

        {/* Act 01 — Architecture */}
        <AnimatePresence>
          {revealed >= 2 && (
            <motion.div
              id="act-2"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Act01Architecture onComplete={revealNext} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Act 02 — Prove it works */}
        <AnimatePresence>
          {revealed >= 3 && (
            <motion.div
              id="act-3"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Act02Inference onComplete={revealNext} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Act 03 — What the savings are */}
        <AnimatePresence>
          {revealed >= 4 && (
            <motion.div
              id="act-4"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Act03Cost onComplete={revealNext} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Act 04 — Scale & Tradeoffs (live) */}
        <AnimatePresence>
          {revealed >= 5 && (
            <motion.div
              id="act-5"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Act04Scale onComplete={revealNext} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Act 05 — Efficiency Stack */}
        <AnimatePresence>
          {revealed >= 6 && (
            <motion.div
              id="act-6"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Act04Efficiency onComplete={revealNext} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Act 06 — The Punchline */}
        <AnimatePresence>
          {revealed >= 7 && (
            <motion.div
              id="act-7"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Act05HonestQuestion />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer — What's Next */}
        <AnimatePresence>
          {revealed >= 7 && (
            <motion.div
              id="act-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="demo-section" style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: 18, color: 'var(--text-dim)', marginBottom: 12 }}>
                  80% of enterprise AI doesn't need a GPU.
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>
                  That 80% runs today on the CPUs you already own.
                </div>

                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>
                  But the story doesn't end here.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, textAlign: 'left', marginBottom: 32 }}>
                  {[
                    {
                      title: 'Triforce Secure',
                      question: 'Can I trust it with my data?',
                      tech: 'Intel TDX · Confidential Containers · Hardware-encrypted memory',
                      color: 'var(--intel-cyan)',
                    },
                    {
                      title: 'Triforce Virt',
                      question: 'Can I run AI alongside my existing VMs?',
                      tech: 'OpenShift Virtualization · KubeVirt · VM + Container coexistence',
                      color: 'var(--rh-red)',
                    },
                    {
                      title: 'Triforce Govern',
                      question: 'Can I govern agents at enterprise scale?',
                      tech: 'Kagenti · SPIFFE identity · MCP Gateway · Agent audit trails',
                      color: 'var(--ibm-blue)',
                    },
                  ].map((story, i) => (
                    <motion.div
                      key={story.title}
                      className="card"
                      style={{
                        borderLeft: `3px solid ${story.color}`,
                        padding: '20px',
                        cursor: 'default',
                      }}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.15 }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700, color: story.color, marginBottom: 8 }}>
                        {story.title}
                      </div>
                      <div style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.5 }}>
                        {story.question}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 10 }}>
                        {story.tech}
                      </div>
                      <div style={{
                        fontSize: 10, padding: '2px 10px', borderRadius: 4, display: 'inline-block',
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                        color: 'var(--text-disabled)', fontWeight: 600,
                      }}>
                        COMING SOON
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 16 }}>
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
