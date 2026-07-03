import { useState } from 'react'
import { motion } from 'motion/react'
import { TriforceIntro } from '../../components/TriforceIntro'

interface Props { onComplete?: () => void }

const sourceStyle: React.CSSProperties = {
  fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4,
}

export function Act00GovernStory({ onComplete }: Props) {
  const [step, setStep] = useState(-1)

  if (step === -1) {
    return <TriforceIntro onComplete={() => setStep(0)} />
  }

  const advance = () => setStep(s => s + 1)

  const slides = [
    // Step 0: The failure rate
    <div key="failure" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 80, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-red)', lineHeight: 1 }}>
        89%
      </div>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 12 }}>
        of AI agent pilots never reach production
      </div>
      <div style={sourceStyle}>Gartner, 2026</div>
    </div>,

    // Step 1: Not because they don't work
    <div key="notwork" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 26, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Not because the agents don't work.
      </div>
      <div style={{ fontSize: 30, fontWeight: 600, color: 'var(--text-primary)', marginTop: 12 }}>
        Because nobody can answer three questions.
      </div>
    </div>,

    // Step 2: The three questions
    <div key="questions" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 2 }}>
        Who authorized this agent to access that data?
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 2 }}>
        Who audits what it decided?
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 2 }}>
        What policy governs its tool access?
      </div>
    </div>,

    // Step 3: 42% abandoned
    <div key="abandoned" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 80, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-orange)', lineHeight: 1 }}>
        42%
      </div>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 12 }}>
        of companies abandoned AI projects in 2025
      </div>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 8 }}>
        Trust was the #1 barrier
      </div>
      <div style={sourceStyle}>S&P Global</div>
    </div>,

    // Step 4: 2x2 grid
    <div key="grid" style={{ textAlign: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 520, margin: '0 auto' }}>
        <div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-red)' }}>89%</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>pilots fail</div>
        </div>
        <div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-orange)' }}>42%</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>abandoned</div>
        </div>
        <div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--text-primary)' }}>EU AI Act</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>traceability</div>
        </div>
        <div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--text-primary)' }}>SOX</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>audit trails</div>
        </div>
      </div>
    </div>,

    // Step 5: Root cause
    <div key="root" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        The EU AI Act requires traceability.
      </div>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
        SOX requires audit trails.
      </div>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
        HIPAA requires access controls on PHI.
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-primary)', marginTop: 12 }}>
        Even when an AI agent is the one accessing it.
      </div>
    </div>,

    // Step 6: The reframe
    <div key="reframe" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--rh-green)', lineHeight: 1.4 }}>
        What if every agent had a cryptographic identity?
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--intel-cyan)', marginTop: 12, lineHeight: 1.4 }}>
        Every tool call was policy-gated?
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--intel-cyan)', marginTop: 12, lineHeight: 1.4 }}>
        Every decision logged with hardware-level proof?
      </div>
    </div>,

    // Step 7: The proof
    <div key="proof" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--ibm-blue)', lineHeight: 1.6 }}>
        That's agent governance.
      </div>
      <div style={{ fontSize: 18, color: 'var(--ibm-blue)', marginTop: 8 }}>
        And it starts with three Kubernetes CRDs.
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
          <button className="btn btn-primary" onClick={onComplete}
            style={{ background: 'var(--ibm-blue)' }}>
            See the architecture &rarr;
          </button>
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 16 }}>
        {step + 1} / {slides.length}
      </div>
    </div>
  )
}
