import { motion } from 'motion/react'

export type NodeStatus = 'pending' | 'active' | 'done' | 'skipped'

export interface PipelineNode {
  id: string
  label: string
  model?: string
  detail?: string
  status: NodeStatus
  latencyMs?: number
  conditional?: boolean
}

interface Props {
  nodes: PipelineNode[]
}

const STATUS_STYLES: Record<NodeStatus, { border: string; bg: string; labelColor: string }> = {
  pending: { border: 'var(--border)', bg: 'var(--surface-2)', labelColor: 'var(--text-disabled)' },
  active: { border: 'var(--intel-cyan)', bg: 'var(--surface-2)', labelColor: 'var(--intel-cyan)' },
  done: { border: 'var(--rh-green)', bg: 'var(--rh-green-dim)', labelColor: 'var(--rh-green)' },
  skipped: { border: 'var(--text-disabled)', bg: 'var(--surface-2)', labelColor: 'var(--text-disabled)' },
}

export function PipelineAnimation({ nodes }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap', padding: '16px 0' }}>
      {nodes.map((node, i) => {
        const style = STATUS_STYLES[node.status]
        return (
          <div key={node.id} style={{ display: 'flex', alignItems: 'center' }}>
            <motion.div
              style={{
                minWidth: 150,
                padding: '14px 18px',
                borderRadius: 10,
                border: `2px solid ${style.border}`,
                background: style.bg,
                textAlign: 'center',
                position: 'relative',
              }}
              animate={{
                borderColor: style.border,
                background: style.bg,
                scale: node.status === 'active' ? [1, 1.03, 1] : 1,
                boxShadow: node.status === 'active'
                  ? '0 0 20px rgba(0, 174, 239, 0.25)'
                  : '0 0 0 transparent',
              }}
              transition={{
                scale: { repeat: node.status === 'active' ? Infinity : 0, duration: 0.8 },
                borderColor: { duration: 0.3 },
                background: { duration: 0.3 },
              }}
            >
              {node.conditional && (
                <div style={{
                  position: 'absolute', top: -10, right: -10,
                  padding: '2px 8px', borderRadius: 4, fontSize: 9,
                  background: 'var(--rh-orange-dim)', color: 'var(--rh-orange)',
                  border: '1px solid var(--rh-orange)', fontWeight: 600,
                }}>
                  CONDITIONAL
                </div>
              )}

              <div style={{ fontSize: 13, fontWeight: 600, color: style.labelColor }}>
                {node.label}
              </div>

              {node.model && (
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                  {node.model}
                </div>
              )}

              {node.detail && (
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, fontStyle: 'italic' }}>
                  {node.detail}
                </div>
              )}

              {node.status === 'active' && (
                <motion.div
                  style={{ marginTop: 8, fontSize: 12, color: 'var(--intel-cyan)' }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                >
                  processing...
                </motion.div>
              )}

              {node.status === 'done' && node.latencyMs !== undefined && (
                <motion.div
                  className="pipe-node-latency"
                  style={{ marginTop: 6, fontSize: 16 }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {node.latencyMs}ms
                </motion.div>
              )}

              {node.status === 'skipped' && (
                <motion.div
                  style={{ marginTop: 6, fontSize: 11, color: 'var(--text-disabled)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  skipped
                </motion.div>
              )}
            </motion.div>

            {i < nodes.length - 1 && (
              <motion.div
                style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}
                animate={{
                  color: node.status === 'done' ? 'var(--rh-green)' : 'var(--text-disabled)',
                }}
              >
                <svg width="32" height="16" viewBox="0 0 32 16">
                  <motion.line
                    x1="0" y1="8" x2="24" y2="8"
                    stroke="currentColor" strokeWidth="2"
                    animate={{
                      stroke: node.status === 'done' ? 'var(--rh-green)' : 'var(--border)',
                    }}
                  />
                  <motion.polygon
                    points="22,4 30,8 22,12"
                    fill="currentColor"
                    animate={{
                      fill: node.status === 'done' ? 'var(--rh-green)' : 'var(--border)',
                    }}
                  />
                </svg>
              </motion.div>
            )}
          </div>
        )
      })}
    </div>
  )
}
