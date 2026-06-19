import { motion } from 'motion/react'

interface Props { onComplete?: () => void }

export function Act06GovernPunchline({ onComplete }: Props) {
  const metrics = [
    { label: 'Agent Registry', value: 'CRDs', detail: 'K8s-native lifecycle', color: 'var(--ibm-blue)' },
    { label: 'Discovery', value: 'A2A', detail: 'Auto-discovered', color: 'var(--rh-green)' },
    { label: 'Identity', value: 'SPIFFE', detail: 'Crypto workload ID', color: 'var(--intel-cyan)' },
    { label: 'Tool Control', value: 'MCP', detail: 'Policy-as-code', color: 'var(--rh-red)' },
    { label: 'Audit', value: 'Full', detail: 'Every AI decision', color: 'var(--rh-green)' },
  ]

  return (
    <div className="demo-section">
      <h3><span className="section-num">06</span> The Punchline</h3>
      <div className="section-context">
        Kubernetes-native agent governance. Every agent registered. Every identity
        verified. Every tool access controlled. Every decision audited.
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 10, margin: '24px 0',
      }}>
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            className="card"
            style={{ borderLeft: `3px solid ${m.color}`, padding: '12px 16px', textAlign: 'center' }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12 }}
          >
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{m.detail}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="card"
        style={{ background: 'var(--surface-2)', borderLeft: '3px solid var(--ibm-blue)', textAlign: 'center' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--ibm-blue)' }}>
            governance.enabled=true
          </strong><br />
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            IBM Kagenti. Kubernetes-native agent governance.
            On Intel Xeon 6. On Red Hat OpenShift.
          </span>
        </p>
      </motion.div>

      {onComplete && (
        <motion.div style={{ textAlign: 'center', marginTop: 32 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
          <button className="btn btn-primary" onClick={onComplete} style={{ background: 'var(--ibm-blue)' }}>
            What's next →
          </button>
        </motion.div>
      )}
    </div>
  )
}
