import { useState } from 'react'
import { motion } from 'motion/react'

interface Props { onComplete?: () => void }

const STAGES = [
  {
    id: 'before',
    label: 'Before: VMware vSphere',
    question: '"What happens when your VMware license costs 300-1200% more?"',
    color: 'var(--text-dim)',
    detail: 'SCADA VMs managed by vSphere across field sites. Per-socket licensing. Separate management plane from your container workloads. No native AI capability.',
    icon: '',
    stats: [
      { label: 'License', value: '$8,475/socket/yr' },
      { label: 'Management', value: 'vCenter (separate)' },
      { label: 'AI capability', value: 'None' },
    ],
    render: () => (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: 16, borderRadius: 10, textAlign: 'center',
          background: 'var(--surface-2)',
          border: '2px solid var(--text-dim)',
          maxWidth: 400, margin: '0 auto',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', marginTop: 4 }}>Before: VMware vSphere</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.4 }}>
          SCADA VMs managed by vSphere across field sites. Per-socket licensing. Separate management plane from your container workloads. No native AI capability.
        </div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { label: 'License', value: '$8,475/socket/yr' },
            { label: 'Management', value: 'vCenter (separate)' },
            { label: 'AI capability', value: 'None' },
          ].map(st => (
            <div key={st.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, maxWidth: 220, margin: '0 auto', width: '100%' }}>
              <span style={{ color: 'var(--text-dim)' }}>{st.label}</span>
              <span className="mono" style={{ fontWeight: 600, color: 'var(--text-dim)' }}>{st.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    ),
  },
  {
    id: 'migration',
    label: 'Migration: MTV',
    question: '"How do you move 500 VMs without downtime or application changes?"',
    color: 'var(--intel-cyan)',
    detail: 'Migration Toolkit for Virtualization discovers your vSphere VMs, converts disk formats, and migrates them to OpenShift Virtualization. Same VMs, new platform. No application changes.',
    icon: '',
    stats: [
      { label: 'Tool', value: 'MTV (included)' },
      { label: 'Downtime', value: 'Warm migration' },
      { label: 'Changes', value: 'Zero app changes' },
    ],
    render: () => (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: 16, borderRadius: 10, textAlign: 'center',
          background: 'var(--surface-2)',
          border: '2px solid var(--intel-cyan)',
          maxWidth: 400, margin: '0 auto',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--intel-cyan)', marginTop: 4 }}>Migration: MTV</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.4 }}>
          Migration Toolkit for Virtualization discovers your vSphere VMs, converts disk formats, and migrates them to OpenShift Virtualization. Same VMs, new platform. No application changes.
        </div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { label: 'Tool', value: 'MTV (included)' },
            { label: 'Downtime', value: 'Warm migration' },
            { label: 'Changes', value: 'Zero app changes' },
          ].map(st => (
            <div key={st.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, maxWidth: 220, margin: '0 auto', width: '100%' }}>
              <span style={{ color: 'var(--text-dim)' }}>{st.label}</span>
              <span className="mono" style={{ fontWeight: 600, color: 'var(--intel-cyan)' }}>{st.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    ),
  },
  {
    id: 'after',
    label: 'After: OpenShift Virtualization',
    question: '"What can you do now that you couldn\'t do on VMware?"',
    color: 'var(--rh-green)',
    detail: 'Same SCADA VMs, now managed as Kubernetes resources. Unified platform for VMs + containers + AI. No more per-socket licensing. AI agents can run alongside your VMs on the same hardware.',
    icon: '',
    stats: [
      { label: 'License', value: '$0 additional' },
      { label: 'Management', value: 'OpenShift (unified)' },
      { label: 'AI capability', value: 'BitNet on same node' },
    ],
    render: () => (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: 16, borderRadius: 10, textAlign: 'center',
          background: 'var(--surface-2)',
          border: '2px solid var(--rh-green)',
          maxWidth: 400, margin: '0 auto',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--rh-green)', marginTop: 4 }}>After: OpenShift Virtualization</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.4 }}>
          Same SCADA VMs, now managed as Kubernetes resources. Unified platform for VMs + containers + AI. No more per-socket licensing. AI agents can run alongside your VMs on the same hardware.
        </div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { label: 'License', value: '$0 additional' },
            { label: 'Management', value: 'OpenShift (unified)' },
            { label: 'AI capability', value: 'BitNet on same node' },
          ].map(st => (
            <div key={st.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, maxWidth: 220, margin: '0 auto', width: '100%' }}>
              <span style={{ color: 'var(--text-dim)' }}>{st.label}</span>
              <span className="mono" style={{ fontWeight: 600, color: 'var(--rh-green)' }}>{st.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    ),
  },
]

export function Act01VmwareMigration({ onComplete }: Props) {
  const [revealed, setRevealed] = useState(0)

  const totalSteps = STAGES.length * 2

  const advance = () => {
    if (revealed < totalSteps) setRevealed(prev => prev + 1)
  }

  const allRevealed = revealed >= totalSteps

  return (
    <div className="demo-section">
      <h3><span className="section-num">01</span> VMware to OpenShift Virtualization</h3>
      <div className="section-context">
        The VMware license renewal is the perfect time to add AI capability.
        Click through each challenge — then see the answer.
      </div>

      <div className={revealed > 0 ? 'arch-diagram' : ''}>
        {/* Completed stages — collapsed to badges */}
        {revealed > 0 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            {STAGES.map((stage, i) => {
              const answerStep = (i * 2) + 2
              if (revealed < answerStep) return null
              const isCurrent = revealed === answerStep
              if (isCurrent) return null
              return (
                <div key={stage.id} style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: 'var(--surface-2)', border: `1px solid ${stage.color}`,
                  color: stage.color, opacity: 0.7,
                }}>
                  ✓ {stage.label}
                </div>
              )
            })}
          </div>
        )}

        {/* Current stage — question and/or answer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          {STAGES.map((stage, i) => {
            const questionStep = (i * 2) + 1
            const answerStep = (i * 2) + 2
            const isCurrentQuestion = revealed === questionStep
            const isCurrentAnswer = revealed === answerStep
            const isCurrent = isCurrentQuestion || isCurrentAnswer
            if (!isCurrent) return null
            return (
              <motion.div
                key={stage.id}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  style={{
                    fontSize: 17, fontStyle: 'italic', color: 'var(--text-primary)',
                    textAlign: 'center', maxWidth: 520, padding: '12px 0 8px',
                    fontWeight: 500,
                  }}
                >
                  {stage.question}
                </motion.div>

                {isCurrentAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  >
                    <div style={{ marginBottom: 4 }}>
                      {stage.render()}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        {!allRevealed ? (
          <button className="btn btn-secondary" onClick={advance}>
            {revealed === 0
              ? 'Start: The first challenge →'
              : revealed % 2 === 1
              ? `Show the answer: ${STAGES[Math.floor((revealed - 1) / 2)].label} →`
              : revealed < STAGES.length * 2
              ? 'Next challenge →'
              : ''}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button className="btn btn-primary" onClick={onComplete}>
              Continue to demo →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
