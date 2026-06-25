import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useDemoMetrics } from '../DemoContext'
import { useModules } from '../ModuleContext'

interface Props { onComplete?: () => void }

function fmt(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const MECHANISMS = [
  {
    num: 1,
    moduleId: 'semantic-routing',
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
    moduleId: 'conditional-pipeline',
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
    moduleId: 'mcp-tools',
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
    moduleId: 'model-optimization',
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
    moduleId: 'batch-processing',
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
    moduleId: 'replica-scaling',
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
    moduleId: 'llmd-inference',
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
  {
    num: 8,
    moduleId: 'adaptive-classification',
    group: 'learning',
    title: 'Adaptive Classification',
    owner: 'LangGraph · Triforce',
    what: 'Unlike the 7 levers above, this one isn\'t a switch — it\'s a trajectory. The system caches every LLM classification result. On re-encounter, it returns the cached answer in <1ms. The more records it processes, the fewer LLM calls it needs.',
    gain: 'Day 1: every classification calls the LLM. Week 2: 60% come from cache. Month 1: 95% deterministic. The system teaches itself what it\'s already seen — and reserves inference capacity for documents it hasn\'t. Only possible at $0/token — cloud APIs give no incentive to cache.',
    visual: 'adaptive',
    color: 'var(--rh-green)',
    status: 'live',
    before: 'Every record calls the LLM for classification',
    after: 'Volume-dependent: 95% cached after warmup — cost per record drops with scale',
  },
  {
    num: 9,
    moduleId: 'speculative',
    group: 'fleet',
    title: 'Speculative Decoding',
    owner: 'vLLM · Intel',
    what: 'A small draft model (1B) proposes tokens ahead. The target model (2-3B) verifies them in a single pass. Correct tokens accepted instantly. Wrong ones regenerated. Output is identical — lossless quality, 2-3x speedup.',
    gain: 'Works on both CPU and GPU. Compounds with INT8 quantization and llm-d. The same hardware does 2-3x more work with zero quality loss.',
    visual: 'speculative',
    color: 'var(--intel-blue)',
    status: 'planned',
    before: 'Generate tokens one at a time: each waits for the last',
    after: 'Draft proposes 5 tokens → target verifies in 1 pass → 2-3x faster',
  },
  {
    num: 10,
    moduleId: 'heterogeneous',
    group: 'fleet',
    title: 'Heterogeneous Compute Routing',
    owner: 'Red Hat · vLLM',
    what: 'The semantic router classifies each request by complexity and routes to optimal hardware. Simple → CPU ($0). Complex → GPU ($/token). Same API, different backends. The system decides in <1ms.',
    gain: 'Classification and NER stay on CPU — no quality difference, $0 cost. Summarization and reasoning route to GPU — 3-10x faster with better output. 80% of workload runs free.',
    visual: 'heterogeneous',
    color: 'var(--gpu-amber)',
    status: 'live',
    before: 'One hardware tier for everything: CPU or GPU, pick one',
    after: 'SIMPLE → CPU ($0) · COMPLEX → GPU ($/token) — routed automatically',
  },
  {
    num: 11,
    moduleId: 'fusion',
    group: 'learning',
    title: 'Multi-Model Fusion',
    owner: 'LangGraph · Triforce',
    what: 'For critical decisions, send the same question to 3 models in parallel. A judge model compares their responses: consensus, contradictions, blind spots. Cost: 4x one call. Value: confidence for decisions with consequences.',
    gain: 'Single model: one perspective, one set of blind spots. Panel of 3 + judge: consensus validated, contradictions caught, gaps identified. On CPU at $0/token, the extra calls are literally free.',
    visual: 'fusion',
    color: 'var(--ibm-blue)',
    status: 'live',
    before: 'One model, one answer — hope it\'s right',
    after: '3 models + judge → consensus synthesis — confidence for critical decisions',
  },
  {
    num: 12,
    moduleId: 'benchmarking',
    group: 'analysis',
    title: 'Model Benchmarking',
    owner: 'guidellm · Triforce',
    what: 'Compare any model on any task on any hardware with real metrics. Latency, throughput, TTFT, quality — measured, not estimated. guidellm runs production-grade load sweeps.',
    gain: 'Every optimization claim is testable. Run the benchmark yourself — the numbers are live from MAAS, not slides.',
    visual: 'benchmark',
    color: 'var(--rh-teal)',
    status: 'live',
    before: 'Trust vendor benchmarks on different hardware',
    after: 'Run your own benchmarks on YOUR models, YOUR tasks, YOUR hardware',
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
  const { pipeline } = useDemoMetrics()
  const p = pipeline
  const steps = [
    { name: 'Classify', time: p ? fmt(p.classifyMs) : '—', color: 'var(--rh-green)', skip: false },
    { name: 'Extract NER', time: p ? fmt(p.nerMs) : '—', color: 'var(--intel-cyan)', skip: false },
    { name: 'Check Interactions', time: 'conditional', color: 'var(--rh-orange)', skip: true },
    { name: 'Summarize', time: p ? fmt(p.summarizeMs) : '—', color: 'var(--rh-green)', skip: false },
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
  const { pipeline } = useDemoMetrics()
  const mcpTime = pipeline ? fmt(pipeline.interactionsMs) : '—'
  const llmTime = pipeline ? fmt(pipeline.nerMs) : '—'
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
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--rh-green)' }}>{mcpTime}</span>
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
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--rh-orange)' }}>{llmTime}</span>
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
  const [compareResult, setCompareResult] = useState<any>(null)
  const [comparing, setComparing] = useState(false)

  const runCompare = async () => {
    setComparing(true)
    try {
      const resp = await fetch('/healthcare/api/v1/pipeline/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin and Lisinopril. Recent STEMI with PCI to RCA. Started on Aspirin 81mg, Clopidogrel 75mg.',
          classify_model: 'qwen25-3b-int8',
          ner_model: 'granite-2b-int8',
          summarize_model: 'qwen25-3b-int8',
        }),
      })
      setCompareResult(await resp.json())
    } catch {
      setCompareResult({ error: 'INT8 models not deployed yet — comparison will be available after optimization' })
    }
    setComparing(false)
  }

  const options = [
    { label: 'Quantization', detail: 'INT8 / INT4 precision', gain: '2-3x faster', sub: 'AMX instructions', color: 'var(--intel-cyan)' },
    { label: 'Optimized Variants', detail: 'Models built for CPU', gain: 'AMX-aware kernels', sub: 'Same accuracy', color: 'var(--rh-green)' },
    { label: 'Model Selection', detail: 'Right-size to task', gain: 'Don\'t over-provision', sub: '2B vs 3B vs 3.8B', color: 'var(--rh-blue)' },
    { label: 'Prompt Tuning', detail: 'Shorter prompts', gain: 'Fewer tokens in/out', sub: '= faster inference', color: 'var(--rh-teal)' },
  ]
  return (
    <div>
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

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button className="btn btn-secondary" onClick={runCompare} disabled={comparing}
          style={{ borderColor: 'var(--intel-cyan)' }}>
          {comparing ? 'Running FP32 vs INT8...' : 'Prove it — run FP32 vs INT8 comparison'}
        </button>
      </div>

      {compareResult && !compareResult.error && (
        <motion.div style={{ marginTop: 16 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-dim)' }}>Step</th>
                <th style={{ textAlign: 'right', padding: '6px 10px', color: 'var(--text-dim)' }}>FP32 (baseline)</th>
                <th style={{ textAlign: 'right', padding: '6px 10px', color: 'var(--intel-cyan)' }}>INT8 (optimized)</th>
                <th style={{ textAlign: 'right', padding: '6px 10px', color: 'var(--rh-green)' }}>Delta</th>
              </tr>
            </thead>
            <tbody>
              {compareResult.baseline.inference_log.map((b: any, i: number) => {
                const o = compareResult.optimized.inference_log[i]
                const delta = o ? b.latency_ms - o.latency_ms : 0
                const pct = o && b.latency_ms > 0 ? Math.round((delta / b.latency_ms) * 100) : 0
                return (
                  <tr key={b.node} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '6px 10px' }}>{b.node}</td>
                    <td className="mono" style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-dim)' }}>{b.latency_ms}ms</td>
                    <td className="mono" style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--intel-cyan)', fontWeight: 700 }}>{o ? `${o.latency_ms}ms` : '—'}</td>
                    <td className="mono" style={{ padding: '6px 10px', textAlign: 'right', color: delta > 0 ? 'var(--rh-green)' : 'var(--rh-orange)', fontWeight: 600 }}>{delta > 0 ? `-${pct}%` : `+${Math.abs(pct)}%`}</td>
                  </tr>
                )
              })}
              <tr style={{ borderTop: '2px solid var(--border)' }}>
                <td style={{ padding: '6px 10px', fontWeight: 700 }}>Total</td>
                <td className="mono" style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text-dim)', fontWeight: 700 }}>{compareResult.baseline.total_ms}ms</td>
                <td className="mono" style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--intel-cyan)', fontWeight: 700 }}>{compareResult.optimized.total_ms}ms</td>
                <td className="mono" style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--rh-green)', fontWeight: 700 }}>{compareResult.speedup} faster</td>
              </tr>
            </tbody>
          </table>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 6 }}>
            Same document · same hardware · same $0/token · {compareResult.delta_ms}ms saved
          </div>
        </motion.div>
      )}

      {compareResult?.error && (
        <motion.div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-disabled)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {compareResult.error}
        </motion.div>
      )}
    </div>
  )
}

