import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TriforceIntro } from '../../components/TriforceIntro'

interface Props { onComplete?: () => void }

export function Act00SecureStory({ onComplete }: Props) {
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
            <h3><span className="section-num">00</span> Can I trust it with my data?</h3>

            <div className="section-context">
              AI processes your most sensitive data — patient records, financial transactions,
              clinical notes. During inference, that data sits in memory. Unencrypted. Visible
              to any cluster administrator. One breach costs $1.5M in HIPAA fines alone.
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12, margin: '24px 0',
            }}>
              {[
                { value: '$1.5M', label: 'Average HIPAA fine', color: 'var(--rh-red)' },
                { value: '725+', label: 'Healthcare breaches/year', color: 'var(--rh-orange)' },
                { value: '100%', label: 'PHI visible in memory during inference', color: 'var(--rh-red)' },
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
              className="card card-accent-intel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--intel-cyan)' }}>What if inference memory was hardware-encrypted?</strong><br />
                <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>
                  Intel TDX creates a Trust Domain — a hardware-enforced boundary around your
                  AI workload. The CPU encrypts memory in silicon. No software, no admin, no
                  hypervisor can read the data inside.
                </span>
              </p>
            </motion.div>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button className="btn btn-primary" onClick={onComplete}>
                How TDX protects your AI →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
