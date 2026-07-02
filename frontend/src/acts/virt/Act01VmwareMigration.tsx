import { useState } from 'react'
import { motion } from 'motion/react'

interface Props { onComplete?: () => void }

export function Act01VmwareMigration({ onComplete }: Props) {
  const [stage, setStage] = useState(0)

  const stages = [
    {
      title: 'Before: VMware vSphere',
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
        The VMware license renewal conversation is the perfect time to add AI capability.
        Migration Toolkit for Virtualization moves your VMs. OpenShift runs them alongside AI agents.
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '20px 0' }}>
        {stages.map((s, i) => (
          <motion.div
            key={s.title}
            onClick={() => setStage(i)}
            style={{
              flex: '1 1 200px', maxWidth: 280, padding: 16, borderRadius: 10,
              background: stage === i ? 'var(--surface-2)' : 'var(--surface-1)',
              border: `2px solid ${stage === i ? s.color : 'var(--border)'}`,
              cursor: 'pointer', textAlign: 'center',
              transition: 'all 0.2s',
            }}
            whileHover={{ scale: 1.02 }}
          >
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginTop: 8 }}>{s.title}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.4 }}>{s.detail}</div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {s.stats.map(st => (
                <div key={st.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                  <span style={{ color: 'var(--text-dim)' }}>{st.label}</span>
                  <span className="mono" style={{ fontWeight: 600, color: s.color }}>{st.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {stages.map((_, i) => (
            <div
              key={i}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: stage >= i ? stages[i].color : 'var(--border)',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => stage < 2 ? setStage(stage + 1) : onComplete?.()}
          style={{ marginTop: 12, fontSize: 12 }}
        >
          {stage < 2 ? 'Next stage →' : 'Continue to demo →'}
        </button>
      </div>
    </div>
  )
}