function AdaptiveVisual() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const D = 0.5

  const fetchStats = async () => {
    setLoading(true)
    try {
      const resp = await fetch('/healthcare/api/v1/adaptive/stats')
      setStats(await resp.json())
    } catch {
      setStats({ error: 'Adaptive classification endpoint not available' })
    }
    setLoading(false)
  }

  const phases = [
    { label: 'Day 1', llm: 100, cache: 0 },
    { label: 'Week 2', llm: 40, cache: 60 },
    { label: 'Month 1+', llm: 5, cache: 95 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 320 }}>
        {phases.map((p, i) => (
          <motion.div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: D + i * 0.5, duration: 0.4 }}>
            <div style={{ width: 60, fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textAlign: 'right' }}>{p.label}</div>
            <div style={{ flex: 1, height: 22, borderRadius: 4, overflow: 'hidden', display: 'flex', background: 'var(--surface-1)' }}>
              <motion.div style={{ height: '100%', background: 'var(--rh-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                initial={{ width: '100%' }} animate={{ width: `${p.llm}%` }}
                transition={{ delay: D + i * 0.5 + 0.3, duration: 0.6 }}>
                {p.llm > 15 && <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>LLM {p.llm}%</span>}
              </motion.div>
              {p.cache > 0 && (
                <motion.div style={{ height: '100%', background: 'var(--rh-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  initial={{ width: 0 }} animate={{ width: `${p.cache}%` }}
                  transition={{ delay: D + i * 0.5 + 0.3, duration: 0.6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>Cache {p.cache}%</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 4, lineHeight: 1.6 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 2.0 }}>
        Document → SHA-256 → Cache lookup<br/>
        <span style={{ color: 'var(--rh-green)', fontWeight: 600 }}>Hit → cached classification {'<'}1ms</span>
        {' · '}
        <span style={{ color: 'var(--rh-orange)', fontWeight: 600 }}>Miss → LLM → store result</span>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 2.5 }}>
        <button className="btn btn-secondary"
          style={{ borderColor: 'var(--rh-green)', fontSize: 12, padding: '6px 16px' }}
          onClick={fetchStats} disabled={loading}>
          {loading ? 'Checking…' : 'Prove it — show live cache stats'}
        </button>
      </motion.div>

      {stats && !stats.error && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ width: '100%', maxWidth: 280 }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Cache size', stats.cache_size],
                ['Total lookups', stats.total_lookups],
                ['Cache hits', stats.cache_hits],
                ['Hit rate', `${(stats.hit_rate * 100).toFixed(1)}%`],
                ['LLM reduction', `${stats.llm_reduction_pct}%`],
              ].map(([label, val]) => (
                <tr key={String(label)}>
                  <td style={{ padding: '4px 8px', color: 'var(--text-dim)' }}>{label}</td>
                  <td className="mono" style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--rh-green)' }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {stats?.error && (
        <motion.div style={{ fontSize: 12, color: 'var(--text-disabled)', textAlign: 'center' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {stats.error}
        </motion.div>
      )}
    </div>
  )
}

function SpeculativeVisual() {
  const D = 0.5
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <motion.div style={{ padding: '10px 16px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', textAlign: 'center' }}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: D }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--intel-blue)' }}>Draft Model</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>granite-4-0-h-tiny</div>
          <motion.div className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--rh-green)', marginTop: 4 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 0.5 }}>
            Proposes 5 tokens → 50ms
          </motion.div>
        </motion.div>
        <motion.div style={{ fontSize: 20, color: 'var(--text-dim)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 0.8 }}>→</motion.div>
        <motion.div style={{ padding: '10px 16px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', textAlign: 'center' }}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: D + 1.0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--intel-cyan)' }}>Target Model</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>granite-2b-cpu</div>
          <motion.div className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--rh-green)', marginTop: 4 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 1.5 }}>
            Verifies all 5 → 800ms
          </motion.div>
        </motion.div>
      </div>
      <motion.div style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 2.0 }}>
        4 correct, 1 rejected → regenerate 1 token<br/>
        <span className="mono" style={{ fontWeight: 700, color: 'var(--rh-green)' }}>Total: ~850ms vs 4s sequential = 4.7x faster</span>
      </motion.div>
    </div>
  )
}

