import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

const LAYERS = [
  {
    id: 'router',
    label: 'Intelligent Routing',
    customerQuestion: '"Not every task needs our most powerful model."',
    workload: 'A discharge summary classification is simple — 2B parameters handles it. A drug interaction analysis with treatment planning is complex — that needs 3.8B. Why send both to the same model and pay the same cost?',
    color: 'var(--rh-red)',
    render: () => (
      <motion.div
        className="card card-accent-redhat"
        style={{ width: 340 }}
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="pipe-node-label" style={{ color: 'var(--rh-red)' }}>Semantic Router</div>
        <div className="pipe-node-detail">Red Hat · Embedding classification · &lt;1ms overhead</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center' }}>
          <span className="mono" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--rh-green-dim)', color: 'var(--rh-green)' }}>SIMPLE → 2B</span>
          <span className="mono" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--rh-blue-dim)', color: 'var(--rh-blue)' }}>MEDIUM → 3B</span>
          <span className="mono" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--rh-purple-dim)', color: 'var(--rh-purple)' }}>COMPLEX → 3.8B</span>
        </div>
      </motion.div>
    ),
  },
  {
    id: 'agents',
    label: 'Polyglot Agents',
    customerQuestion: '"Our teams use different languages. AI shouldn\'t force everyone into Python."',
    workload: 'Your hospital runs Java billing systems. Your clinical research team uses Python. Your platform ops team writes Go. Each team builds AI agents in the language they already know — and they discover each other automatically via A2A protocol.',
    color: 'var(--ibm-blue)',
    render: () => (
      <motion.div
        style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {[
          { name: 'Healthcare', sub: 'Python · LangGraph', detail: 'Classify · NER · Summarize', accent: 'card-accent-ibm' },
          { name: 'FinServ', sub: 'Java · Quarkus', detail: 'Fraud · Compliance · Risk', accent: 'card-accent-ibm' },
          { name: 'Orchestrator', sub: 'Go · A2A', detail: 'Discover · Dispatch · Coordinate', accent: 'card-accent-redhat' },
        ].map((agent, i) => (
          <motion.div
            key={agent.name}
            className={`card ${agent.accent}`}
            style={{ width: 180 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.1 }}
          >
            <div className="pipe-node-label">{agent.name}</div>
            <div className="pipe-node-detail">{agent.sub}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{agent.detail}</div>
          </motion.div>
        ))}
      </motion.div>
    ),
  },
  {
    id: 'tools',
    label: 'Existing Data Systems',
    customerQuestion: '"Our data already exists. We don\'t want AI to hallucinate answers it could look up."',
    workload: 'Drug interaction data lives in FDA databases. Patient records are in FHIR. Clinical guidelines are in your protocol library. AI agents reach these systems through MCP tools — they look up facts instead of generating them.',
    color: 'var(--rh-teal)',
    render: () => (
      <motion.div
        style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {[
          { name: 'Drug Interactions', source: 'FDA / NIH RxNav' },
          { name: 'Clinical Guidelines', source: 'Protocol DB' },
          { name: 'FHIR Patient Data', source: 'EHR Gateway' },
          { name: 'ICD-10 Lookup', source: 'Code Search' },
        ].map((tool, i) => (
          <motion.div
            key={tool.name}
            style={{
              padding: '10px 16px', borderRadius: 8, background: 'var(--surface-2)',
              border: '1px solid var(--rh-teal)', textAlign: 'center', minWidth: 130,
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--rh-teal)' }}>{tool.name}</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{tool.source}</div>
          </motion.div>
        ))}
      </motion.div>
    ),
  },
  {
    id: 'streaming',
    label: 'AMQ Streams (Apache Kafka)',
    customerQuestion: '"We\'re not processing one record. We\'re processing the overnight batch before morning rounds."',
    workload: '10,000 discharge summaries from the night shift. 500,000 transactions for end-of-day compliance. One-at-a-time API calls don\'t work at this volume. AMQ Streams processes them in parallel — same hardware, same $0 cost.',
    color: 'var(--rh-orange)',
    render: () => (
      <motion.div
        style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {['healthcare.requests', 'healthcare.results', 'finserv.requests', 'finserv.results'].map((topic, i) => (
          <motion.div
            key={topic}
            style={{
              padding: '8px 14px', borderRadius: 8, background: 'var(--surface-2)',
              border: '1px solid var(--rh-orange)', textAlign: 'center',
            }}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="mono" style={{ fontSize: 11, color: 'var(--rh-orange)' }}>{topic}</div>
          </motion.div>
        ))}
      </motion.div>
    ),
  },
  {
    id: 'inference',
    label: 'CPUs You Already Own',
    customerQuestion: '"We have 50,000 servers deployed. What if we didn\'t need to buy a single GPU?"',
    workload: '80% of enterprise AI workloads — classification, entity extraction, fraud scoring, summarization — don\'t need GPU-class compute. They run today on the Intel Xeon 6 CPUs already in your data center. No procurement. No new hardware. $0 per token.',
    color: 'var(--intel-cyan)',
    render: () => (
      <motion.div
        className="card card-accent-intel"
        style={{ width: 420 }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="pipe-node-label" style={{ color: 'var(--intel-cyan)' }}>Intel Xeon 6 · MAAS/LiteLLM</div>
        <div className="pipe-node-detail">128 cores · No GPU · $0/token</div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
          {[
            { m: 'granite-2b-cpu', size: '2B' },
            { m: 'qwen25-3b-cpu', size: '3B' },
            { m: 'phi3-mini-cpu', size: '3.8B' },
          ].map((model, i) => (
            <motion.div
              key={model.m}
              style={{
                padding: '4px 12px', borderRadius: 6,
                background: 'var(--intel-cyan-dim)', textAlign: 'center',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <div className="mono" style={{ fontSize: 11, color: 'var(--intel-cyan)' }}>{model.m}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{model.size}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    ),
  },
]

export function Act01Architecture({ onComplete }: Props) {
  const [revealed, setRevealed] = useState(0)

  const advance = () => {
    if (revealed < LAYERS.length) {
      setRevealed(prev => prev + 1)
    }
  }

  const allRevealed = revealed >= LAYERS.length

  return (
    <div className="demo-section">
      <h3><span className="section-num">01</span> Architecture</h3>
      <div className="section-context">
        Every layer exists because of a real workload problem. Click through to see
        the customer challenge first — then the platform layer that solves it.
      </div>

      <div className="arch-diagram">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          {LAYERS.map((layer, i) => (
            <AnimatePresence key={layer.id}>
              {revealed >= i + 1 && (
                <motion.div
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {i > 0 && (
                    <motion.div
                      style={{ width: 2, height: 20, background: layer.color }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}

                  <motion.div
                    style={{
                      fontSize: 15, fontStyle: 'italic', color: 'var(--text-primary)',
                      textAlign: 'center', maxWidth: 520, padding: '8px 0 6px',
                      fontWeight: 500,
                    }}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {layer.customerQuestion}
                  </motion.div>

                  <div style={{ marginBottom: 4 }}>
                    {layer.render()}
                  </div>

                  <motion.div
                    style={{
                      fontSize: 13, color: 'var(--text-dim)', maxWidth: 520,
                      textAlign: 'center', padding: '4px 0 16px', lineHeight: 1.6,
                    }}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    {layer.workload}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        {!allRevealed ? (
          <button className="btn btn-secondary" onClick={advance}>
            {revealed === 0
              ? `Start: ${LAYERS[0].label} →`
              : `Next: ${LAYERS[revealed].label} →`}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div style={{ fontSize: 13, color: 'var(--rh-green)', fontWeight: 600, marginBottom: 16 }}>
              Every layer solves a real workload problem — on hardware you already own
            </div>
            <button className="btn btn-primary" onClick={onComplete}>
              See it run live →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
