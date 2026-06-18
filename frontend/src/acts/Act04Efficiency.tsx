import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

const MECHANISMS = [
  {
    num: 1,
    group: 'per-record',
    title: 'vLLM Semantic Router',
    owner: 'Red Hat · vLLM',
    what: 'Embedding-based classification routes each request to the right-sized model in <1ms',
    gain: 'Simple tasks use 2B model (fast). Complex tasks use 3.8B model (accurate). Avoids wasting large model capacity on classification tasks.',
    visual: 'router',
    color: 'var(--rh-red)',
    status: 'live',
    before: '1 model for everything',
    after: 'Right model per task — 40% less compute on simple workloads',
  },
  {
    num: 2,
    group: 'per-record',
    title: 'Conditional Pipeline',
    owner: 'LangGraph',
    what: 'Skips inference steps that aren\'t needed for the current record',
    gain: 'If <2 medications found, the drug interaction check is skipped entirely. No inference call, no latency, no compute. The pipeline adapts per record.',
    visual: 'pipeline',
    color: 'var(--ibm-blue)',
    status: 'live',
    before: '4 inference calls per record (always)',
    after: '2-4 calls per record (adaptive) — 25% fewer calls on average',
  },
  {
    num: 3,
    group: 'per-record',
    title: 'MCP Tools (Data, Not LLM)',
    owner: 'Red Hat · MCP Gateway',
    what: 'Drug interactions come from a curated database via MCP, not an LLM call',
    gain: 'The FDA drug interaction lookup takes 16ms. An LLM call to answer the same question takes 3-8 seconds. Not everything needs inference.',
    visual: 'tools',
    color: 'var(--rh-teal)',
    status: 'live',
    before: 'LLM call for drug data: ~4s',
    after: 'Database lookup via MCP: 16ms — 250x faster',
  },
  {
    num: 4,
    group: 'model',
    title: 'Model Optimization',
    owner: 'Intel · AMX',
    what: 'Same hardware, better inference — four independent levers that compound',
    gain: 'Each optimization reduces latency independently. Apply one or all. The gains stack on the same $0/token hardware — no new procurement, no GPU, just better engineering.',
    visual: 'modelopt',
    color: 'var(--intel-cyan)',
    status: 'options',
    before: 'Unoptimized FP32 model: ~8s/record',
    after: 'Optimized + quantized: projected 2-4x faster on same CPU',
  },
  {
    num: 5,
    group: 'fleet',
    title: 'AMQ Streams Batch Processing',
    owner: 'Red Hat',
    what: 'Async event streaming processes thousands of records in parallel',
    gain: 'Instead of synchronous one-at-a-time API calls, records stream through topics and process concurrently. Throughput scales with consumers.',
    visual: 'streams',
    color: 'var(--rh-orange)',
    status: 'live',
    before: 'Sequential API: 1 record at a time',
    after: 'Event streaming: N records in parallel, same hardware',
  },
  {
    num: 6,
    group: 'fleet',
    title: 'Agent + Model Replica Scaling',
    owner: 'Red Hat · OpenShift',
    what: 'Scale agent pods AND model serving replicas independently on existing hardware',
    gain: 'Agent replicas reduce agent-side contention (~20-30% latency improvement). Model serving replicas (multiple vLLM workers) are where throughput scales linearly. Both scale on CPUs already in the fleet.',
    visual: 'replicas',
    color: 'var(--rh-blue)',
    status: 'tested',
    before: '1 agent → 1 vLLM worker: bottleneck',
    after: '3 agents → 3 vLLM workers: 3x throughput, same latency',
  },
  {
    num: 7,
    group: 'fleet',
    title: 'llm-d Disaggregated Inference',
    owner: 'Red Hat · llm-d',
    what: 'SLO-based scheduler separates prefill and decode across specialized nodes',
    gain: 'The llm-d planner routes inference based on latency SLO targets and available capacity. Prefill (compute-heavy) goes to high-core nodes. Decode (memory-bound) goes to memory-optimized nodes. Each node does what it\'s best at.',
    visual: 'llmd',
    color: 'var(--rh-purple)',
    status: 'roadmap',
    before: 'One node does everything: prefill + decode + queue',
    after: 'Specialized nodes: prefill node → decode node, SLO-aware routing',
  },
]

