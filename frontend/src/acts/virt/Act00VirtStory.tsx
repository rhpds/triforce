import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TriforceIntro } from '../../components/TriforceIntro'

interface Props { onComplete?: () => void }

export function Act00VirtStory({ onComplete }: Props) {
  const [introComplete, setIntroComplete] = useState(false)

  return (
    <div className="demo-section">
      {!introComplete && (
        <TriforceIntro onComplete={() => setIntroComplete(true)} />
      )}

      <AnimatePresence>
        {introComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3><span className="section-num">00</span> Can I run AI alongside my existing VMs?</h3>

            <div className="section-context">
              You have hundreds of VMs running legacy databases, middleware, and enterprise
              applications. You can't containerize them overnight. But AI can't wait for
              your migration to finish. What if both could run on the same hardware?
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12, margin: '24px 0',
            }}>
              {[
                { value: '500+', label: 'Average enterprise VMs in production', color: 'var(--rh-red)' },
                { value: '3-5 yrs', label: 'Typical containerization timeline', color: 'var(--rh-orange)' },
                { value: '0 days', label: 'Time AI can wait', color: 'var(--intel-cyan)' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="card"
                  style={{ textAlign: 'center', borderLeft: `3px solid ${stat.color}` }}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.15 }}
                >
                  <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{stat.label}</div>
                </motion.div>
              ))}
            </div>

            <motion.div
              className="card card-accent-redhat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--rh-red)' }}>What if AI didn't need a separate cluster?</strong><br />
                <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>
                  OpenShift Virtualization runs your VMs as first-class Kubernetes resources.
                  The same Intel Xeon 6 servers running your VMs today can run AI inference
                  tomorrow — on the same node, managed by the same platform.
                </span>
              </p>
            </motion.div>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button className="btn btn-primary" onClick={onComplete}>
                See the coexistence stack →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
