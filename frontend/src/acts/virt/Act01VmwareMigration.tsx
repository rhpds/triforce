import { useState } from 'react'
import { motion } from 'motion/react'

interface Props { onComplete?: () => void }

export function Act01VmwareMigration({ onComplete }: Props) {
  const [revealed, setRevealed] = useState(0)
  const totalSteps = 6 // 3 stages × 2 (question + answer)

  const stages = [
    {
      title: 'Before: VMware vSphere',
      question: 'What happens when your VMware license costs 300–1200% more?',
      detail: 'SCADA VMs managed by vSphere across field sites. Per-socket licensing. Separate management plane from your container workloads. No native AI capability.',
      icon: '🏗️',
      color: 'var(--text-dim)',
      stats: [
        { label: 'License', value: '$8,475/socket/yr' },
        { label: 'Management', value: 'vCenter (separate)' },
        { label: 'AI capability', value: 'None' },
      ],
    },
    {
      title: 'Migration: MTV',
      question: 'How do you move 500 VMs without downtime or application changes?',
      detail: 'Migration Toolkit for Virtualization discovers your vSphere VMs, converts disk formats, and migrates them to OpenShift Virtualization. Same VMs, new platform. No application changes.',
      icon: '🔄',
      color: 'var(--intel-cyan)',
      stats: [
        { label: 'Tool', value: 'MTV (included)' },
        { label: 'Downtime', value: 'Warm migration' },
        { label: 'Changes', value: 'Zero app changes' },
      ],
    },
    {
      title: 'After: OpenShift Virtualization',
      question: 'What can you do now that you couldn\'t do on VMware?',
      detail: 'Same SCADA VMs, now managed as Kubernetes resources. Unified platform for VMs + containers + AI. No more per-socket licensing. AI agents can run alongside your VMs on the same hardware.',
      icon: '✅',
      color: 'var(--rh-green)',
      stats: [
        { label: 'License', value: '$0 additional' },
        { label: 'Management', value: 'OpenShift (unified)' },
        { label: 'AI capability', value: 'BitNet on same node' },
      ],
    },
  ]

  return (
    <div className="demo-section">
      <h3><span className="section-num">01</span> VMware to OpenShift Virtualization</h3>
      <div className="section-context">
        The VMware license renewal is the perfect time to add AI capability.
        Click through each challenge — then see the answer.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, margin: '20px 0' }}>
        {stages.map((s, i) => {
          const questionStep = (i * 2) + 1
          const answerStep = (i * 2) + 2
          const showQuestion = revealed >= questionStep
          const showAnswer = revealed >= answerStep
          return showQuestion ? (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ width: '100%', maxWidth: 500 }}
            >
              <div style={{
                fontSize: 15, fontStyle: 'italic', color: 'var(--text-primary)',
                textAlign: 'center', padding: '8px 0', fontWeight: 500,
              }}>
                {s.question}
              </div>
              {showAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: 16, borderRadius: 10, textAlign: 'center',
                    background: 'var(--surface-2)',
                    border: `2px solid ${s.color}`,
                  }}
                >
                  <div style={{ fontSize: 28 }}>{s.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginTop: 8 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.4 }}>{s.detail}</div>
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {s.stats.map(st => (
                      <div key={st.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, maxWidth: 220, margin: '0 auto' }}>
                        <span style={{ color: 'var(--text-dim)' }}>{st.label}</span>
                        <span className="mono" style={{ fontWeight: 600, color: s.color }}>{st.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : null
        })}
      </div>

      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        {revealed < totalSteps ? (
          <button
            className="btn btn-secondary"
            onClick={() => setRevealed(prev => prev + 1)}
            style={{ fontSize: 12 }}
          >
            {revealed === 0
              ? 'Start: The first challenge →'
              : revealed % 2 === 1
              ? `Show the answer: ${stages[Math.floor((revealed - 1) / 2)].title} →`
              : 'Next challenge →'}
          </button>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button className="btn btn-primary" onClick={onComplete} style={{ fontSize: 12 }}>
              Continue to demo →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