function RouterVisual() {
  const D = 0.6
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <motion.div style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 13 }}
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: D }}>
        <span style={{ color: 'var(--text-dim)' }}>Request:</span> <span className="mono" style={{ color: 'var(--text-secondary)' }}>"Classify this discharge summary"</span>
      </motion.div>

      <motion.div style={{ width: 2, height: 20 }}
        initial={{ scaleY: 0, background: 'var(--border)' }}
        animate={{ scaleY: 1, background: 'var(--rh-red)' }}
        transition={{ delay: D, duration: 0.4 }} />

      <motion.div style={{ padding: '12px 24px', borderRadius: 10, background: 'var(--surface-2)', border: '2px solid var(--rh-red)', textAlign: 'center' }}
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: D + 0.4, duration: D }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--rh-red)' }}>vLLM Semantic Router</div>
        <motion.div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 0.8 }}>
          embedding classify · &lt;1ms
        </motion.div>
        <motion.div style={{ marginTop: 8, padding: '4px 16px', borderRadius: 6, background: 'var(--rh-green-dim)', border: '1px solid var(--rh-green)', display: 'inline-block' }}
          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: D + 1.2, type: 'spring', stiffness: 400, damping: 20 }}>
          <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--rh-green)' }}>→ SIMPLE</span>
        </motion.div>
      </motion.div>

      <motion.div style={{ width: 2, height: 20 }}
        initial={{ scaleY: 0, background: 'var(--border)' }}
        animate={{ scaleY: 1, background: 'var(--rh-green)' }}
        transition={{ delay: D + 1.6, duration: 0.3 }} />

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {[
          { tier: 'SIMPLE', model: 'granite-2b', color: 'var(--rh-green)', active: true },
          { tier: 'MEDIUM', model: 'qwen25-3b', color: 'var(--rh-blue)', active: false },
          { tier: 'COMPLEX', model: 'phi3-mini', color: 'var(--rh-purple)', active: false },
        ].map((r, i) => (
          <motion.div key={r.tier} style={{
            padding: '8px 16px', borderRadius: 8, background: 'var(--surface-2)',
            border: `2px solid ${r.active ? r.color : 'var(--border)'}`,
            textAlign: 'center', opacity: r.active ? 1 : 0.4,
            boxShadow: r.active ? `0 0 16px ${r.color}20` : 'none',
          }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: r.active ? 1 : 0.4, y: 0 }}
            transition={{ delay: D + 1.8 + i * 0.15, duration: 0.4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.tier}</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>{r.model}</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function PipelineVisual() {
  const steps = [
    { name: 'Classify', time: '828ms', color: 'var(--rh-green)', skip: false },
    { name: 'Extract NER', time: '4,296ms', color: 'var(--intel-cyan)', skip: false },
    { name: 'Check Interactions', time: 'conditional', color: 'var(--rh-orange)', skip: true },
    { name: 'Summarize', time: '4,567ms', color: 'var(--rh-green)', skip: false },
  ]
  const D = 0.8
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>
      {steps.map((s, i) => (
        <div key={s.name} style={{ display: 'flex', alignItems: 'center' }}>
          <motion.div style={{
            padding: '10px 14px', borderRadius: 10, textAlign: 'center', minWidth: 110,
            border: `2px solid var(--border)`, background: 'var(--surface-2)',
          }}
            initial={{ opacity: 0, scale: 0.9, borderColor: 'var(--border)' }}
            animate={{
              opacity: 1, scale: 1,
              borderColor: s.skip ? 'var(--rh-orange)' : s.color,
              background: s.skip ? 'var(--rh-orange-dim)' : 'var(--surface-2)',
            }}
            transition={{ delay: i * D, duration: 0.5 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: s.skip ? 'var(--rh-orange)' : 'var(--text-secondary)' }}>{s.name}</div>
            <motion.div className="mono" style={{ fontSize: 11, marginTop: 4 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * D + 0.4 }}>
              {s.skip ? (
                <span style={{ color: 'var(--rh-orange)', fontSize: 10 }}>skip if &lt;2 meds</span>
              ) : (
                <span style={{ color: 'var(--intel-cyan)', fontWeight: 700 }}>{s.time}</span>
              )}
            </motion.div>
          </motion.div>
          {i < steps.length - 1 && (
            <motion.div style={{ padding: '0 4px' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * D + 0.5 }}>
              <svg width="28" height="12" viewBox="0 0 28 12">
                <motion.line x1="0" y1="6" x2="20" y2="6" stroke="var(--border)" strokeWidth="2"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: i * D + 0.5, duration: 0.3 }} />
                <polygon points="18,2 26,6 18,10" fill="var(--border)" />
              </svg>
            </motion.div>
          )}
        </div>
      ))}
    </div>
  )
}

