import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

const STEPS = [
  {
    id: 'boot',
    title: 'Pod Starts Inside Kata VM',
    narrator: 'OpenShift schedules the pod on a TDX-capable node. Instead of a standard container, it boots a Kata VM inside a Trust Domain. The CPU immediately begins encrypting all memory for this VM.',
    color: 'var(--rh-red)',
    visual: () => (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <motion.div style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--rh-red)', fontSize: 12 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span style={{ color: 'var(--rh-red)' }}>OpenShift Scheduler</span>
          <span style={{ color: 'var(--text-dim)' }}> → TDX node selected</span>
        </motion.div>
        <motion.div style={{ width: 2, height: 16, background: 'var(--rh-red)' }}
          initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.3 }} />
        <motion.div style={{
          padding: '14px 24px', borderRadius: 10, border: '2px solid var(--intel-cyan)',
          background: 'var(--intel-cyan-dim)', textAlign: 'center',
        }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--intel-cyan)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Trust Domain</div>
          <motion.div style={{
            padding: '8px 16px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--rh-red)',
          }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--rh-red)' }}>Kata VM</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>healthcare-agent booting...</div>
          </motion.div>
          <motion.div className="mono" style={{ fontSize: 10, color: 'var(--rh-green)', marginTop: 6 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
            memory encryption: active
          </motion.div>
        </motion.div>
      </div>
    ),
  },
  {
    id: 'cdh',
    title: 'Agent Needs Its API Key',
    narrator: 'The healthcare agent starts but has no API key — it can\'t call MAAS for inference. The Confidential Data Hub (CDH) agent inside the VM reaches out to the Trustee Key Broker Service on the cluster to request the secret.',
    color: 'var(--accent-blue)',
    visual: () => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        <motion.div style={{
          padding: '12px 18px', borderRadius: 10, border: '2px solid var(--intel-cyan)',
          background: 'var(--intel-cyan-dim)', textAlign: 'center',
        }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--intel-cyan)', fontWeight: 700, marginBottom: 4 }}>TRUST DOMAIN</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--rh-red)', fontSize: 10, color: 'var(--rh-red)' }}>
              Agent <span style={{ color: 'var(--rh-orange)' }}>no key</span>
            </div>
            <div style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--accent-blue)', fontSize: 10, color: 'var(--accent-blue)' }}>CDH</div>
          </div>
        </motion.div>

        <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--accent-blue)', marginBottom: 2 }}>request secret</div>
          <svg width="60" height="16" viewBox="0 0 60 16">
            <motion.line x1="0" y1="8" x2="48" y2="8" stroke="var(--accent-blue)" strokeWidth="2"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 0.5 }} />
            <polygon points="46,4 54,8 46,12" fill="var(--accent-blue)" />
          </svg>
        </motion.div>

        <motion.div style={{
          padding: '12px 18px', borderRadius: 10, border: '2px solid var(--accent-blue)',
          background: 'var(--surface-2)', textAlign: 'center',
        }} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)' }}>Trustee KBS</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>Key Broker Service</div>
          <motion.div className="mono" style={{ fontSize: 10, color: 'var(--rh-orange)', marginTop: 4 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>
            "prove you're in TDX first"
          </motion.div>
        </motion.div>
      </div>
    ),
  },
  {
    id: 'quote',
    title: 'Hardware Generates Attestation Quote',
    narrator: 'The KBS doesn\'t just hand over secrets. It demands proof. The vTPM inside the Trust Domain generates an attestation quote — a cryptographic measurement of the hardware state, firmware version, and TD configuration. This quote is signed by keys embedded in the CPU. It cannot be forged.',
    color: 'var(--intel-cyan)',
    visual: () => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        <motion.div style={{
          padding: '12px 18px', borderRadius: 10, border: '2px solid var(--intel-cyan)',
          background: 'var(--intel-cyan-dim)', textAlign: 'center',
        }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--intel-cyan)', fontWeight: 700, marginBottom: 4 }}>TRUST DOMAIN</div>
          <motion.div style={{
            padding: '6px 12px', borderRadius: 6, background: 'var(--surface-2)',
            border: '1px solid var(--intel-cyan)',
          }} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--intel-cyan)' }}>vTPM</div>
            <motion.div className="mono" style={{ fontSize: 9, color: 'var(--rh-green)', marginTop: 2 }}
              animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: 2, duration: 0.6, delay: 0.5 }}>
              generating quote...
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--intel-cyan)', marginBottom: 2 }}>signed quote</div>
          <svg width="60" height="16" viewBox="0 0 60 16">
            <motion.line x1="0" y1="8" x2="48" y2="8" stroke="var(--intel-cyan)" strokeWidth="2"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.3, duration: 0.5 }} />
            <polygon points="46,4 54,8 46,12" fill="var(--intel-cyan)" />
          </svg>
        </motion.div>

        <motion.div style={{
          padding: '12px 18px', borderRadius: 10, border: '2px solid var(--accent-blue)',
          background: 'var(--surface-2)', textAlign: 'center',
        }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)' }}>Attestation Service</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>receives quote</div>
          <motion.div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
            <div className="mono" style={{ fontSize: 9, color: 'var(--text-dim)' }}>CPU: Intel Xeon 6</div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--text-dim)' }}>TDX: enabled</div>
            <div className="mono" style={{ fontSize: 9, color: 'var(--text-dim)' }}>Firmware: verified</div>
          </motion.div>
        </motion.div>
      </div>
    ),
  },
  {
    id: 'verify',
    title: 'Trustee Verifies the Hardware',
    narrator: 'The Attestation Service checks the quote against known-good reference values (RVPS). Is this a real Xeon 6 with TDX? Is the firmware version trusted? Is the TD configuration correct? If any check fails, attestation is denied and secrets stay locked.',
    color: 'var(--rh-green)',
    visual: () => (
      <div style={{ textAlign: 'center' }}>
        <motion.div style={{
          display: 'inline-block', padding: '16px 24px', borderRadius: 10,
          border: '2px solid var(--accent-blue)', background: 'var(--surface-2)',
        }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)', marginBottom: 10 }}>Attestation Service</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { check: 'CPU is genuine Intel Xeon 6', delay: 0.3 },
              { check: 'TDX is enabled and active', delay: 0.6 },
              { check: 'Firmware matches trusted version', delay: 0.9 },
              { check: 'TD configuration is valid', delay: 1.2 },
            ].map(item => (
              <motion.div key={item.check} style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: item.delay }}>
                <motion.div style={{ width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, background: 'var(--rh-green-dim)', border: '1px solid var(--rh-green)', color: 'var(--rh-green)' }}
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: item.delay + 0.2, type: 'spring', stiffness: 400 }}>
                  ✓
                </motion.div>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.check}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <motion.div style={{ marginTop: 10 }}
          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.8, type: 'spring', stiffness: 400, damping: 20 }}>
          <span style={{
            padding: '4px 16px', borderRadius: 6, background: 'var(--rh-green-dim)',
            border: '1px solid var(--rh-green)', fontSize: 13, fontWeight: 700, color: 'var(--rh-green)',
          }}>
            ATTESTATION PASSED
          </span>
        </motion.div>
      </div>
    ),
  },
  {
    id: 'secrets',
    title: 'Secrets Released to Trust Domain',
    narrator: 'Attestation passed. The KBS releases the LITELLM_API_KEY into the Trust Domain. The key exists only inside the encrypted memory boundary — no process outside the TD can read it. The healthcare agent now has everything it needs to run inference. The entire handshake took ~350ms.',
    color: 'var(--rh-green)',
    visual: () => (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        <motion.div style={{
          padding: '12px 18px', borderRadius: 10, border: '2px solid var(--accent-blue)',
          background: 'var(--surface-2)', textAlign: 'center',
        }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)' }}>Trustee KBS</div>
          <motion.div className="mono" style={{ fontSize: 10, color: 'var(--rh-green)', marginTop: 4 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            attestation: verified
          </motion.div>
        </motion.div>

        <motion.div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--rh-green)', marginBottom: 2 }}>LITELLM_API_KEY</div>
          <svg width="60" height="16" viewBox="0 0 60 16">
            <motion.line x1="0" y1="8" x2="48" y2="8" stroke="var(--rh-green)" strokeWidth="2"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.7, duration: 0.5 }} />
            <polygon points="46,4 54,8 46,12" fill="var(--rh-green)" />
          </svg>
          <div className="mono" style={{ fontSize: 9, color: 'var(--text-disabled)', marginTop: 2 }}>encrypted channel</div>
        </motion.div>

        <motion.div style={{
          padding: '14px 20px', borderRadius: 10, border: '2px solid var(--intel-cyan)',
          background: 'var(--intel-cyan-dim)', textAlign: 'center',
        }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div style={{ fontSize: 10, color: 'var(--intel-cyan)', fontWeight: 700, marginBottom: 4 }}>TRUST DOMAIN</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <motion.div style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--rh-green)', fontSize: 10, color: 'var(--rh-green)' }}
              initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, type: 'spring', stiffness: 300 }}>
              API Key: received
            </motion.div>
            <motion.div style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--rh-green)', fontSize: 10, color: 'var(--rh-green)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
              Agent: ready for inference
            </motion.div>
          </div>
        </motion.div>
      </div>
    ),
  },
]

