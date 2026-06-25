import { type ReactNode } from 'react'
import { motion } from 'motion/react'
import { useNavigate, useLocation } from 'react-router-dom'

interface Props {
  title: string
  description: string
  status?: 'live' | 'tested' | 'roadmap' | 'planned'
  children: ReactNode
}

export function ModuleLayout({ title, description, status = 'live', children }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const canGoBack = location.key !== 'default'

  const statusColors = {
    live: 'var(--rh-green)',
    tested: 'var(--rh-orange)',
    roadmap: 'var(--rh-purple)',
    planned: 'var(--text-disabled)',
  }

  return (
    <div className="demo-section" style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>{title}</h2>
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
            padding: '2px 8px', borderRadius: 4,
            background: `${statusColors[status]}20`, color: statusColors[status],
          }}>
            {status}
          </span>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          {description}
        </p>
      </motion.div>

      {children}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <button className="btn btn-secondary" onClick={() => canGoBack ? navigate(-1) : navigate('/')} style={{ fontSize: 13 }}>
          ← Back to Demo
        </button>
      </div>
    </div>
  )
}

export function StepCard({ num, title, children }: { num: number; title: string; children: ReactNode }) {
  return (
    <motion.div
      className="step-card"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: num * 0.1 }}
      style={{ marginBottom: 16 }}
    >
      <span className="step-num">{num}</span>
      <strong>{title}</strong>
      <div style={{ marginTop: 8 }}>{children}</div>
    </motion.div>
  )
}

export function CpuGpuBadge({ hardware }: { hardware: string }) {
  const isGpu = hardware === 'gpu'
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
      background: isGpu ? 'var(--gpu-amber-dim)' : 'var(--intel-cyan-dim)',
      color: isGpu ? 'var(--gpu-amber)' : 'var(--intel-cyan)',
    }}>
      {hardware.toUpperCase()}
    </span>
  )
}
