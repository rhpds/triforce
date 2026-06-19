import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Act00Story } from './acts/Act00Story'
import { Act01Architecture } from './acts/Act01Architecture'
import { Act02Inference } from './acts/Act02Inference'
import { Act03Cost } from './acts/Act03Cost'
import { Act04Scale } from './acts/Act04Scale'
import { Act04Efficiency } from './acts/Act04Efficiency'
import { Act05HonestQuestion } from './acts/Act05HonestQuestion'

const ACTS = [
  { id: 'story', label: '00', component: Act00Story },
  { id: 'arch', label: '01', component: Act01Architecture },
  { id: 'proof', label: '02', component: Act02Inference },
  { id: 'cost', label: '03', component: Act03Cost },
  { id: 'scale', label: '04', component: Act04Scale },
  { id: 'efficiency', label: '05', component: Act04Efficiency },
  { id: 'punchline', label: '06', component: Act05HonestQuestion },
]

function Footer() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 18, color: 'var(--text-dim)', marginBottom: 12 }}>
        80% of enterprise AI doesn't need a GPU.
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>
        That 80% runs today on the CPUs you already own.
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>
        But the story doesn't end here.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, textAlign: 'left', marginBottom: 32, maxWidth: 800, margin: '0 auto 32px' }}>
        {[
          { title: 'Triforce Secure', question: 'Can I trust it with my data?', tech: 'Intel TDX · Confidential Containers · Hardware-encrypted memory', color: 'var(--intel-cyan)' },
          { title: 'Triforce Virt', question: 'Can I run AI alongside my existing VMs?', tech: 'OpenShift Virtualization · KubeVirt · VM + Container coexistence', color: 'var(--rh-red)' },
          { title: 'Triforce Govern', question: 'Can I govern agents at enterprise scale?', tech: 'Kagenti · SPIFFE identity · MCP Gateway · Agent audit trails', color: 'var(--ibm-blue)' },
        ].map((story, i) => (
          <motion.div
            key={story.title}
            className="card"
            style={{ borderLeft: `3px solid ${story.color}`, padding: '20px', cursor: 'default' }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.15 }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: story.color, marginBottom: 8 }}>{story.title}</div>
            <div style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.5 }}>{story.question}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 10 }}>{story.tech}</div>
            <div style={{ fontSize: 10, padding: '2px 10px', borderRadius: 4, display: 'inline-block', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-disabled)', fontWeight: 600 }}>
              COMING SOON
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 16 }}>
        <span style={{ color: 'var(--intel-cyan)' }}>Power</span> ·{' '}
        <span style={{ color: 'var(--ibm-blue)' }}>Wisdom</span> ·{' '}
        <span style={{ color: 'var(--rh-red)' }}>Courage</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-disabled)', marginTop: 8 }}>
        github.com/rhpds/triforce
      </div>
    </div>
  )
}

export default function App() {
  const [started, setStarted] = useState(false)
  const [currentAct, setCurrentAct] = useState(0)
  const [showFooter, setShowFooter] = useState(false)

  const totalActs = ACTS.length

  const advanceAct = () => {
    if (currentAct < totalActs - 1) {
      setCurrentAct(prev => prev + 1)
      window.scrollTo({ top: 0 })
    } else {
      setShowFooter(true)
      window.scrollTo({ top: 0 })
    }
  }

  if (!started) {
    return (
      <div
        style={{
          height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
        onClick={() => setStarted(true)}
      >
        <motion.div
          style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 48 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div style={{ width: 120, display: 'flex', justifyContent: 'flex-end' }}>
            <img src="/logos/redhat.svg" alt="Red Hat" style={{ height: 22 }} />
          </div>
          <span style={{ color: 'var(--text-disabled)', fontSize: 22, fontWeight: 300 }}>×</span>
          <div style={{ width: 120, display: 'flex', justifyContent: 'center' }}>
            <img src="/logos/intel.png" alt="Intel" style={{ height: 28 }} />
          </div>
          <span style={{ color: 'var(--text-disabled)', fontSize: 22, fontWeight: 300 }}>×</span>
          <div style={{ width: 120, display: 'flex', justifyContent: 'flex-start' }}>
            <img src="/logos/ibm.png" alt="IBM" style={{ height: 22 }} />
          </div>
        </motion.div>
        <motion.div
          style={{ fontSize: 12, color: 'var(--text-disabled)' }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
        >
          click to begin
        </motion.div>
      </div>
    )
  }

  const CurrentComponent = showFooter ? null : ACTS[currentAct].component

  return (
    <div>
      {/* Header */}
      <div className="demo-header">
        <div className="demo-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/logos/redhat.svg" alt="Red Hat" style={{ height: 20 }} />
            <span style={{ color: 'var(--text-disabled)', fontSize: 22, fontWeight: 300 }}>×</span>
            <img src="/logos/intel.png" alt="Intel" style={{ height: 20 }} />
            <span style={{ color: 'var(--text-disabled)', fontSize: 22, fontWeight: 300 }}>×</span>
            <img src="/logos/ibm.png" alt="IBM" style={{ height: 18 }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="progress-bar">
            {ACTS.map((act, i) => (
              <div
                key={act.id}
                className={`progress-dot ${i === currentAct && !showFooter ? 'active' : i < currentAct || showFooter ? 'done' : ''}`}
                title={`Act ${act.label}`}
              />
            ))}
          </div>
          <span className="progress-label">
            {showFooter ? 'complete' : `${ACTS[currentAct].label} / ${ACTS[totalActs - 1].label}`}
          </span>
          <div className="health-dot alive" />
        </div>
      </div>

      {/* Page content */}
      <AnimatePresence mode="wait">
        {showFooter ? (
          <motion.div
            key="footer"
            className="page-container"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
          >
            <Footer />
          </motion.div>
        ) : CurrentComponent ? (
          <motion.div
            key={ACTS[currentAct].id}
            className="page-container"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
          >
            <CurrentComponent onComplete={advanceAct} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