export function Act02Attestation({ onComplete }: Props) {
  const [revealed, setRevealed] = useState(0)

  const advance = () => {
    if (revealed < STEPS.length) setRevealed(prev => prev + 1)
  }

  const allRevealed = revealed >= STEPS.length

  return (
    <div className="demo-section">
      <h3><span className="section-num">02</span> The Attestation Handshake</h3>
      <div className="section-context">
        Before the AI agent gets its API key, the hardware must prove it's genuine.
        Click through each step of the cryptographic handshake between the pod
        and the Trustee Key Broker Service.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {STEPS.map((step, i) => (
          <AnimatePresence key={step.id}>
            {revealed >= i + 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {i > 0 && (
                  <motion.div style={{ width: 2, height: 16, background: step.color, margin: '0 auto' }}
                    initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.3 }} />
                )}

                <div className="step-card" style={{ borderLeft: `3px solid ${step.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span className="step-num" style={{ background: step.color }}>{i + 1}</span>
                    <strong>{step.title}</strong>
                  </div>

                  <motion.div style={{ marginBottom: 14 }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                    {step.visual()}
                  </motion.div>

                  <motion.div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7 }}
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    {step.narrator}
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
            {revealed === 0 ? `Start: ${STEPS[0].title} →` : `Next: ${STEPS[revealed].title} →`}
          </button>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div style={{ fontSize: 13, color: 'var(--rh-green)', fontWeight: 600, marginBottom: 16 }}>
              350ms from boot to attested. No TDX = no secrets = agent can't start.
            </div>
            <button className="btn btn-primary" onClick={onComplete}>
              One line changes everything →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
