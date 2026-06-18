import { motion } from 'motion/react'

interface Props { onComplete?: () => void }

export function Act00Story({ onComplete }: Props) {
  return (
    <div className="demo-section">
      <h3><span className="section-num">00</span> Why are we here</h3>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <img src="/triforce-logo.svg" alt="Triforce — Power · Wisdom · Courage" style={{ maxWidth: 560, width: '100%' }} />
      </div>

      <div className="section-context">
        Every enterprise wants AI. They've seen the demos. They've run the pilots.
        But when the CFO asks "what does it cost at scale?" — the room goes quiet.
        GPU servers cost $120K. Cloud APIs charge per token. AI is stuck in pilot
        because it can't afford to scale.
      </div>

      <div style={{ maxWidth: 700, margin: '24px 0' }}>
        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>
          Triforce answers three questions:
        </p>

        {[
          { num: '1', q: 'Can I afford AI at scale?', a: 'Not at GPU prices. But on the CPUs you already own — yes.' },
          { num: '2', q: 'Can I run it on hardware I own?', a: 'Not if AI needs a separate GPU cluster. But on the same OpenShift, the same Xeon servers — yes.' },
          { num: '3', q: 'Can I trust it with my data?', a: 'Not if data sits unencrypted. But with TDX hardware encryption and complete audit trails — yes.' },
        ].map((item, i) => (
          <motion.div
            key={item.num}
            className="step-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.2 }}
          >
            <span className="step-num">{item.num}</span>
            <strong>{item.q}</strong>
            <div className="step-question">{item.a}</div>
          </motion.div>
        ))}
      </div>

      <div className="pillar-grid">
        {[
          { icon: '⚡', name: 'Intel', role: 'Power', answer: 'Xeon 6 with AMX runs inference at $0/token', accent: 'card-accent-intel', delay: 1.0 },
          { icon: '🛡️', name: 'Red Hat', role: 'Courage', answer: 'OpenShift + Semantic Router + scale', accent: 'card-accent-redhat', delay: 1.15 },
          { icon: '🧠', name: 'IBM', role: 'Wisdom', answer: 'Kagenti governance + encryption + audit', accent: 'card-accent-ibm', delay: 1.3 },
        ].map(p => (
          <motion.div
            key={p.name}
            className={`pillar-card ${p.accent}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: p.delay }}
          >
            <div className="pillar-icon">{p.icon}</div>
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
    </div>
  )
}