function ToolsVisual() {
  const D = 0.7
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <motion.div style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <span style={{ color: 'var(--text-dim)' }}>Agent needs:</span> <span className="mono" style={{ color: 'var(--text-secondary)' }}>drug interaction data</span>
      </motion.div>

      <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
        <motion.div style={{ textAlign: 'center' }}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: D }}>
          <div style={{ padding: '12px 20px', borderRadius: 10, background: 'var(--surface-2)', border: '2px solid var(--rh-teal)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--rh-teal)' }}>MCP Tool</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>FDA / NIH RxNav</div>
          </div>
          <motion.div className="mono" style={{ marginTop: 6 }}
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: D + 0.5, type: 'spring', stiffness: 300 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--rh-green)' }}>16ms</span>
          </motion.div>
        </motion.div>

        <motion.div style={{ alignSelf: 'center', fontSize: 13, color: 'var(--text-dim)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 0.8 }}>
          vs
        </motion.div>

        <motion.div style={{ textAlign: 'center', opacity: 0.4 }}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 0.4, x: 0 }} transition={{ delay: D + 0.3 }}>
          <div style={{ padding: '12px 20px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', textDecoration: 'line-through' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-disabled)' }}>LLM Call</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 4 }}>granite-2b-cpu</div>
          </div>
          <motion.div className="mono" style={{ marginTop: 6 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 0.6 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--rh-orange)' }}>~4,000ms</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

function StreamsVisual() {
  const D = 0.5
  const topics = ['healthcare.requests', 'healthcare.results', 'finserv.requests']
  return (
    <div style={{ textAlign: 'center' }}>
      <motion.div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Records stream through AMQ Streams topics
      </motion.div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        {topics.map((topic, i) => (
          <motion.div key={topic} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 400,
          }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * D, duration: 0.4 }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--rh-orange)', minWidth: 160, textAlign: 'right' }}>{topic}</div>
            <div style={{ flex: 1, height: 6, background: 'var(--surface-1)', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div style={{ height: '100%', borderRadius: 3, background: 'var(--rh-orange)' }}
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: i * D + 0.3, duration: 0.8 }} />
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-dim)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: topics.length * D + 0.5 }}>
        Parallel consumers process records concurrently — throughput scales with consumer count
      </motion.div>
    </div>
  )
}

function ReplicasVisual() {
  const D = 0.4
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[1, 2, 3].map(n => (
            <motion.div key={`agent-${n}`} style={{
              padding: '6px 14px', borderRadius: 6, background: 'var(--surface-2)',
              border: '1px solid var(--rh-blue)', fontSize: 11,
            }} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: n * D * 0.5, duration: 0.4 }}>
              <span style={{ color: 'var(--rh-blue)' }}>Agent Pod {n}</span>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D * 2 }}>
          <svg width="40" height="60" viewBox="0 0 40 60">
            {[10, 30, 50].map((y, i) => (
              <motion.line key={y} x1="0" y1={y} x2="32" y2="30" stroke="var(--rh-blue)" strokeWidth="1.5" strokeOpacity="0.5"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: D * 2 + i * 0.15, duration: 0.3 }} />
            ))}
            <polygon points="30,26 38,30 30,34" fill="var(--rh-blue)" opacity="0.5" />
          </svg>
        </motion.div>

        <motion.div style={{
          padding: '10px 16px', borderRadius: 8, background: 'var(--surface-2)',
          border: '2px solid var(--rh-red)', fontSize: 12,
        }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: D * 3, duration: 0.4 }}>
          <div style={{ fontWeight: 700, color: 'var(--rh-red)' }}>OCP Service</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>load balance</div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D * 4 }}>
          <svg width="40" height="60" viewBox="0 0 40 60">
            {[10, 30, 50].map((y, i) => (
              <motion.line key={y} x1="8" y1="30" x2="40" y2={y} stroke="var(--intel-cyan)" strokeWidth="1.5" strokeOpacity="0.5"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: D * 4 + i * 0.15, duration: 0.3 }} />
            ))}
            <polygon points="6,26 6,34 0,30" fill="var(--intel-cyan)" opacity="0.5" />
          </svg>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[1, 2, 3].map(n => (
            <motion.div key={`vllm-${n}`} style={{
              padding: '6px 14px', borderRadius: 6, background: 'var(--surface-2)',
              border: '1px solid var(--intel-cyan)', fontSize: 11,
            }} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: D * 4.5 + n * D * 0.5, duration: 0.4 }}>
              <span className="mono" style={{ color: 'var(--intel-cyan)' }}>vLLM granite-2b</span>
            </motion.div>
          ))}
        </div>
      </div>
      <motion.div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-dim)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D * 7 }}>
        Agent replicas reduce latency · Model serving replicas unlock throughput
      </motion.div>
    </div>
  )
}

