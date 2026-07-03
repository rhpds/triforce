import { useState } from 'react'
import { motion } from 'motion/react'

interface Props { onComplete?: () => void }

const LAYERS = [
  {
    id: 'hardware',
    label: 'Intel Xeon 6 + TDX',
    position: 'Hardware',
    question: '"How do I encrypt data during AI inference — not just at rest?"',
    color: 'var(--intel-cyan)',
    detail: 'Intel TDX is built into the Xeon 6 CPU. It creates Trust Domains — hardware-isolated execution environments with AES-256 memory encryption. The encryption keys live in silicon. No software, no firmware, no hypervisor can read them.',
    visual: () => (
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Xeon 6 CPU', sub: '128 cores · AMX', color: 'var(--intel-cyan)' },
            { label: 'TDX Engine', sub: 'Trust Domain Extensions', color: 'var(--intel-cyan)' },
            { label: 'AES-256 Keys', sub: 'Hardware-bound · per-TD', color: 'var(--rh-green)' },
          ].map((item, i) => (
            <motion.div key={item.label} style={{
              padding: '10px 16px', borderRadius: 8, background: 'var(--surface-2)',
              border: `1px solid ${item.color}`, textAlign: 'center', minWidth: 130,
            }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.label}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{item.sub}</div>
            </motion.div>
          ))}
        </div>
        <motion.div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          Supermicro SYS-222H-TN · TDX enabled in BIOS · same servers running standard workloads
        </motion.div>
      </div>
    ),
  },
  {
    id: 'runtime',
    label: 'Kata VM + Trust Domain',
    position: 'Runtime',
    question: '"How do I run AI workloads in hardware-isolated VMs without changing my code?"',
    color: 'var(--rh-red)',
    detail: 'Red Hat OpenShift Sandboxed Containers uses Kata Containers to run each pod inside a lightweight VM. When TDX is available, that VM boots inside a Trust Domain — the CPU encrypts all its memory automatically. Your container image runs unchanged inside.',
    visual: () => (
      <div style={{ textAlign: 'center' }}>
        <motion.div style={{
          display: 'inline-block', padding: '16px 24px', borderRadius: 12,
          border: '2px solid var(--intel-cyan)', background: 'var(--intel-cyan-dim)',
        }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--intel-cyan)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Trust Domain (encrypted boundary)
          </div>
          <motion.div style={{
            padding: '12px 20px', borderRadius: 8, border: '1px solid var(--rh-red)',
            background: 'var(--surface-2)', display: 'inline-block',
          }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--rh-red)' }}>Kata VM</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {['Healthcare Agent', 'granite-2b-cpu', 'Patient PHI'].map((item, i) => (
                <motion.div key={item} style={{
                  padding: '4px 8px', borderRadius: 4, background: 'var(--surface-1)',
                  border: '1px solid var(--rh-green)', fontSize: 10, color: 'var(--rh-green)',
                }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }}>
                  {item}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
        <motion.div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          Everything inside the blue border is hardware-encrypted · nothing outside can read it
        </motion.div>
      </div>
    ),
  },
  {
    id: 'trustee',
    label: 'Trustee Operator on OpenShift',
    position: 'Platform',
    question: '"How do I verify the hardware is genuine before releasing secrets?"',
    color: 'var(--ibm-blue)',
    detail: 'The Trustee operator runs on OpenShift and manages three components: the Key Broker Service (KBS) holds secrets, the Attestation Service (AS) verifies hardware state, and the Reference Value Provider (RVPS) stores known-good measurements. Before releasing an API key, Trustee verifies the pod is inside a genuine TDX Trust Domain.',
    visual: () => (
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { name: 'Key Broker Service', sub: 'Holds API keys + secrets', abbr: 'KBS' },
            { name: 'Attestation Service', sub: 'Verifies TDX hardware state', abbr: 'AS' },
            { name: 'Reference Values', sub: 'Known-good measurements', abbr: 'RVPS' },
          ].map((svc, i) => (
            <motion.div key={svc.abbr} style={{
              padding: '10px 14px', borderRadius: 8, background: 'var(--surface-2)',
              border: '1px solid var(--ibm-blue)', textAlign: 'center', minWidth: 140,
            }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ibm-blue)' }}>{svc.abbr}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{svc.name}</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{svc.sub}</div>
            </motion.div>
          ))}
        </div>
        <motion.div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 10 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>Trustee Operator</span>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--rh-red-dim)', border: '1px solid var(--rh-red)', color: 'var(--rh-red)' }}>
            OpenShift
          </span>
        </motion.div>
      </div>
    ),
  },
  {
    id: 'deploy',
    label: 'One Line Deployment',
    position: 'Deploy',
    question: '"How do I enable confidential computing without rewriting my application?"',
    color: 'var(--rh-green)',
    detail: 'One line: runtimeClassName: kata-cc. That\'s the entire difference. Same container image, same application code, same AI model. The Helm chart toggles it with confidential.enabled=true. OpenShift schedules the pod on a TDX-capable node, boots it inside a Kata VM, and the CPU encrypts everything.',
    visual: () => (
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        <motion.div style={{ flex: '1 1 200px', maxWidth: 260 }}
          initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 4 }}>Standard</div>
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--surface-1)', border: '1px solid var(--border)', fontFamily: "'Red Hat Mono', monospace", fontSize: 11, lineHeight: 1.7 }}>
            <div style={{ color: 'var(--text-dim)' }}>containers:</div>
            <div style={{ color: 'var(--text-dim)' }}>{'  '}- name: agent</div>
            <div style={{ color: 'var(--text-dim)' }}>{'    '}image: triforce/healthcare</div>
          </div>
        </motion.div>
        <motion.div style={{ flex: '1 1 200px', maxWidth: 260 }}
          initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div style={{ fontSize: 11, color: 'var(--intel-cyan)', textAlign: 'center', marginBottom: 4 }}>Confidential</div>
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--surface-1)', border: '2px solid var(--intel-cyan)', fontFamily: "'Red Hat Mono', monospace", fontSize: 11, lineHeight: 1.7 }}>
            <motion.div style={{ background: 'var(--rh-green-dim)', padding: '1px 6px', borderRadius: 3, display: 'inline-block' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <span style={{ color: 'var(--rh-green)', fontWeight: 700 }}>runtimeClassName: kata-cc</span>
            </motion.div>
            <div style={{ color: 'var(--text-dim)' }}>containers:</div>
            <div style={{ color: 'var(--text-dim)' }}>{'  '}- name: agent</div>
            <div style={{ color: 'var(--text-dim)' }}>{'    '}image: triforce/healthcare</div>
          </div>
        </motion.div>
      </div>
    ),
  },
  {
    id: 'application',
    label: 'Same Agent, Same Code',
    position: 'Application',
    question: '"How does my AI agent get secrets only after hardware attestation?"',
    color: 'var(--rh-green)',
    detail: 'Nothing. The healthcare agent, the LangGraph pipeline, the MCP tools, the models — all identical. The attestation module (attestation.py) automatically detects TDX and fetches secrets from Trustee KBS instead of environment variables. If TDX isn\'t present, it falls back. Zero code changes for the application developer.',
    visual: () => (
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Healthcare Agent', detail: 'Python · LangGraph', changed: false },
            { label: 'Attestation Module', detail: 'auto-detects TDX', changed: true },
            { label: 'MCP Tools', detail: 'drug data · FHIR', changed: false },
            { label: 'granite-2b-cpu', detail: 'same model', changed: false },
          ].map((item, i) => (
            <motion.div key={item.label} style={{
              padding: '8px 14px', borderRadius: 8, background: 'var(--surface-2)',
              border: `1px solid ${item.changed ? 'var(--intel-cyan)' : 'var(--rh-green)'}`,
              textAlign: 'center', minWidth: 120,
            }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: item.changed ? 'var(--intel-cyan)' : 'var(--rh-green)' }}>{item.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{item.detail}</div>
              <div style={{
                fontSize: 9, marginTop: 4, padding: '1px 6px', borderRadius: 3, display: 'inline-block',
                background: item.changed ? 'var(--intel-cyan-dim)' : 'var(--rh-green-dim)',
                color: item.changed ? 'var(--intel-cyan)' : 'var(--rh-green)',
              }}>
                {item.changed ? 'AUTO-DETECTS' : 'UNCHANGED'}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
]

export function Act01TdxArchitecture({ onComplete }: Props) {
  const [revealed, setRevealed] = useState(0)

  const totalSteps = LAYERS.length * 2

  const advance = () => {
    if (revealed < totalSteps) setRevealed(prev => prev + 1)
  }

  const allRevealed = revealed >= totalSteps

  return (
    <div className="demo-section">
      <h3><span className="section-num">01</span> The Security Stack</h3>
      <div className="section-context">
        Five layers, from silicon to application. Click to see the challenge —
        then click again to see the platform answer.
      </div>

      <div className={revealed > 0 ? 'arch-diagram' : ''}>
        {/* Completed layers — collapsed to badges */}
        {revealed > 0 && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            {LAYERS.map((layer, i) => {
              const answerStep = (i * 2) + 2
              if (revealed < answerStep) return null
              const isCurrent = revealed === answerStep
              if (isCurrent) return null
              return (
                <div key={layer.id} style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: 'var(--surface-2)', border: `1px solid ${layer.color}`,
                  color: layer.color, opacity: 0.7,
                }}>
                  ✓ {layer.label}
                </div>
              )
            })}
          </div>
        )}

        {/* Current layer — question and/or answer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          {LAYERS.map((layer, i) => {
            const questionStep = (i * 2) + 1
            const answerStep = (i * 2) + 2
            const isCurrentQuestion = revealed === questionStep
            const isCurrentAnswer = revealed === answerStep
            const isCurrent = isCurrentQuestion || isCurrentAnswer
            if (!isCurrent) return null
            return (
              <motion.div
                key={layer.id}
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
                  {layer.question}
                </motion.div>

                {isCurrentAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  >
                    <div style={{ marginBottom: 4 }}>
                      {layer.visual()}
                    </div>

                    <motion.div
                      style={{
                        fontSize: 13, color: 'var(--text-dim)', maxWidth: 520,
                        textAlign: 'center', padding: '4px 0 16px', lineHeight: 1.6,
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15 }}
                    >
                      {layer.detail}
                    </motion.div>
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
              ? `Show the answer: ${LAYERS[Math.floor((revealed - 1) / 2)].label} →`
              : revealed < LAYERS.length * 2
              ? 'Next challenge →'
              : ''}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div style={{ fontSize: 13, color: 'var(--rh-green)', fontWeight: 600, marginBottom: 16 }}>
              Hardware → Runtime → Platform → Deploy → Application — the entire stack, one toggle
            </div>
            <button className="btn btn-primary" onClick={onComplete}>
              See the attestation flow →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
