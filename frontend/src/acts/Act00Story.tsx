import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TriforceIntro } from '../components/TriforceIntro'

interface Props { onComplete?: () => void }

export function Act00Story({ onComplete }: Props) {
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
            <h3><span className="section-num">00</span> Why are we here</h3>

            <div className="section-context">
              Every enterprise wants AI. They've seen the demos. They've run the pilots.
              But when the CFO asks "what does it cost at scale?" — the room goes quiet.
              Accelerator servers cost $120K. Cloud APIs charge per token. And the models keep growing.
              The question isn't "GPU or no GPU" — it's "which tasks need which hardware?"
            </div>

            <div style={{ maxWidth: 700, margin: '24px 0' }}>
              <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>
                Triforce answers three questions:
              </p>

              {[
                { num: '1', q: 'Can I afford AI at scale?', a: 'Start on CPU at $0/token. Scale to GPU only where quality demands it. The system routes for you.' },
                { num: '2', q: 'Can I run it on hardware I own?', a: 'CPU handles 80% of enterprise AI today. GPU handles the 20% that needs reasoning power. Both on the same OpenShift.' },
                { num: '3', q: 'Can I trust it with my data?', a: 'Hardware-encrypted inference with TDX. Complete audit trails. Every model call logged.' },
              ].map((item, i) => (
                <motion.div
                  key={item.num}
                  className="step-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.2 }}
                >
                  <span className="step-num">{item.num}</span>
                  <strong>{item.q}</strong>
                  <div className="step-question">{item.a}</div>
                </motion.div>
              ))}
            </div>

            <div className="pillar-grid">
              {[
                { name: 'Intel', role: 'Power', answer: 'Xeon 6 CPU ($0/token) + GPU pool — heterogeneous compute', accent: 'card-accent-intel', logo: '/logos/intel.png', logoH: 24, delay: 0.8 },
                { name: 'Red Hat', role: 'Courage', answer: 'OpenShift + vLLM Semantic Router + intelligent routing', accent: 'card-accent-redhat', logo: '/logos/redhat.svg', logoH: 18, delay: 0.95 },
                { name: 'IBM', role: 'Wisdom', answer: 'Kagenti governance + agent orchestration + audit', accent: 'card-accent-ibm', logo: '/logos/ibm.png', logoH: 20, delay: 1.1 },
              ].map(p => (
                <motion.div
                  key={p.name}
                  className={`pillar-card ${p.accent}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25, delay: p.delay }}
                >
                  <img src={p.logo} alt={p.name} style={{ height: p.logoH, marginBottom: 8 }} />
                  <div className="pillar-name">{p.name}</div>
                  <div className="pillar-role">{p.role}</div>
                  <div className="pillar-answer">{p.answer}</div>
                </motion.div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button className="btn btn-primary" onClick={onComplete}>
                See the architecture →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