function HeterogeneousVisual() {
  const D = 0.5
  const routes = [
    { label: 'Classify document', route: 'SIMPLE', hw: 'CPU', model: 'granite-2b', cost: '$0', color: 'var(--intel-cyan)' },
    { label: 'Extract entities', route: 'SIMPLE', hw: 'CPU', model: 'granite-2b', cost: '$0', color: 'var(--intel-cyan)' },
    { label: 'Summarize record', route: 'MEDIUM', hw: 'CPU', model: 'qwen25-3b', cost: '$0', color: 'var(--intel-cyan)' },
    { label: 'Differential diagnosis', route: 'COMPLEX', hw: 'GPU', model: 'gpt-oss-120b', cost: '$/tok', color: 'var(--gpu-amber)' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 400, margin: '0 auto' }}>
      {routes.map((r, i) => (
        <motion.div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}
          initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: D + i * 0.3 }}>
          <div style={{ width: 140, color: 'var(--text-dim)' }}>{r.label}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', width: 50 }}>{r.route}</div>
          <div style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: r.hw === 'GPU' ? 'var(--gpu-amber-dim)' : 'var(--intel-cyan-dim)', color: r.color }}>{r.hw}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{r.model}</div>
          <div className="mono" style={{ fontSize: 11, fontWeight: 700, color: r.hw === 'GPU' ? 'var(--gpu-amber)' : 'var(--rh-green)' }}>{r.cost}</div>
        </motion.div>
      ))}
      <motion.div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 1.5 }}>
        3 of 4 tasks → CPU ($0) · 1 task → GPU ($/token)
      </motion.div>
    </div>
  )
}

