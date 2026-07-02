import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Act00Story } from './acts/Act00Story'
import { Act01Architecture } from './acts/Act01Architecture'
import { Act02Inference } from './acts/Act02Inference'
import { Act03Benchmark } from './acts/Act03Benchmark'
import { Act04Scale } from './acts/Act04Scale'
import { Act04Efficiency } from './acts/Act04Efficiency'
import { Act05HonestQuestion } from './acts/Act05HonestQuestion'
import { Act00SecureStory } from './acts/secure/Act00SecureStory'
import { Act01TdxArchitecture } from './acts/secure/Act01TdxArchitecture'
import { Act02Attestation } from './acts/secure/Act02Attestation'
import { Act03OneLine } from './acts/secure/Act03OneLine'
import { Act04ConfidentialInference } from './acts/secure/Act04ConfidentialInference'
import { Act05SecureTradeoff } from './acts/secure/Act05SecureTradeoff'
import { Act06SecurePunchline } from './acts/secure/Act06SecurePunchline'
import { Act00VirtStory } from './acts/virt/Act00VirtStory'
import { Act01VmwareMigration } from './acts/virt/Act01VmwareMigration'
import { Act02OneServer } from './acts/virt/Act02OneServer'
import { Act03EdgeLive } from './acts/virt/Act03EdgeLive'
import { Act04SidecarLive } from './acts/virt/Act04SidecarLive'
import { Act05VirtTradeoff } from './acts/virt/Act05VirtTradeoff'
import { Act04MigrationPath } from './acts/virt/Act04MigrationPath'
import { Act06VirtPunchline } from './acts/virt/Act06VirtPunchline'
import { Act00GovernStory } from './acts/govern/Act00GovernStory'
import { Act01GovernArchitecture } from './acts/govern/Act01GovernArchitecture'
import { Act02AgentDiscovery } from './acts/govern/Act02AgentDiscovery'
import { Act03Identity } from './acts/govern/Act03Identity'
import { Act04ToolGovernance } from './acts/govern/Act04ToolGovernance'
import { Act05AuditTrail } from './acts/govern/Act05AuditTrail'
import { Act06GovernPunchline } from './acts/govern/Act06GovernPunchline'

type ActEntry = { id: string; label: string; component: React.ComponentType<{ onComplete?: () => void }> }

const BASE_ACTS: ActEntry[] = [
  { id: 'story', label: '00', component: Act00Story },
  { id: 'arch', label: '01', component: Act01Architecture },
  { id: 'proof', label: '02', component: Act02Inference },
  { id: 'benchmark', label: '03', component: Act03Benchmark },
  { id: 'scale', label: '04', component: Act04Scale },
  { id: 'efficiency', label: '05', component: Act04Efficiency },
  { id: 'punchline', label: '06', component: Act05HonestQuestion },
]

const SECURE_ACTS: ActEntry[] = [
  { id: 'secure-story', label: '00', component: Act00SecureStory },
  { id: 'secure-arch', label: '01', component: Act01TdxArchitecture },
  { id: 'secure-attest', label: '02', component: Act02Attestation },
  { id: 'secure-oneline', label: '03', component: Act03OneLine },
  { id: 'secure-infer', label: '04', component: Act04ConfidentialInference },
  { id: 'secure-tradeoff', label: '05', component: Act05SecureTradeoff },
  { id: 'secure-punch', label: '06', component: Act06SecurePunchline },
]

const VIRT_ACTS: ActEntry[] = [
  { id: 'virt-story', label: '00', component: Act00VirtStory },
  { id: 'virt-vmware', label: '01', component: Act01VmwareMigration },
  { id: 'virt-server', label: '02', component: Act02OneServer },
  { id: 'virt-edge', label: '03', component: Act03EdgeLive },
  { id: 'virt-sidecar', label: '04', component: Act04SidecarLive },
  { id: 'virt-tradeoff', label: '05', component: Act05VirtTradeoff },
  { id: 'virt-migration', label: '06', component: Act04MigrationPath },
  { id: 'virt-punch', label: '07', component: Act06VirtPunchline },
]

