import { useState } from 'react'
import { motion } from 'motion/react'
import { TriforceIntro } from '../../components/TriforceIntro'

interface Props { onComplete?: () => void }

const sourceStyle: React.CSSProperties = {
  fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4,
}

export function Act00SecureStory({ onComplete }: Props) {
  const [step, setStep] = useState(-1)

  if (step === -1) {
    return <TriforceIntro onComplete={() => setStep(0)} />
  }

  const advance = () => setStep(s => s + 1)

  const slides = [
    // Step 0: The fine
    <div key="fine" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 80, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-red)', lineHeight: 1 }}>
        $1.5M
      </div>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 12 }}>
        average HIPAA violation fine
      </div>
      <div style={sourceStyle}>HHS OCR</div>
    </div>,

    // Step 1: The exposure
    <div key="exposure" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 26, color: 'var(--text-primary)', lineHeight: 1.5 }}>
        Every AI inference processes your most sensitive data.
      </div>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.5 }}>
        Patient records. Transaction histories. Subscriber identities.
      </div>
    </div>,

    // Step 2: Naked in memory
    <div key="naked" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 26, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Protected at rest.
      </div>
      <div style={{ fontSize: 26, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
        Protected in transit.
      </div>
      <div style={{ fontSize: 30, fontWeight: 600, color: 'var(--rh-red)', marginTop: 12 }}>
        Naked in memory during inference.
      </div>
    </div>,

    // Step 3: 80% stat
    <div key="eighty" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 80, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-red)', lineHeight: 1 }}>
        80%
      </div>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 12 }}>
        of AI deployments have zero encryption during processing
      </div>
      <div style={sourceStyle}>Industry estimate</div>
    </div>,

    // Step 4: 2x2 grid
    <div key="grid" style={{ textAlign: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 520, margin: '0 auto' }}>
        <div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-red)' }}>$1.5M</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>HIPAA violation fine</div>
        </div>
        <div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-red)' }}>80%</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>no encryption in use</div>
        </div>
        <div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--text-primary)' }}>800-171</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>NIST CUI protection</div>
        </div>
        <div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--text-primary)' }}>FedRAMP</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>data sovereignty</div>
        </div>
      </div>
    </div>,

    // Step 5: Root cause
    <div key="root" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 26, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Every compliance framework assumes encryption in use.
      </div>
      <div style={{ fontSize: 30, fontWeight: 600, color: 'var(--text-primary)', marginTop: 12 }}>
        Almost no AI deployment provides it.
      </div>
    </div>,

    // Step 6: The reframe
    <div key="reframe" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--rh-green)', lineHeight: 1.4 }}>
        What if one line of YAML encrypted every byte during inference
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--intel-cyan)', marginTop: 12, lineHeight: 1.4 }}>
        — in silicon, where even root access can't read it?
      </div>
    </div>,

    // Step 7: The proof
    <div key="proof" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--intel-cyan)', lineHeight: 1.6 }}>
        Intel TDX does exactly that.
      </div>
      <div style={{ fontSize: 18, color: 'var(--intel-cyan)', marginTop: 8 }}>
        And it's running on this machine.
      </div>
    </div>,
  ]

  const isLast = step >= slides.length - 1

  return (
    <div
      className="demo-section"
      onClick={isLast ? undefined : advance}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: 400, cursor: isLast ? 'default' : 'pointer',
      }}
    >
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
        style={{ maxWidth: 600, width: '100%' }}
      >
        {slides[step]}
      </motion.div>

      {isLast && (
        <div style={{ marginTop: 32 }}>
          <button className="btn btn-primary" onClick={onComplete}>
            See the proof &rarr;
          </button>
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 16 }}>
        {step + 1} / {slides.length}
      </div>
    </div>
  )
}