function LlmdVisual() {
  const D = 0.6
  return (
    <div style={{ textAlign: 'center' }}>
      <motion.div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Inference request arrives with SLO target: 2s latency
      </motion.div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        <motion.div style={{
          padding: '12px 20px', borderRadius: 10, background: 'var(--surface-2)',
          border: '2px solid var(--rh-purple)', textAlign: 'center',
        }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: D, duration: 0.5 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--rh-purple)' }}>llm-d Planner</div>
          <motion.div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 0.4 }}>
            SLO: 2s · capacity check
          </motion.div>
          <motion.div style={{
            marginTop: 6, padding: '2px 10px', borderRadius: 4,
            background: 'var(--rh-green-dim)', border: '1px solid var(--rh-green)', display: 'inline-block',
          }} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: D + 0.8, type: 'spring', stiffness: 400, damping: 20 }}>
            <span className="mono" style={{ fontSize: 10, color: 'var(--rh-green)' }}>route → node-3</span>
          </motion.div>
        </motion.div>

        <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 1.2 }}>
          <svg width="50" height="50" viewBox="0 0 50 50">
            <motion.line x1="0" y1="25" x2="35" y2="12" stroke="var(--rh-purple)" strokeWidth="2"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: D + 1.2, duration: 0.4 }} />
            <motion.line x1="0" y1="25" x2="35" y2="38" stroke="var(--rh-purple)" strokeWidth="2" strokeDasharray="4 3"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: D + 1.4, duration: 0.4 }} />
          </svg>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <motion.div style={{
            padding: '10px 20px', borderRadius: 10, background: 'var(--surface-2)',
            border: '2px solid var(--rh-purple)', textAlign: 'center',
          }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: D + 1.6, duration: 0.5 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--rh-purple)' }}>Prefill Node</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>compute-heavy · 128 cores</div>
            <motion.div className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--intel-cyan)', marginTop: 4 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 2.2 }}>
              200ms
            </motion.div>
          </motion.div>

          <motion.div style={{
            padding: '10px 20px', borderRadius: 10, background: 'var(--surface-2)',
            border: '2px solid var(--rh-purple)', textAlign: 'center',
          }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: D + 2.0, duration: 0.5 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--rh-purple)' }}>Decode Node</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>memory-bound · stream</div>
            <motion.div className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--intel-cyan)', marginTop: 4 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 2.6 }}>
              1.2s
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.div style={{ marginTop: 12 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 3.0 }}>
        <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--rh-green)' }}>Total: 1.4s</span>
        <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 8 }}>within 2s SLO target</span>
      </motion.div>
    </div>
  )
}

function ModelOptVisual() {
  const options = [
    { label: 'Quantization', detail: 'INT8 / INT4 precision', gain: '2-3x faster', sub: 'AMX instructions', color: 'var(--intel-cyan)' },
    { label: 'Optimized Variants', detail: 'Models built for CPU', gain: 'AMX-aware kernels', sub: 'Same accuracy', color: 'var(--rh-green)' },
    { label: 'Model Selection', detail: 'Right-size to task', gain: 'Don\'t over-provision', sub: '2B vs 3B vs 3.8B', color: 'var(--rh-blue)' },
    { label: 'Prompt Tuning', detail: 'Shorter prompts', gain: 'Fewer tokens in/out', sub: '= faster inference', color: 'var(--rh-teal)' },
  ]
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
      {options.map((o, i) => (
        <motion.div
          key={o.label}
          style={{
            padding: '12px 16px', borderRadius: 8, background: 'var(--surface-2)',
            border: `1px solid ${o.color}`, textAlign: 'center', minWidth: 130, flex: '1 1 130px', maxWidth: 170,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: o.color }}>{o.label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{o.detail}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{o.sub}</div>
          <div className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--rh-green)', marginTop: 6 }}>{o.gain}</div>
        </motion.div>
      ))}
    </div>
  )
}

