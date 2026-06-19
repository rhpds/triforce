import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

const STAGES = [
  { label: 'Today', title: 'VMs Running Legacy Workloads', detail: 'Databases, middleware, and enterprise apps running on traditional VMs. Managed infrastructure. Proven. Stable.', color: 'var(--rh-red)', workloads: ['VM', 'VM', 'VM'] },
  { label: 'Add AI', title: 'Deploy AI Agents Alongside', detail: 'Add AI agents as containers on the same Xeon 6 nodes. No new hardware. No separate cluster. The VM workloads don\'t move.', color: 'var(--intel-cyan)', workloads: ['VM', 'VM', 'VM', 'AI', 'AI'] },
  { label: 'Connect', title: 'VMs Consume AI Services', detail: 'Legacy VMs call AI agents via Kubernetes Service DNS. The database VM classifies documents. The middleware VM scores transactions. No API gateway required.', color: 'var(--rh-green)', workloads: ['VM→AI', 'VM→AI', 'VM', 'AI', 'AI'] },
  { label: 'Gradually', title: 'Containerize When Ready', detail: 'At your own pace, containerize services that make sense. The middleware VM becomes a container. The database stays as a VM. No deadline. No pressure.', color: 'var(--rh-teal)', workloads: ['VM', 'Pod', 'AI', 'AI', 'AI'] },
  { label: 'Eventually', title: 'Full Cloud-Native', detail: 'When you\'re ready — maybe years from now — everything is containers. But AI didn\'t wait. It started working on day one, alongside your VMs.', color: 'var(--rh-green)', workloads: ['Pod', 'Pod', 'AI', 'AI', 'AI'] },
]

export function Act04MigrationPath({ onComplete }: Props) {
  const [revealed, setRevealed] = useState(0)
  const allRevealed = revealed >= STAGES.length

  return (
    <div className="demo-section">
      <h3><span className="section-num">04</span> The Migration Path</h3>
      <div className="section-context">
        Not a forklift. A gradual transition. AI starts working alongside your
        VMs today — containerization happens at your own pace.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {STAGES.map((stage, i) => (
          <AnimatePresence key={stage.label}>
            {revealed >= i + 1 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {i > 0 && <motion.div style={{ width: 2, height: 16, background: stage.color, margin: '0 auto' }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.3 }} />}
                <div className="step-card" style={{ borderLeft: `3px solid ${stage.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: stage.color, textTransform: 'uppercase',
                      padding: '2px 10px', borderRadius: 4, background: `color-mix(in srgb, ${stage.color} 12%, transparent)`,
                      border: `1px solid ${stage.color}`,
                    }}>{stage.label}</span>
                    <strong>{stage.title}</strong>
                  </div>

                  <motion.div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                    {stage.workloads.map((w, j) => (
                      <motion.div key={j} style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                        background: w.includes('VM') ? 'var(--rh-red-dim)' : w === 'AI' ? 'var(--intel-cyan-dim)' : 'var(--rh-green-dim)',
                        color: w.includes('VM') ? 'var(--rh-red)' : w === 'AI' ? 'var(--intel-cyan)' : 'var(--rh-green)',
                        border: `1px solid ${w.includes('VM') ? 'var(--rh-red)' : w === 'AI' ? 'var(--intel-cyan)' : 'var(--rh-green)'}`,
                      }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + j * 0.06 }}>
                        {w}
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7 }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    {stage.detail}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        {!allRevealed ? (
          <button className="btn btn-secondary" onClick={() => setRevealed(prev => prev + 1)}>
            {revealed === 0 ? `Start: ${STAGES[0].label} →` : `Next: ${STAGES[revealed].label} →`}
          </button>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div style={{ fontSize: 13, color: 'var(--rh-green)', fontWeight: 600, marginBottom: 16 }}>
              AI doesn't wait for migration to finish. It starts alongside your VMs today.
            </div>
            <button className="btn btn-primary" onClick={onComplete}>The honest tradeoff →</button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
