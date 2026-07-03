import { useState } from 'react'
import { motion } from 'motion/react'
import { TriforceIntro } from '../../components/TriforceIntro'

interface Props { onComplete?: () => void }

const sourceStyle: React.CSSProperties = {
  fontSize: 9, color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4,
}

export function Act00VirtStory({ onComplete }: Props) {
  const [step, setStep] = useState(-1)

  if (step === -1) {
    return <TriforceIntro onComplete={() => setStep(0)} />
  }

  const advance = () => setStep(s => s + 1)

  const slides = [
    // Step 0: The price shock
    <div key="price" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 80, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-red)', lineHeight: 1 }}>
        300-1200%
      </div>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 12 }}>
        VMware price increases after Broadcom
      </div>
      <div style={sourceStyle}>Industry reports, 2025</div>
    </div>,

    // Step 1: The exit
    <div key="exit" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 26, color: 'var(--text-primary)', lineHeight: 1.5 }}>
        Every enterprise with VMs is looking for the exit.
      </div>
    </div>,

    // Step 2: The migration trap
    <div key="trap" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 26, color: 'var(--text-primary)', lineHeight: 1.5 }}>
        But you can't containerize 500 VMs overnight.
      </div>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.5 }}>
        Your SCADA systems. Your databases. Your middleware.
      </div>
      <div style={{ fontSize: 30, fontWeight: 600, color: 'var(--rh-orange)', marginTop: 12 }}>
        AI can't wait years.
      </div>
    </div>,

    // Step 3: CPU idle
    <div key="idle" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 80, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-orange)', lineHeight: 1 }}>
        12-18%
      </div>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 12 }}>
        average CPU utilization at field sites
      </div>
      <div style={sourceStyle}>McKinsey</div>
    </div>,

    // Step 4: Stranded asset
    <div key="stranded" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 26, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        Compressor stations. Cell towers. Branch offices.
      </div>
      <div style={{ fontSize: 24, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.5 }}>
        Air-gapped. Can't reach cloud. Can't run a GPU.
      </div>
      <div style={{ fontSize: 26, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.5 }}>
        That idle compute is a stranded asset.
      </div>
    </div>,

    // Step 5: 2x2 grid
    <div key="grid" style={{ textAlign: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 520, margin: '0 auto' }}>
        <div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-red)' }}>300-1200%</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>VMware price hike</div>
        </div>
        <div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--text-primary)' }}>500+</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>VMs to migrate</div>
        </div>
        <div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-orange)' }}>12-18%</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>CPU idle</div>
        </div>
        <div>
          <div style={{ fontSize: 48, fontWeight: 700, fontFamily: "'Red Hat Mono', monospace", color: 'var(--rh-green)' }}>$0</div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>AI on existing HW</div>
        </div>
      </div>
    </div>,

    // Step 6: The reframe
    <div key="reframe" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--rh-green)', lineHeight: 1.4 }}>
        What if your VMs and AI agents ran on the same hardware?
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--rh-green)', marginTop: 12, lineHeight: 1.4 }}>
        What if a 0.4GB model turned your SCADA PC into an anomaly detector — for $0?
      </div>
    </div>,

    // Step 7: The proof
    <div key="proof" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--intel-cyan)', lineHeight: 1.6 }}>
        OpenShift Virtualization + BitNet.
      </div>
      <div style={{ fontSize: 18, color: 'var(--intel-cyan)', marginTop: 8 }}>
        Same Xeon. Same rack. No new hardware.
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
            See it running &rarr;
          </button>
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 16 }}>
        {step + 1} / {slides.length}
      </div>
    </div>
  )
}
