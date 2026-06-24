import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

const LAYERS = [
  {
    id: 'router',
    label: 'Intelligent Routing',
    customerQuestion: '"Not every task needs the same hardware."',
    workload: 'A discharge summary classification is simple — a 2B model on CPU handles it in 800ms at $0. A differential diagnosis needs frontier reasoning — that routes to a 120B model on GPU. The semantic router classifies complexity in <1ms and sends each request to the right compute.',
    color: 'var(--rh-red)',
    render: () => (
      <motion.div
        className="card card-accent-redhat"
        style={{ width: 380 }}
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="pipe-node-label" style={{ color: 'var(--rh-red)' }}>vLLM Semantic Router</div>
        <div className="pipe-node-detail">Embedding classification · &lt;1ms · routes to right hardware</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--intel-cyan-dim)', color: 'var(--intel-cyan)' }}>SIMPLE → CPU</span>
          <span className="mono" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--intel-cyan-dim)', color: 'var(--intel-cyan)' }}>MEDIUM → CPU</span>
          <span className="mono" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--gpu-amber-dim)', color: 'var(--gpu-amber)' }}>COMPLEX → GPU</span>
        </div>
      </motion.div>
    ),
  },
  {
    id: 'agents',
    label: 'Polyglot Agents',
    customerQuestion: '"Our teams use different languages. AI shouldn\'t force everyone into Python."',
    workload: 'Healthcare uses Python/LangGraph. Finance uses Java/Quarkus. Platform ops uses Go. Each team builds agents in the language they know — and they discover each other via A2A protocol. The agents don\'t care what hardware runs the inference.',
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
    label: 'MCP Tool Federation',
    customerQuestion: '"Not every question needs an LLM. Our data already has the answer."',
    workload: 'Drug interactions: 16ms database lookup vs 3-8s LLM call. Patient records via FHIR. Clinical codes via ICD-10 search. 8 tools federated through an MCP gateway — agents look up facts instead of generating them.',
    color: 'var(--rh-teal)',
    render: () => (
      <motion.div
        style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {[
          { name: 'Drug Interactions', time: '16ms' },
          { name: 'FHIR Patient Data', time: '12ms' },
          { name: 'ICD-10 Lookup', time: '8ms' },
          { name: 'Risk Profiles', time: '10ms' },
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
            <div className="mono" style={{ fontSize: 10, color: 'var(--rh-green)', marginTop: 2 }}>{tool.time}</div>
          </motion.div>
        ))}
      </motion.div>
    ),
  },
  {
    id: 'streaming',
    label: 'AMQ Streams',
    customerQuestion: '"We\'re not processing one record. We\'re processing 10,000 before morning rounds."',
    workload: 'Overnight batch of discharge summaries. End-of-day compliance sweep. One-at-a-time API calls don\'t scale. AMQ Streams processes them in parallel across agent replicas — same hardware, throughput scales with consumers.',
    color: 'var(--rh-orange)',
    render: () => (
      <motion.div
        style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {['healthcare.intake', 'healthcare.results', 'finserv.transactions', 'finserv.scores'].map((topic, i) => (
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
    id: 'cpu',
    label: 'CPU Pool (Xeon 6)',
    customerQuestion: '"80% of our AI tasks are classification, NER, and scoring. Do those really need a GPU?"',
    workload: 'No. Classification at 779ms on CPU vs 500ms on GPU — same accuracy. NER, fraud scoring, document routing — all run on the Xeon 6 CPUs already in your data center. $0 per token. No procurement. This is where 80% of your workload lives.',
    color: 'var(--intel-cyan)',
    render: () => (
      <motion.div
        className="card card-accent-intel"
        style={{ width: 420 }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="pipe-node-label" style={{ color: 'var(--intel-cyan)' }}>Intel Xeon 6 · CPU Pool · $0/token</div>
        <div className="pipe-node-detail">128 cores · AMX · 5 models · MAAS/LiteLLM</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          {[
            { m: 'granite-2b', task: 'NER · Fraud' },
            { m: 'qwen25-3b', task: 'Classify · Summarize' },
            { m: 'granite-8b', task: 'Reasoning' },
          ].map((model, i) => (
            <motion.div
              key={model.m}
              style={{ padding: '4px 12px', borderRadius: 6, background: 'var(--intel-cyan-dim)', textAlign: 'center' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <div className="mono" style={{ fontSize: 11, color: 'var(--intel-cyan)' }}>{model.m}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{model.task}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    ),
  },
  {
    id: 'gpu',
    label: 'GPU Pool (NVIDIA)',
    customerQuestion: '"But summarization quality matters. And differential diagnosis needs reasoning power."',
    workload: 'The 20% that needs GPU gets GPU. Summarization: 3.3x faster with more detailed output. Compliance reasoning: cites specific regulations. Frontier diagnosis: gpt-oss-120b in 1.5s. The system routes here only when quality or speed demands it — $/token, not $0, but worth it.',
    color: 'var(--gpu-amber)',
    render: () => (
      <motion.div
        className="card"
        style={{ width: 420, borderLeft: '3px solid var(--gpu-amber)' }}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="pipe-node-label" style={{ color: 'var(--gpu-amber)' }}>NVIDIA GPU Pool · $/token</div>
        <div className="pipe-node-detail">Reasoning · Summarization · Frontier tasks</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          {[
            { m: 'phi-4 (14B)', task: 'Reasoning' },
            { m: 'gpt-oss-20b', task: 'Summarize' },
            { m: 'gpt-oss-120b', task: 'Frontier' },
          ].map((model, i) => (
            <motion.div
              key={model.m}
              style={{ padding: '4px 12px', borderRadius: 6, background: 'var(--gpu-amber-dim)', textAlign: 'center' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <div className="mono" style={{ fontSize: 11, color: 'var(--gpu-amber)' }}>{model.m}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{model.task}</div>
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

      <div className={revealed > 0 ? 'arch-diagram' : ''}>
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
              6 layers. CPU for the 80% that doesn't need GPU. GPU for the 20% that does. The router decides.
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
