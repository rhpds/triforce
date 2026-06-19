import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TriforceIntro } from '../../components/TriforceIntro'

interface Props { onComplete?: () => void }

export function Act00GovernStory({ onComplete }: Props) {
  const [introComplete, setIntroComplete] = useState(false)

  return (
    <div className="demo-section">
      {!introComplete && (
        <TriforceIntro onComplete={() => setIntroComplete(true)} />
      )}

      <AnimatePresence>
        {introComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3><span className="section-num">00</span> Who controls your AI agents?</h3>

            <div className="section-context">
              Teams are deploying AI agents across your organization. Healthcare has one.
              Finance built another. Operations is building a third. Each team picked
              their own models, their own tools, their own deployment patterns. Nobody
              has a complete picture.
            </div>

            <div style={{ textAlign: 'center', margin: '24px 0' }}>
              <motion.div style={{
                display: 'inline-block', padding: '24px 32px', borderRadius: 12,
                border: '1px dashed var(--rh-orange)', background: 'var(--rh-orange-dim)',
              }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--rh-orange)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Agent Sprawl</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {[
                    { name: 'Agent A', team: 'Healthcare', status: '?' },
                    { name: 'Agent B', team: 'Finance', status: '?' },
                    { name: 'Agent C', team: 'Ops', status: '?' },
                    { name: 'Agent D', team: '???', status: '?' },
                  ].map((agent, i) => (
                    <motion.div key={agent.name} style={{
                      padding: '8px 14px', borderRadius: 8, background: 'var(--surface-2)',
                      border: '1px solid var(--border)', textAlign: 'center',
                    }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.15 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{agent.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-disabled)' }}>{agent.team}</div>
                      <div style={{ fontSize: 16, color: 'var(--rh-orange)', marginTop: 4 }}>{agent.status}</div>
                    </motion.div>
                  ))}
                </div>
                <motion.div style={{ fontSize: 11, color: 'var(--rh-orange)', marginTop: 12 }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                  No registry · No identity · No tool control · No audit trail
                </motion.div>
              </motion.div>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12, margin: '24px 0',
            }}>
              {[
                { q: 'Who deployed this agent?', a: 'No registry — agents appear without approval', color: 'var(--rh-orange)' },
                { q: 'What data can it access?', a: 'No tool governance — agents call any tool', color: 'var(--rh-red)' },
                { q: 'Can I prove it to an auditor?', a: 'No audit trail — no record of AI decisions', color: 'var(--rh-orange)' },
              ].map((item, i) => (
                <motion.div key={item.q} className="step-card" style={{ borderLeft: `3px solid ${item.color}` }}
                  initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 + i * 0.15 }}>
                  <strong style={{ fontSize: 14 }}>{item.q}</strong>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{item.a}</div>
                </motion.div>
              ))}
            </div>

            <motion.div className="card card-accent-ibm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.9 }}>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--ibm-blue)' }}>What if agents were governed like any other Kubernetes resource?</strong><br />
                <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>
                  IBM Kagenti makes agents first-class CRDs — registered, discoverable, identity-verified,
                  tool-controlled, and fully audited. Kubernetes-native governance for the agent era.
                </span>
              </p>
            </motion.div>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <button className="btn btn-primary" onClick={onComplete} style={{ background: 'var(--ibm-blue)' }}>
                See the governance stack →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