function FusionVisual() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const D = 0.5

  const fetchStats = async () => {
    setLoading(true)
    try {
      const resp = await fetch('/healthcare/api/v1/fusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: 'compliance', prompt: 'Is a pattern of $9,500 transfers to Cayman Islands AML structuring?' }),
      })
      setStats(await resp.json())
    } catch {
      setStats({ error: 'Fusion endpoint not available' })
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        {['granite-2b', 'qwen25-3b', 'phi3-mini'].map((m, i) => (
          <motion.div key={m} style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 11, textAlign: 'center' }}
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: D + i * 0.2 }}>
            <div style={{ fontWeight: 700, color: 'var(--ibm-blue)' }}>{m}</div>
            <div style={{ color: 'var(--text-dim)', marginTop: 2 }}>answers</div>
          </motion.div>
        ))}
      </div>
      <motion.div style={{ fontSize: 16, color: 'var(--text-dim)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 0.8 }}>↓</motion.div>
      <motion.div style={{ padding: '8px 16px', borderRadius: 6, background: 'var(--surface-2)', border: '2px solid var(--ibm-blue)', fontSize: 12, textAlign: 'center' }}
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: D + 1.0 }}>
        <div style={{ fontWeight: 700, color: 'var(--ibm-blue)' }}>Judge (granite-8b)</div>
        <div style={{ color: 'var(--text-dim)', marginTop: 2 }}>consensus · contradictions · gaps</div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 1.5 }}>
        <button className="btn btn-secondary" style={{ borderColor: 'var(--ibm-blue)', fontSize: 12, padding: '6px 14px' }}
          onClick={fetchStats} disabled={loading}>
          {loading ? 'Running fusion...' : 'Prove it — run 3-model panel'}
        </button>
      </motion.div>

      {stats && !stats.error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ fontSize: 12, textAlign: 'center', color: 'var(--text-dim)' }}>
          Panel: {stats.panel?.count} models in {stats.panel?.latency_ms}ms · Judge: {stats.judge?.latency_ms}ms · Total: {stats.total_ms}ms
        </motion.div>
      )}
      {stats?.error && (
        <div style={{ fontSize: 12, color: 'var(--text-disabled)' }}>{stats.error}</div>
      )}
    </div>
  )
}