const VISUALS: Record<string, () => JSX.Element> = {
  router: RouterVisual,
  modelopt: ModelOptVisual,
  pipeline: PipelineVisual,
  tools: ToolsVisual,
  streams: StreamsVisual,
  replicas: ReplicasVisual,
  llmd: LlmdVisual,
}

const GROUP_HEADERS: Record<string, { label: string; detail: string }> = {
  'per-record': { label: 'Per-Record Efficiency', detail: 'Reduce work per record — do less inference, use the right model' },
  'model': { label: 'Model Optimization', detail: 'Same hardware, better models — four independent levers that compound' },
  'fleet': { label: 'Fleet-Scale Throughput', detail: 'Scale total output — agent replicas, model replicas, disaggregated inference' },
}

export function Act04Efficiency({ onComplete }: Props) {
  const [revealed, setRevealed] = useState(0)

  const advance = () => {
    if (revealed < MECHANISMS.length) {
      setRevealed(prev => prev + 1)
    }
  }

  const allRevealed = revealed >= MECHANISMS.length
  let lastGroup = ''

  return (
    <div className="demo-section">
      <h3><span className="section-num">05</span> The Efficiency Stack</h3>
      <div className="section-context">
        The scale test showed the tradeoff — latency climbs under load while cost stays flat.
        Here's how each layer pushes that efficiency line down. Three reduce work per record.
        Three scale throughput across the fleet.
      </div>

      {MECHANISMS.map((m, i) => {
        const Visual = VISUALS[m.visual]
        const showGroupHeader = m.group !== lastGroup && revealed >= i + 1
        lastGroup = revealed >= i + 1 ? m.group : lastGroup

        return (
          <div key={m.num}>
            <AnimatePresence>
              {showGroupHeader && (
                <motion.div
                  style={{ marginTop: i > 0 ? 28 : 8, marginBottom: 8 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-dim)' }}>
                    {GROUP_HEADERS[m.group]?.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-disabled)' }}>
                    {GROUP_HEADERS[m.group]?.detail}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {revealed >= i + 1 && (
                <motion.div
                  className="step-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ borderLeft: `3px solid ${m.color}` }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span className="step-num" style={{ background: m.color }}>{m.num}</span>
                    <div style={{ flex: 1 }}>
                      <strong>{m.title}</strong>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{m.owner}</div>
                    </div>
                    <div style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 4,
                      background: m.status === 'live' ? 'var(--rh-green-dim)' : m.status === 'tested' ? 'var(--intel-cyan-dim)' : m.status === 'options' ? 'var(--rh-teal-dim)' : 'var(--surface-1)',
                      color: m.status === 'live' ? 'var(--rh-green)' : m.status === 'tested' ? 'var(--intel-cyan)' : m.status === 'options' ? 'var(--rh-teal)' : 'var(--text-disabled)',
                      fontWeight: 600,
                    }}>
                      {m.status === 'live' ? 'LIVE' : m.status === 'tested' ? 'TESTED' : m.status === 'options' ? 'OPTIONS' : 'ROADMAP'}
                    </div>
                  </div>

                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {m.what}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
                    {m.gain}
                  </div>

                  <Visual />

                  <motion.div
                    style={{
                      display: 'flex', gap: 12, marginTop: 16, justifyContent: 'center',
                      flexWrap: 'wrap',
                    }}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div style={{
                      padding: '6px 14px', borderRadius: 6, fontSize: 12,
                      background: 'var(--surface-2)', border: '1px solid var(--border)',
                      color: 'var(--text-disabled)', textDecoration: 'line-through',
                    }}>
                      {m.before}
                    </div>
                    <div style={{ color: 'var(--rh-green)', fontSize: 16, alignSelf: 'center' }}>→</div>
                    <div style={{
                      padding: '6px 14px', borderRadius: 6, fontSize: 12,
                      background: 'var(--rh-green-dim)', border: '1px solid var(--rh-green)',
                      color: 'var(--rh-green)', fontWeight: 600,
                    }}>
                      {m.after}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        {!allRevealed ? (
          <button className="btn btn-secondary" onClick={advance}>
            {revealed === 0
              ? 'Show the first layer →'
              : `Next: ${MECHANISMS[revealed]?.title} →`}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div style={{ fontSize: 13, color: 'var(--rh-green)', fontWeight: 600, marginBottom: 16 }}>
              7 layers across 3 dimensions. Each compounds. Cost stays at $0/token. Performance is engineered, not purchased.
            </div>
            <button className="btn btn-primary" onClick={onComplete}>
              The punchline →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
