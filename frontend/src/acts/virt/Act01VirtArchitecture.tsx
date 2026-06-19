import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

const LAYERS = [
  {
    id: 'hardware',
    label: 'Intel Xeon 6',
    position: 'Hardware',
    question: '"Can one server really run both VMs and AI?"',
    color: 'var(--intel-cyan)',
    detail: 'Intel Xeon 6 with 128 cores and AMX acceleration. The same CPU handles VM workloads (database queries, middleware) and AI inference (classification, NER, summarization) simultaneously. No separate GPU server needed.',
    visual: () => (
      <div style={{ textAlign: 'center' }}>
        <motion.div style={{
          display: 'inline-block', padding: '14px 28px', borderRadius: 10,
          border: '2px solid var(--intel-cyan)', background: 'var(--intel-cyan-dim)',
        }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--intel-cyan)' }}>Intel Xeon 6</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <motion.div style={{ padding: '4px 10px', borderRadius: 4, background: 'var(--surface-2)', border: '1px solid var(--rh-red)', fontSize: 10, color: 'var(--rh-red)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>VM workloads</motion.div>
            <motion.div style={{ padding: '4px 10px', borderRadius: 4, background: 'var(--surface-2)', border: '1px solid var(--intel-cyan)', fontSize: 10, color: 'var(--intel-cyan)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>AI inference</motion.div>
            <motion.div style={{ padding: '4px 10px', borderRadius: 4, background: 'var(--surface-2)', border: '1px solid var(--rh-green)', fontSize: 10, color: 'var(--rh-green)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>AMX acceleration</motion.div>
          </div>
        </motion.div>
      </div>
    ),
  },
  {
    id: 'platform',
    label: 'OpenShift Virtualization',
    position: 'Platform',
    question: '"How do VMs become Kubernetes resources?"',
    color: 'var(--rh-red)',
    detail: 'KubeVirt turns VMs into first-class Kubernetes objects. A VirtualMachine is a CRD — it gets scheduled, health-checked, and managed like any other pod. Your existing RHEL VMs run inside lightweight QEMU processes managed by the kubelet. Same scheduler. Same networking. Same storage.',
    visual: () => (
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { label: 'VirtualMachine', sub: 'kubevirt.io/v1 CRD', type: 'VM' },
          { label: 'Deployment', sub: 'apps/v1', type: 'Container' },
          { label: 'Service', sub: 'v1 networking', type: 'Both' },
        ].map((item, i) => (
          <motion.div key={item.label} style={{
            padding: '10px 16px', borderRadius: 8, background: 'var(--surface-2)',
            border: `1px solid ${item.type === 'VM' ? 'var(--rh-red)' : item.type === 'Container' ? 'var(--intel-cyan)' : 'var(--rh-green)'}`,
            textAlign: 'center', minWidth: 140,
          }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: item.type === 'VM' ? 'var(--rh-red)' : item.type === 'Container' ? 'var(--intel-cyan)' : 'var(--rh-green)' }}>{item.label}</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{item.sub}</div>
            <div style={{ fontSize: 9, color: 'var(--text-disabled)', marginTop: 2 }}>{item.type}</div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: 'networking',
    label: 'Kubernetes Networking',
    position: 'Network',
    question: '"How does a legacy VM talk to an AI agent?"',
    color: 'var(--rh-green)',
    detail: 'Standard Kubernetes Service DNS. The VM calls healthcare-agent.triforce.svc:8081 — the same way any pod would. No API gateway. No bridge network. No re-architecture. The VM is inside the cluster network because it IS a Kubernetes resource.',
    visual: () => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
        <motion.div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--rh-red)', textAlign: 'center' }}
          initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--rh-red)' }}>Legacy VM</div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--text-dim)' }}>RHEL 9 · database</div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <svg width="50" height="16" viewBox="0 0 50 16">
            <motion.line x1="0" y1="8" x2="38" y2="8" stroke="var(--rh-green)" strokeWidth="2"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 0.4 }} />
            <polygon points="36,4 44,8 36,12" fill="var(--rh-green)" />
          </svg>
        </motion.div>
        <motion.div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--rh-green)', textAlign: 'center' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--rh-green)' }}>K8s Service</div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--text-dim)' }}>ClusterIP</div>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <svg width="50" height="16" viewBox="0 0 50 16">
            <motion.line x1="0" y1="8" x2="38" y2="8" stroke="var(--rh-green)" strokeWidth="2"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.7, duration: 0.4 }} />
            <polygon points="36,4 44,8 36,12" fill="var(--rh-green)" />
          </svg>
        </motion.div>
        <motion.div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--intel-cyan)', textAlign: 'center' }}
          initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--intel-cyan)' }}>Healthcare Agent</div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--text-dim)' }}>Python · LangGraph</div>
        </motion.div>
      </div>
    ),
  },
  {
    id: 'deploy',
    label: 'One Helm Chart',
    position: 'Deploy',
    question: '"How do I deploy both?"',
    color: 'var(--rh-green)',
    detail: 'One command. The same Helm chart that deploys the AI agents also deploys the legacy VM when virtualization.enabled=true. One release. One namespace. One management plane. The VM and the agents are peers in the same deployment.',
    visual: () => (
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-block', padding: '12px 20px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', fontFamily: "'Red Hat Mono', monospace", fontSize: 12, textAlign: 'left' }}>
          <div style={{ color: 'var(--text-dim)' }}>helm install triforce ./helm \</div>
          <motion.div style={{ display: 'inline-block', background: 'var(--rh-green-dim)', padding: '1px 6px', borderRadius: 3 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <span style={{ color: 'var(--rh-green)', fontWeight: 700 }}>  --set virtualization.enabled=true</span>
          </motion.div>
        </div>
        <motion.div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          AI agents + legacy VM + networking — one release
        </motion.div>
      </div>
    ),
  },
]

export function Act01VirtArchitecture({ onComplete }: Props) {
  const [revealed, setRevealed] = useState(0)
  const allRevealed = revealed >= LAYERS.length

  return (
    <div className="demo-section">
      <h3><span className="section-num">01</span> The Coexistence Stack</h3>
      <div className="section-context">
        Four layers that make VMs and AI coexist on the same hardware.
        Click through each one — from the CPU to the deployment.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {LAYERS.map((layer, i) => (
          <AnimatePresence key={layer.id}>
            {revealed >= i + 1 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {i > 0 && <motion.div style={{ width: 2, height: 20, background: layer.color, margin: '0 auto' }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.3 }} />}
                <div className="step-card" style={{ borderLeft: `3px solid ${layer.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span className="step-num" style={{ background: layer.color, fontSize: 11 }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <strong>{layer.label}</strong>
                      <span style={{ fontSize: 10, marginLeft: 8, padding: '1px 8px', borderRadius: 4, background: 'var(--surface-2)', color: 'var(--text-disabled)', border: '1px solid var(--border)' }}>{layer.position}</span>
                    </div>
                  </div>
                  <motion.div style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: 10, fontWeight: 500 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>{layer.question}</motion.div>
                  <motion.div style={{ marginBottom: 12 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>{layer.visual()}</motion.div>
                  <motion.div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7 }} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>{layer.detail}</motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        {!allRevealed ? (
          <button className="btn btn-secondary" onClick={() => setRevealed(prev => prev + 1)}>
            {revealed === 0 ? `Start: ${LAYERS[0].label} →` : `Next: ${LAYERS[revealed].label} →`}
          </button>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div style={{ fontSize: 13, color: 'var(--rh-green)', fontWeight: 600, marginBottom: 16 }}>Hardware → Platform → Network → Deploy — VMs and AI on one stack</div>
            <button className="btn btn-primary" onClick={onComplete}>See one server, two worlds →</button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