const GOVERN_ACTS: ActEntry[] = [
  { id: 'govern-story', label: '00', component: Act00GovernStory },
  { id: 'govern-arch', label: '01', component: Act01GovernArchitecture },
  { id: 'govern-discovery', label: '02', component: Act02AgentDiscovery },
  { id: 'govern-identity', label: '03', component: Act03Identity },
  { id: 'govern-tools', label: '04', component: Act04ToolGovernance },
  { id: 'govern-audit', label: '05', component: Act05AuditTrail },
  { id: 'govern-punch', label: '06', component: Act06GovernPunchline },
]

const VARIANT_TEASERS = {
  base: [
    { title: 'Triforce Secure', question: 'Can I trust it with my data?', tech: 'Intel TDX · Confidential Containers · Hardware-encrypted memory', color: 'var(--intel-cyan)', param: 'secure' },
    { title: 'Triforce Virt', question: 'Can I run AI alongside my existing VMs?', tech: 'OpenShift Virtualization · KubeVirt · VM + Container coexistence', color: 'var(--rh-red)', param: 'virt' },
    { title: 'Triforce Govern', question: 'Can I govern agents at enterprise scale?', tech: 'Kagenti · SPIFFE identity · MCP Gateway · Agent audit trails', color: 'var(--ibm-blue)', param: 'govern' },
  ],
  secure: [
    { title: 'Triforce AI', question: 'Can I afford AI at scale?', tech: 'Intel Xeon 6 · CPU inference · $0/token', color: 'var(--intel-cyan)', param: '' },
    { title: 'Triforce Virt', question: 'Can I run AI alongside my existing VMs?', tech: 'OpenShift Virtualization · KubeVirt · VM + Container coexistence', color: 'var(--rh-red)', param: 'virt' },
    { title: 'Triforce Govern', question: 'Can I govern agents at enterprise scale?', tech: 'Kagenti · SPIFFE identity · MCP Gateway · Agent audit trails', color: 'var(--ibm-blue)', param: 'govern' },
  ],
  virt: [
    { title: 'Triforce AI', question: 'Can I afford AI at scale?', tech: 'Intel Xeon 6 · CPU inference · $0/token', color: 'var(--intel-cyan)', param: '' },
    { title: 'Triforce Secure', question: 'Can I trust it with my data?', tech: 'Intel TDX · Confidential Containers · Hardware-encrypted memory', color: 'var(--intel-cyan)', param: 'secure' },
    { title: 'Triforce Govern', question: 'Can I govern agents at enterprise scale?', tech: 'Kagenti · SPIFFE identity · MCP Gateway · Agent audit trails', color: 'var(--ibm-blue)', param: 'govern' },
  ],
  govern: [
    { title: 'Triforce AI', question: 'Can I afford AI at scale?', tech: 'Intel Xeon 6 · CPU inference · $0/token', color: 'var(--intel-cyan)', param: '' },
    { title: 'Triforce Secure', question: 'Can I trust it with my data?', tech: 'Intel TDX · Confidential Containers · Hardware-encrypted memory', color: 'var(--intel-cyan)', param: 'secure' },
    { title: 'Triforce Virt', question: 'Can I run AI alongside my existing VMs?', tech: 'OpenShift Virtualization · KubeVirt · VM + Container coexistence', color: 'var(--rh-red)', param: 'virt' },
  ],
}

const VARIANT_HEADLINES = {
  base: { line1: '80% of enterprise AI doesn\'t need a GPU.', line2: 'That 80% runs today on the CPUs you already own.' },
  secure: { line1: 'AI processes your most sensitive data.', line2: 'Now that data is hardware-encrypted in silicon.' },
  virt: { line1: 'You have hundreds of VMs you can\'t containerize overnight.', line2: 'AI runs alongside them today — on the same hardware.' },
  govern: { line1: 'AI agents are deploying faster than governance can keep up.', line2: 'Now every agent is registered, verified, controlled, and audited.' },
}