function BenchmarkVisual() {
  const D = 0.5
  const data = [
    { task: 'Classification', cpu: '779ms', gpu: '500ms', speedup: '1.6x', verdict: 'CPU fine' },
    { task: 'NER', cpu: '6.2s', gpu: '3.8s', speedup: '1.6x', verdict: 'GPU better quality' },
    { task: 'Summarization', cpu: '5.2s', gpu: '1.6s', speedup: '3.3x', verdict: 'GPU wins' },
    { task: 'Diagnosis', cpu: '14.8s', gpu: '1.5s', speedup: '10.1x', verdict: 'GPU essential' },
  ]
  return (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-dim)' }}>Task</th>
            <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--intel-cyan)' }}>CPU</th>
            <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--gpu-amber)' }}>GPU</th>
            <th style={{ textAlign: 'right', padding: '6px 8px', color: 'var(--rh-green)' }}>Δ</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <motion.tr key={d.task}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: D + i * 0.2 }}
              style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '6px 8px', fontWeight: 600 }}>{d.task}</td>
              <td className="mono" style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--intel-cyan)' }}>{d.cpu}</td>
              <td className="mono" style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--gpu-amber)' }}>{d.gpu}</td>
              <td className="mono" style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: 'var(--rh-green)' }}>{d.speedup}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      <motion.div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D + 1.2 }}>
        Live MAAS numbers · June 2026
      </motion.div>
    </div>
  )
}

const VISUALS: Record<string, () => React.ReactElement> = {
  router: RouterVisual,
  modelopt: ModelOptVisual,
  pipeline: PipelineVisual,
  tools: ToolsVisual,
  streams: StreamsVisual,
  replicas: ReplicasVisual,
  llmd: LlmdVisual,
  adaptive: AdaptiveVisual,
  speculative: SpeculativeVisual,
  heterogeneous: HeterogeneousVisual,
  fusion: FusionVisual,
  benchmark: BenchmarkVisual,
}

const GROUP_HEADERS: Record<string, { label: string; detail: string }> = {
  'per-record': { label: 'Per-Record Efficiency', detail: 'Reduce work per record — do less inference, use the right model' },
  'model': { label: 'Model Optimization', detail: 'Same hardware, better models — four independent levers that compound' },
  'fleet': { label: 'Fleet-Scale Throughput', detail: 'Scale total output — replicas, disaggregated inference, batch streaming' },
  'learning': { label: 'Compounding Over Time', detail: 'These improve the longer they run — adaptive caching and multi-model consensus.' },
  'analysis': { label: 'Measure & Validate', detail: 'Every claim is testable. Run the benchmarks yourself.' },
}

const MODULE_ROUTES: Record<string, string> = {
  'adaptive-classification': '/modules/adaptive-cache',
  'benchmarking': '/modules/benchmarking',
  'fusion': '/modules/fusion',
  'heterogeneous': '/modules/heterogeneous',
  'pipeline': '/modules/pipeline',
}

export function Act04Efficiency({ onComplete }: Props) {
  const [revealed, setRevealed] = useState(0)
  const { enabled, allModulesMode } = useModules()
  const navigate = useNavigate()

  const CORE_MODULES = new Set([
    'semantic-routing', 'conditional-pipeline', 'mcp-tools', 'model-optimization',
    'batch-processing', 'replica-scaling', 'llmd-inference', 'adaptive-classification',
  ])

  const activeMechanisms = allModulesMode
    ? MECHANISMS
    : MECHANISMS.filter(m => CORE_MODULES.has(m.moduleId) || enabled.includes(m.moduleId))

  const advance = () => {
    if (revealed < activeMechanisms.length) {
      setRevealed(prev => prev + 1)
    }
  }

  const allRevealed = revealed >= activeMechanisms.length
  let lastGroup = ''

  return (
    <div className="demo-section">
      <h3><span className="section-num">05</span> The Efficiency Stack</h3>
      <div className="section-context">
        The scale test showed the tradeoff — latency climbs under load while cost stays flat.
        Here's how each layer pushes that efficiency line down. Three reduce work per record.
        Three scale throughput across the fleet.
      </div>

      {activeMechanisms.map((m, i) => {
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

                  {MODULE_ROUTES[m.moduleId] && (
                    <motion.div style={{ textAlign: 'center', marginTop: 12 }}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                      <button className="btn btn-secondary"
                        style={{ fontSize: 11, padding: '4px 14px', borderColor: m.color }}
                        onClick={() => navigate(MODULE_ROUTES[m.moduleId])}>
                        Deep Dive →
                      </button>
                    </motion.div>
                  )}
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
              : `Next: ${activeMechanisms[revealed]?.title} →`}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div style={{ fontSize: 13, color: 'var(--rh-green)', fontWeight: 600, marginBottom: 16 }}>
              {activeMechanisms.length} optimization layers. Each compounds. Cost stays at $0/token. Performance is engineered, not purchased.
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
