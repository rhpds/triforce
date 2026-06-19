import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

const LAYERS = [
  {
    id: 'vulnerability',
    label: 'The Vulnerability',
    question: '"During inference, patient data is in memory — unencrypted."',
    detail: 'When an LLM processes a clinical record, the text sits in RAM. Any process with root access, any hypervisor, any memory dump can read it. This is true for every AI workload running on standard containers today.',
    color: 'var(--rh-red)',
    visual: () => (
      <motion.div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {['Patient PHI', 'API Keys', 'Model Weights', 'Clinical Notes'].map((item, i) => (
          <motion.div key={item} style={{
            padding: '8px 16px', borderRadius: 8, background: 'var(--rh-red-dim)',
            border: '1px solid var(--rh-red)', fontSize: 12, color: 'var(--rh-red)',
          }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            {item} <span style={{ opacity: 0.5 }}>← visible</span>
          </motion.div>
        ))}
      </motion.div>
    ),
  },
  {
    id: 'tdx',
    label: 'Intel TDX Trust Domain',
    question: '"Hardware-enforced encryption. The CPU protects the memory."',
    detail: 'Intel Trust Domain Extensions (TDX) create an isolated execution environment — a Trust Domain. The CPU encrypts all memory belonging to the TD using hardware keys that no software can access. Not the OS, not the hypervisor, not the cluster admin.',
    color: 'var(--intel-cyan)',
    visual: () => (
      <motion.div style={{ textAlign: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ display: 'inline-block', padding: '20px 32px', borderRadius: 12, border: '2px solid var(--intel-cyan)', background: 'var(--intel-cyan-dim)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--intel-cyan)', marginBottom: 8 }}>Trust Domain</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Patient PHI', 'API Keys', 'Model Weights'].map((item, i) => (
              <motion.div key={item} style={{
                padding: '6px 12px', borderRadius: 6, background: 'var(--surface-2)',
                border: '1px solid var(--rh-green)', fontSize: 11, color: 'var(--rh-green)',
              }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }}>
                {item} <span style={{ opacity: 0.6 }}>encrypted</span>
              </motion.div>
            ))}
          </div>
        </div>
        <motion.div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          Hardware key in silicon — no software can read it
        </motion.div>
      </motion.div>
    ),
  },
  {
    id: 'coco',
    label: 'Confidential Containers',
    question: '"One line in the YAML. Same container. Same code."',
    detail: 'Red Hat OpenShift Sandboxed Containers runs your existing container image inside a Kata VM with TDX enabled. The only change: runtimeClassName: kata-cc. No code changes. No re-architecture. No new container images.',
    color: 'var(--rh-red)',
    visual: () => (
      <motion.div style={{ textAlign: 'center' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', fontFamily: "'Red Hat Mono', monospace", fontSize: 13, textAlign: 'left' }}>
          <div style={{ color: 'var(--text-dim)' }}>spec:</div>
          <div style={{ color: 'var(--text-dim)' }}>{'  '}template:</div>
          <div style={{ color: 'var(--text-dim)' }}>{'    '}spec:</div>
          <motion.div style={{ background: 'var(--rh-green-dim)', padding: '2px 8px', borderRadius: 4, margin: '2px 0', display: 'inline-block' }}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
            <span style={{ color: 'var(--rh-green)', fontWeight: 700 }}>{'      '}runtimeClassName: kata-cc</span>
          </motion.div>
        </div>
      </motion.div>
    ),
  },
  {
    id: 'attestation',
    label: 'Trustee Attestation',
    question: '"No TDX verification = no secrets released."',
    detail: 'The Trustee Key Broker Service (KBS) holds your API keys and model credentials. Before releasing them, it verifies the pod is running inside a genuine TDX Trust Domain. If attestation fails — if someone tries to run the workload without TDX — secrets are denied. The AI agent can\'t start without hardware proof.',
    color: 'var(--ibm-blue)',
    visual: () => (
      <motion.div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {[
          { label: 'Pod starts', color: 'var(--border)' },
          { label: 'TDX verified', color: 'var(--intel-cyan)' },
          { label: 'Secrets released', color: 'var(--rh-green)' },
        ].map((step, i) => (
          <motion.div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.3 }}>
            <div style={{
              padding: '8px 16px', borderRadius: 8, background: 'var(--surface-2)',
              border: `1px solid ${step.color}`, fontSize: 12, color: step.color,
            }}>
              {step.label}
            </div>
            {i < 2 && <span style={{ color: 'var(--text-disabled)' }}>→</span>}
          </motion.div>
        ))}
      </motion.div>
    ),
  },
]

export function Act01TdxArchitecture({ onComplete }: Props) {
  const [revealed, setRevealed] = useState(0)

  const advance = () => {
    if (revealed < LAYERS.length) setRevealed(prev => prev + 1)
  }

  const allRevealed = revealed >= LAYERS.length

  return (
    <div className="demo-section">
      <h3><span className="section-num">01</span> How TDX Protects Your AI</h3>
      <div className="section-context">
        Four layers of protection. Click through each one — from the vulnerability
        to the hardware solution.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {LAYERS.map((layer, i) => (
          <AnimatePresence key={layer.id}>
            {revealed >= i + 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {i > 0 && (
                  <motion.div style={{ width: 2, height: 20, background: layer.color, margin: '0 auto' }}
                    initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.3 }} />
                )}

                <div className="step-card" style={{ borderLeft: `3px solid ${layer.color}` }}>
                  <motion.div style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: 8, fontWeight: 500 }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                    {layer.question}
                  </motion.div>

                  <motion.div style={{ marginBottom: 16 }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    {layer.visual()}
                  </motion.div>

                  <motion.div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7 }}
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    {layer.detail}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        {!allRevealed ? (
          <button className="btn btn-secondary" onClick={advance}>
            {revealed === 0 ? `Start: ${LAYERS[0].label} →` : `Next: ${LAYERS[revealed].label} →`}
          </button>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <button className="btn btn-primary" onClick={onComplete}>
              See the attestation flow →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
