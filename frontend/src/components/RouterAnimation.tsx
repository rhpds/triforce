import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const SCENARIOS = [
  { text: '"Classify this discharge summary"', route: 'SIMPLE', model: 'granite-2b-cpu', params: '2B', color: 'var(--rh-green)', latency: '615ms', idx: 0 },
  { text: '"Summarize the patient record with key findings"', route: 'MEDIUM', model: 'qwen25-3b-cpu', params: '3B', color: 'var(--rh-blue)', latency: '700ms', idx: 1 },
  { text: '"Analyze drug interactions and provide treatment plan"', route: 'COMPLEX', model: 'phi3-mini-cpu', params: '3.8B', color: 'var(--rh-purple)', latency: '750ms', idx: 2 },
]

type Stage = 'start' | 'request-visible' | 'routing' | 'classified' | 'model-active' | 'result'

export function RouterAnimation() {
  const [stage, setStage] = useState<Stage>('start')
  const [scenarioIdx, setScenarioIdx] = useState(0)

  const scenario = SCENARIOS[scenarioIdx]

  const advance = () => {
    switch (stage) {
      case 'start':
        setStage('request-visible')
        break
      case 'request-visible':
        setStage('routing')
        break
      case 'routing':
        setStage('classified')
        break
      case 'classified':
        setStage('model-active')
        break
      case 'model-active':
        setStage('result')
        break
      case 'result':
        if (scenarioIdx < SCENARIOS.length - 1) {
          setScenarioIdx(prev => prev + 1)
          setStage('request-visible')
        }
        break
    }
  }

  const stageLabel: Record<Stage, string> = {
    'start': 'Start: Send a request →',
    'request-visible': 'Next: Route through Semantic Router →',
    'routing': 'Next: See classification →',
    'classified': 'Next: Send to model →',
    'model-active': 'Next: See inference result →',
    'result': scenarioIdx < SCENARIOS.length - 1 ? `Next: Try ${SCENARIOS[scenarioIdx + 1].route.toLowerCase()} request →` : '✓ All 3 tiers demonstrated',
  }

  const past = (s: Stage) => {
    const order: Stage[] = ['start', 'request-visible', 'routing', 'classified', 'model-active', 'result']
    return order.indexOf(stage) >= order.indexOf(s)
  }

  return (
    <div style={{ padding: '24px 0' }}>

      {/* REQUEST TEXT */}
      <div style={{ textAlign: 'center', minHeight: 50, marginBottom: 8 }}>
        <AnimatePresence mode="wait">
          {past('request-visible') && (
            <motion.div
              key={`req-${scenarioIdx}`}
              style={{
                display: 'inline-block', padding: '10px 24px', borderRadius: 8,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                fontFamily: "'Red Hat Mono', monospace", fontSize: 13,
              }}
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {scenario.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ARROW: Request → Router */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <motion.div
          style={{ width: 2, height: 32 }}
          animate={{
            background: past('routing') ? 'var(--rh-red)' : 'var(--border)',
          }}
        />
      </div>

      {/* SEMANTIC ROUTER */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <motion.div
          style={{
            padding: '16px 32px', borderRadius: 10, textAlign: 'center',
            minWidth: 280, border: '2px solid var(--border)',
            background: 'var(--surface-1)',
          }}
          animate={{
            borderColor: stage === 'routing' ? 'var(--rh-red)' :
                         past('classified') ? scenario.color : 'var(--border)',
            scale: stage === 'routing' ? [1, 1.02, 1] : 1,
          }}
          transition={{ scale: { repeat: stage === 'routing' ? Infinity : 0, duration: 0.8 } }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--rh-red)' }}>Semantic Router</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Red Hat · Embedding Classification · &lt;1ms</div>

          <AnimatePresence>
            {past('classified') && (
              <motion.div
                key={`badge-${scenarioIdx}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                style={{
                  marginTop: 10, display: 'inline-block',
                  padding: '4px 20px', borderRadius: 6,
                  background: scenario.color, color: '#fff',
                  fontFamily: "'Red Hat Mono', monospace", fontSize: 14, fontWeight: 700,
                }}
              >
                → {scenario.route}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ARROWS: Router → Models (three lines) */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 100 }}>
        {SCENARIOS.map((s, i) => {
          const isTarget = past('model-active') && i === scenarioIdx
          return (
            <div key={s.model} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <motion.div
                style={{ width: 2, height: 32 }}
                animate={{
                  background: isTarget ? s.color : 'var(--border)',
                  opacity: isTarget ? 1 : 0.3,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )
        })}
      </div>

      {/* MODEL BOXES */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
        {SCENARIOS.map((s, i) => {
          const isTarget = past('model-active') && i === scenarioIdx
          const showLatency = past('result') && i === scenarioIdx
          return (
            <motion.div
              key={s.model}
              style={{
                padding: '14px 18px', borderRadius: 10, textAlign: 'center',
                minWidth: 145, border: '2px solid var(--border)',
                background: 'var(--surface-2)',
              }}
              animate={{
                borderColor: isTarget ? s.color : 'var(--border)',
                boxShadow: isTarget ? `0 0 24px ${s.color}25` : '0 0 0 transparent',
                scale: stage === 'model-active' && i === scenarioIdx ? [1, 1.04, 1] : 1,
              }}
              transition={{
                scale: { repeat: stage === 'model-active' && i === scenarioIdx ? Infinity : 0, duration: 1 },
              }}
            >
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: isTarget ? s.color : 'var(--text-dim)',
              }}>
                {s.model}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 2 }}>
                {s.params} · Xeon 6 CPU
              </div>

              <AnimatePresence>
                {showLatency && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    style={{
                      marginTop: 8, fontFamily: "'Red Hat Mono', monospace",
                      fontSize: 18, fontWeight: 700, color: 'var(--intel-cyan)',
                    }}
                  >
                    {s.latency}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* RESULT BADGE */}
      <div style={{ display: 'flex', justifyContent: 'center', minHeight: 50, marginTop: 16 }}>
        <AnimatePresence>
          {stage === 'result' && (
            <motion.div
              key={`result-${scenarioIdx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '8px 24px', borderRadius: 8,
                background: 'var(--rh-green-dim)', border: '1px solid var(--rh-green)',
                fontSize: 13, color: 'var(--rh-green)',
              }}
            >
              ✓ {scenario.route} → {scenario.model} · {scenario.latency} on Xeon 6 · <strong>$0.00</strong>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* STEP BUTTON */}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        {!(stage === 'result' && scenarioIdx === SCENARIOS.length - 1) ? (
          <button className="btn btn-secondary" onClick={advance}>
            {stageLabel[stage]}
          </button>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--rh-green)', fontWeight: 600 }}>
            ✓ Simple → Medium → Complex · All 3 tiers routed on CPU
          </div>
        )}
      </div>
    </div>
  )
}
