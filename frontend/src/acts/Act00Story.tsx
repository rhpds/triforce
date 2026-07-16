import { useState } from 'react'
import { motion } from 'motion/react'
import { TriforceIntro } from '../components/TriforceIntro'

interface Props { onComplete?: () => void }

const sourceStyle: React.CSSProperties = {
  fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4,
}

export function Act00Story({ onComplete }: Props) {
  const [step, setStep] = useState(-1)

  if (step === -1) {
    return <TriforceIntro onComplete={() => setStep(0)} />
  }

  const advance = () => setStep(s => s + 1)

  const slides = [
    // Step 0: The Spending
    <div key="spending" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 80, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--text-primary)', lineHeight: 1 }}>
        $307 billion
      </div>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 12 }}>
        spent on enterprise AI in 2025
      </div>
      <div style={sourceStyle}>IDC Worldwide AI Spending Guide, 2025</div>
    </div>,

    // Step 1: The Failure
    <div key="failure" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 80, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-red)', lineHeight: 1 }}>
        $246 billion
      </div>
      <div style={{ fontSize: 24, color: 'var(--rh-red)', marginTop: 12 }}>
        produced no measurable results
      </div>
    </div>,

    // Step 2: RAND stat
    <div key="rand" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 80, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-red)', lineHeight: 1 }}>
        80%+
      </div>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 12 }}>
        of enterprise AI projects failed to deliver value
      </div>
      <div style={sourceStyle}>RAND Corporation, 2024</div>
    </div>,

    // Step 3: MIT stat
    <div key="mit" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 80, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-red)', lineHeight: 1 }}>
        95%
      </div>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 12 }}>
        of AI pilots delivered zero P&L impact
      </div>
      <div style={sourceStyle}>MIT Project NANDA, 2025</div>
    </div>,

    // Step 4: All four stats in 2x2 grid — "let that sink in"
    <div key="grid" style={{ textAlign: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 520, margin: '0 auto' }}>
        <div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--text-primary)' }}>$307B</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>spent on AI in 2025</div>
        </div>
        <div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-red)' }}>$246B</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>produced nothing</div>
        </div>
        <div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-red)' }}>80%+</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>projects failed — RAND</div>
        </div>
        <div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-red)' }}>95%</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>zero P&L impact — MIT</div>
        </div>
      </div>
    </div>,

    // Step 5: Root cause intro
    <div key="root" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 26, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Not because the models were wrong.
      </div>
      <div style={{ fontSize: 30, fontWeight: 600, color: 'var(--text-primary)', marginTop: 12 }}>
        Because enterprises didn't <em>right-size</em> the inference.
      </div>
    </div>,

    // Step 5: CPU idle
    <div key="cpu-idle" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 80, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-orange)', lineHeight: 1 }}>
        12–18%
      </div>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 12 }}>
        average server CPU utilization — the rest is idle
      </div>
      <div style={sourceStyle}>NRDC / McKinsey</div>
    </div>,

    // Step 6: GPU idle
    <div key="gpu-idle" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 80, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-red)', lineHeight: 1 }}>
        95%
      </div>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 12 }}>
        of GPU infrastructure sits idle
      </div>
      <div style={sourceStyle}>VentureBeat, Q1 2026</div>
    </div>,

    // Step 7: Cloud API cost
    <div key="cloud-cost" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 80, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-red)', lineHeight: 1 }}>
        18x
      </div>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 12 }}>
        more expensive — cloud API vs on-premises inference
      </div>
      <div style={sourceStyle}>Lenovo TCO Study, 2026</div>
    </div>,

    // Step 8: The reframe
    <div key="reframe" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--rh-green)', lineHeight: 1.4 }}>
        What if you right-sized your inference to the workload?
      </div>
      <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 16, lineHeight: 1.6 }}>
        CPU for routine inference — at $0 per token on hardware you already own.
      </div>
      <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
        GPU for the tasks that need it — when quality or speed demands it.
      </div>
      <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--rh-green)', marginTop: 16 }}>
        Both. On the same platform. Routed automatically.
      </div>
    </div>,

    // Step 9: The proof
    <div key="proof" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 18, color: 'var(--intel-cyan)', lineHeight: 1.6 }}>
        That's not a pitch.
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--intel-cyan)', marginTop: 8 }}>
        That's what you're about to see running live.
      </div>
      <div style={{ fontSize: 18, color: 'var(--intel-cyan)', marginTop: 8 }}>
        On this Intel Xeon 6. Right now.
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
            Show me &rarr;
          </button>
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 16 }}>
        {step + 1} / {slides.length}
      </div>
    </div>
  )
}