function Footer({ variant }: { variant: string }) {
  const teasers = VARIANT_TEASERS[variant as keyof typeof VARIANT_TEASERS] || VARIANT_TEASERS.base
  const headlines = VARIANT_HEADLINES[variant as keyof typeof VARIANT_HEADLINES] || VARIANT_HEADLINES.base

  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 18, color: 'var(--text-dim)', marginBottom: 12 }}>{headlines.line1}</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>{headlines.line2}</div>

      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>
        But the story doesn't end here.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, textAlign: 'left', marginBottom: 32, maxWidth: 800, margin: '0 auto 32px' }}>
        {teasers.map((story, i) => (
          <motion.div
            key={story.title}
            className="card"
            style={{
              borderLeft: `3px solid ${story.color}`, padding: '20px',
              cursor: story.param !== undefined ? 'pointer' : 'default',
            }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.15 }}
            onClick={() => {
              if (story.param !== undefined) {
                const url = story.param ? `?demo=${story.param}` : '/'
                window.location.href = url
              }
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: story.color, marginBottom: 8 }}>{story.title}</div>
            <div style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.5 }}>{story.question}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 10 }}>{story.tech}</div>
            <div style={{
              fontSize: 10, padding: '2px 10px', borderRadius: 4, display: 'inline-block',
              background: 'var(--rh-green-dim)',
              border: '1px solid var(--rh-green)',
              color: 'var(--rh-green)',
              fontWeight: 600,
            }}>
              VIEW DEMO
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

function getVariant(): string {
  const params = new URLSearchParams(window.location.search)
  return params.get('demo') || 'base'
}

export default function App() {
  const variant = useMemo(getVariant, [])
  const acts = variant === 'secure' ? SECURE_ACTS : variant === 'virt' ? VIRT_ACTS : variant === 'govern' ? GOVERN_ACTS : BASE_ACTS

  const [started, setStarted] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.has('act')
  })
  const [currentAct, setCurrentAct] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const act = params.get('act')
    return act ? parseInt(act, 10) : 0
  })
  const [showFooter, setShowFooter] = useState(false)

  const totalActs = acts.length

  const goToAct = (i: number) => {
    if (i >= 0 && i < totalActs) {
      setCurrentAct(i)
      setShowFooter(false)
      window.scrollTo({ top: 0 })
    }
  }

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

  const CurrentComponent = showFooter ? null : acts[currentAct].component

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
          {variant !== 'base' && (
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 4,
              background: variant === 'secure' ? 'var(--intel-cyan-dim)' : variant === 'virt' ? 'var(--rh-red-dim)' : variant === 'govern' ? 'var(--ibm-blue-dim)' : 'var(--surface-2)',
              color: variant === 'secure' ? 'var(--intel-cyan)' : variant === 'virt' ? 'var(--rh-red)' : variant === 'govern' ? 'var(--ibm-blue)' : 'var(--text-dim)',
              fontWeight: 600, textTransform: 'uppercase',
            }}>
              {variant}
            </span>
          )}
          <button
            onClick={() => goToAct(currentAct - 1)}
            disabled={currentAct === 0 && !showFooter}
            style={{ background: 'none', border: 'none', color: currentAct === 0 && !showFooter ? 'var(--text-disabled)' : 'var(--text-primary)', cursor: currentAct === 0 && !showFooter ? 'default' : 'pointer', fontSize: 16, padding: '4px 8px' }}
          >◀</button>
          <div className="progress-bar">
            {acts.map((act, i) => (
              <div
                key={act.id}
                className={`progress-dot ${i === currentAct && !showFooter ? 'active' : i < currentAct || showFooter ? 'done' : ''}`}
                title={`Act ${act.label}`}
                style={{ cursor: 'pointer' }}
                onClick={() => goToAct(i)}
              />
            ))}
          </div>
          <button
            onClick={() => showFooter ? goToAct(totalActs - 1) : advanceAct()}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 16, padding: '4px 8px' }}
          >▶</button>
          <span className="progress-label" style={{ cursor: 'pointer' }} onClick={() => { setCurrentAct(0); setShowFooter(false); setStarted(false); window.history.replaceState(null, '', '/'); window.scrollTo({ top: 0 }) }}>
            {showFooter ? 'complete' : `${acts[currentAct].label} / ${acts[totalActs - 1].label}`}
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
            <Footer variant={variant} />
          </motion.div>
        ) : CurrentComponent ? (
          <motion.div
            key={acts[currentAct].id}
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
