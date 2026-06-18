import { motion } from 'motion/react'

interface Props { onComplete?: () => void }

export function Act01Architecture({ onComplete }: Props) {
  return (
    <div className="demo-section">
      <h3><span className="section-num">01</span> Architecture</h3>
      <div className="section-context">
        Three agents. Three languages. One platform. The Semantic Router classifies
        each request and routes to the right model — simple tasks to the 2B model,
        complex reasoning to the 3.8B model. All on Intel Xeon 6 CPU.
      </div>

      <div className="arch-diagram">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <motion.div
            className="card card-accent-redhat"
            style={{ width: 320 }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="pipe-node-label" style={{ color: 'var(--rh-red)' }}>Semantic Router</div>
            <div className="pipe-node-detail">Red Hat · Classifies request complexity</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center' }}>
              <span className="mono" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--rh-green-dim)', color: 'var(--rh-green)' }}>SIMPLE</span>
              <span className="mono" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--rh-blue-dim)', color: 'var(--rh-blue)' }}>MEDIUM</span>
              <span className="mono" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--rh-purple-dim)', color: 'var(--rh-purple)' }}>COMPLEX</span>
            </div>
          </motion.div>

          <motion.div
            style={{ width: 2, height: 24, background: 'var(--rh-red)' }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          />

          <motion.div
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            {[
              { name: 'Healthcare', sub: 'Python · LangGraph', detail: 'Classify · NER · Summarize', accent: 'card-accent-ibm' },
              { name: 'FinServ', sub: 'Java · Quarkus', detail: 'Fraud · Compliance · Risk', accent: 'card-accent-ibm' },
              { name: 'Orchestrator', sub: 'Go · A2A', detail: 'Discover · Dispatch · Coordinate', accent: '' },
            ].map((agent, i) => (
              <motion.div
                key={agent.name}
                className={`card ${agent.accent}`}
                style={{ width: 180 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.7 + i * 0.1 }}
              >
                <div className="pipe-node-label">{agent.name}</div>
                <div className="pipe-node-detail">{agent.sub}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{agent.detail}</div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            style={{ width: 2, height: 24, background: 'var(--intel-cyan)' }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.3, delay: 1.0 }}
          />

          <motion.div
            className="card card-accent-intel"
            style={{ width: 420 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.1 }}
          >
            <div className="pipe-node-label" style={{ color: 'var(--intel-cyan)' }}>Intel Xeon 6 · MAAS/LiteLLM</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
              {['granite-2b-cpu', 'qwen25-3b-cpu', 'phi3-mini-cpu'].map((m, i) => (
                <motion.span
                  key={m}
                  className="mono"
                  style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--intel-cyan-dim)', color: 'var(--intel-cyan)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3 + i * 0.1 }}
                >
                  {m}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button className="btn btn-primary" onClick={onComplete}>
          See it run live →
        </button>
      </div>
    </div>
  )
}
