import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

const WORKLOADS = [
  { name: 'Legacy Database VM', type: 'VM', cpu: '4 cores', memory: '8Gi', color: 'var(--rh-red)', icon: 'VM' },
  { name: 'Healthcare Agent', type: 'Container', cpu: '1 core', memory: '1Gi', color: 'var(--intel-cyan)', icon: 'Pod' },
  { name: 'FinServ Agent', type: 'Container', cpu: '2 cores', memory: '1.5Gi', color: 'var(--intel-cyan)', icon: 'Pod' },
  { name: 'Orchestrator', type: 'Container', cpu: '0.5 core', memory: '256Mi', color: 'var(--rh-green)', icon: 'Pod' },
  { name: 'MCP Gateway', type: 'Container', cpu: '0.5 core', memory: '256Mi', color: 'var(--rh-teal)', icon: 'Pod' },
]

export function Act02OneServer({ onComplete }: Props) {
  const [revealed, setRevealed] = useState(0)
  const allRevealed = revealed >= WORKLOADS.length

  return (
    <div className="demo-section">
      <h3><span className="section-num">02</span> One Server, Two Worlds</h3>
      <div className="section-context">
        One Intel Xeon 6 node. Click to add each workload and watch the resources
        allocate — a legacy VM and four AI agent containers, side by side.
      </div>

      <div style={{ marginBottom: 24 }}>
        <motion.div style={{
          padding: '16px 24px', borderRadius: 12, border: '2px solid var(--intel-cyan)',
          background: 'var(--intel-cyan-dim)', textAlign: 'center', marginBottom: 16,
        }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--intel-cyan)' }}>Intel Xeon 6 Node</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>128 cores · 512Gi RAM · Intel Xeon 6 Server</div>
        </motion.div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {WORKLOADS.map((w, i) => (
            <AnimatePresence key={w.name}>
              {revealed >= i + 1 && (
                <motion.div
                  style={{
                    padding: '12px 16px', borderRadius: 10, background: 'var(--surface-2)',
                    border: `2px solid ${w.color}`, textAlign: 'center', minWidth: 140, flex: '1 1 140px', maxWidth: 180,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <div style={{
                    fontSize: 9, padding: '1px 8px', borderRadius: 3, display: 'inline-block', marginBottom: 6,
                    background: w.type === 'VM' ? 'var(--rh-red-dim)' : 'var(--intel-cyan-dim)',
                    color: w.type === 'VM' ? 'var(--rh-red)' : 'var(--intel-cyan)',
                    fontWeight: 600,
                  }}>{w.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: w.color }}>{w.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                    {w.cpu} · {w.memory}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
      </div>

      {revealed > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Resource Allocation</div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                <span>CPU</span>
                <span className="mono">{WORKLOADS.slice(0, revealed).reduce((a, w) => a + parseFloat(w.cpu), 0).toFixed(1)} / 128 cores</span>
              </div>
              <div className="cost-track" style={{ height: 12 }}>
                <motion.div className="cost-fill" style={{ background: revealed >= 1 ? 'var(--rh-red)' : 'var(--intel-cyan)', height: '100%' }}
                  animate={{ width: `${(WORKLOADS.slice(0, revealed).reduce((a, w) => a + parseFloat(w.cpu), 0) / 128) * 100}%` }}
                  transition={{ duration: 0.5 }} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                <span>Memory</span>
                <span className="mono">{WORKLOADS.slice(0, revealed).reduce((a, w) => { const v = parseFloat(w.memory); return a + (w.memory.includes('Gi') ? v : v / 1024); }, 0).toFixed(1)}Gi / 512Gi</span>
              </div>
              <div className="cost-track" style={{ height: 12 }}>
                <motion.div className="cost-fill" style={{ background: 'var(--rh-teal)', height: '100%' }}
                  animate={{ width: `${(WORKLOADS.slice(0, revealed).reduce((a, w) => { const v = parseFloat(w.memory); return a + (w.memory.includes('Gi') ? v : v / 1024); }, 0) / 512) * 100}%` }}
                  transition={{ duration: 0.5 }} />
              </div>
            </div>
          </div>
          <motion.div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' }}
            key={revealed} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {revealed === 1 && 'Legacy VM allocated — plenty of headroom for AI agents'}
            {revealed >= 2 && revealed < WORKLOADS.length && `${revealed} workloads on one node — ${((WORKLOADS.slice(0, revealed).reduce((a, w) => a + parseFloat(w.cpu), 0) / 128) * 100).toFixed(0)}% CPU used`}
            {allRevealed && 'All workloads running — VM + 4 AI agents using 6% of available CPU'}
          </motion.div>
        </motion.div>
      )}

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        {!allRevealed ? (
          <button className="btn btn-secondary" onClick={() => setRevealed(prev => prev + 1)}>
            {revealed === 0 ? 'Add the legacy VM →' : `Add ${WORKLOADS[revealed].name} →`}
          </button>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div style={{ fontSize: 13, color: 'var(--rh-green)', fontWeight: 600, marginBottom: 16 }}>
              One server. One VM. Four AI agents. 6% CPU. The other 94% is still available.
            </div>
            <button className="btn btn-primary" onClick={onComplete}>See legacy meet AI →</button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
