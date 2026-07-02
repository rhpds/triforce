import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

const LAYERS = [
  {
    id: 'registry',
    label: 'Agent Registry',
    position: 'Lifecycle',
    question: '"How do I enforce rules across all agents without checking each one manually?"',
    color: 'var(--ibm-blue)',
    detail: 'AgentRuntime CRDs register agents as Kubernetes resources. Kagenti watches for the kagenti.io/type: agent label and manages the agent lifecycle — creation, health monitoring, scaling, and termination. Agents are managed like Deployments.',
    visual: () => (
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { name: 'healthcare-agent', kind: 'AgentRuntime' },
          { name: 'finserv-agent', kind: 'AgentRuntime' },
          { name: 'orchestrator', kind: 'AgentRuntime' },
        ].map((a, i) => (
          <motion.div key={a.name} style={{
            padding: '10px 16px', borderRadius: 8, background: 'var(--surface-2)',
            border: '1px solid var(--ibm-blue)', textAlign: 'center', minWidth: 140,
          }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--ibm-blue)', fontWeight: 700 }}>{a.name}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{a.kind}</div>
            <div style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: 'var(--rh-green-dim)', color: 'var(--rh-green)', display: 'inline-block', marginTop: 4 }}>managed</div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    id: 'discovery',
    label: 'A2A Discovery',
    position: 'Protocol',
    question: '"How do agents find each other without hardcoded URLs?"',
    color: 'var(--rh-green)',
    detail: 'Each agent publishes an AgentCard at /.well-known/agent-card.json — name, skills, capabilities, URL. The orchestrator queries these cards automatically. When a new agent deploys, it\'s discoverable within seconds. No service registry configuration.',
    visual: () => (
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          {['Healthcare', 'FinServ', 'Orchestrator'].map((name, i) => (
            <motion.div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}>
              <div style={{ padding: '6px 12px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--rh-green)', fontSize: 11, color: 'var(--rh-green)' }}>{name}</div>
              <motion.div className="mono" style={{ fontSize: 9, color: 'var(--text-dim)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.2 + 0.3 }}>
                agent-card.json
              </motion.div>
            </motion.div>
          ))}
        </div>
        <motion.div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          JSON-RPC 2.0 · A2A Protocol v0.2.6 · auto-discovery
        </motion.div>
      </div>
    ),
  },
  {
    id: 'identity',
    label: 'SPIFFE Identity',
    position: 'Security',
    question: '"How do I know which agent is which — and prove it cryptographically?"',
    color: 'var(--intel-cyan)',
    detail: 'Every agent pod receives a SPIFFE Verifiable Identity Document (SVID) — a cryptographic workload identity issued by the SPIRE server. No static API keys. No shared secrets. Agent-to-agent communication uses mTLS with SVID certificates. Identity is verified at the infrastructure level.',
    visual: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        {[
          { uri: 'spiffe://triforce/agent/healthcare-agent', color: 'var(--ibm-blue)' },
          { uri: 'spiffe://triforce/agent/finserv-agent', color: 'var(--ibm-blue)' },
          { uri: 'spiffe://triforce/agent/orchestrator', color: 'var(--rh-green)' },
        ].map((s, i) => (
          <motion.div key={s.uri} className="mono" style={{
            fontSize: 11, padding: '6px 14px', borderRadius: 6, background: 'var(--surface-2)',
            border: `1px solid ${s.color}`, color: s.color,
          }} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}>
            {s.uri}
          </motion.div>
        ))}
        <motion.div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          SVID certificates · mTLS · zero static keys
        </motion.div>
      </div>
    ),
  },
  {
    id: 'tools',
    label: 'MCP Tool Control',
    position: 'Policy',
    question: '"How do I control what tools each agent can access?"',
    color: 'var(--rh-red)',
    detail: 'The MCP Gateway federates tools across agents and enforces access policies. Healthcare tools are available to all agents. FinServ tools are restricted to the finserv-agent. Sanctions screening requires explicit approval. Policy-as-code — not permission-by-default.',
    visual: () => (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-dim)', fontWeight: 500 }}>Tool</th>
              <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--ibm-blue)', fontWeight: 600 }}>Healthcare</th>
              <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--ibm-blue)', fontWeight: 600 }}>FinServ</th>
              <th style={{ textAlign: 'center', padding: '6px 10px', color: 'var(--rh-green)', fontWeight: 600 }}>Orchestrator</th>
            </tr>
          </thead>
          <tbody>
            {[
              { tool: 'drug_interaction_check', hc: 'allow', fs: 'allow', orch: 'allow' },
              { tool: 'fhir_patient_lookup', hc: 'allow', fs: 'deny', orch: 'allow' },
              { tool: 'score_transaction', hc: 'deny', fs: 'allow', orch: 'allow' },
              { tool: 'sanctions_screening', hc: 'deny', fs: 'restricted', orch: 'deny' },
            ].map((row, i) => (
              <motion.tr key={row.tool} style={{ borderBottom: '1px solid var(--border)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}>
                <td className="mono" style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{row.tool}</td>
                {[row.hc, row.fs, row.orch].map((v, j) => (
                  <td key={j} style={{ padding: '6px 10px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 4,
                      background: v === 'allow' ? 'var(--rh-green-dim)' : v === 'deny' ? 'var(--rh-red-dim)' : 'var(--rh-orange-dim)',
                      color: v === 'allow' ? 'var(--rh-green)' : v === 'deny' ? 'var(--rh-red)' : 'var(--rh-orange)',
                      fontWeight: 600,
                    }}>{v.toUpperCase()}</span>
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
]

export function Act01GovernArchitecture({ onComplete }: Props) {
  const [revealed, setRevealed] = useState(0)

  const totalSteps = LAYERS.length * 2

  const advance = () => {
    if (revealed < totalSteps) setRevealed(prev => prev + 1)
  }

  const allRevealed = revealed >= totalSteps

  return (
    <div className="demo-section">
      <h3><span className="section-num">01</span> The Governance Stack</h3>
      <div className="section-context">
        Four layers of control. Click to see the challenge —
        then click again to see the platform answer.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {LAYERS.map((layer, i) => {
          const questionStep = (i * 2) + 1
          const answerStep = (i * 2) + 2
          const showQuestion = revealed >= questionStep
          const showAnswer = revealed >= answerStep
          return (
          <AnimatePresence key={layer.id}>
            {showQuestion && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {i > 0 && <motion.div style={{ width: 2, height: 20, background: layer.color, margin: '0 auto' }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.3 }} />}
                <div className="step-card" style={{ borderLeft: `3px solid ${layer.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span className="step-num" style={{ background: layer.color, fontSize: 11 }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <strong>{layer.label}</strong>
                      <span style={{ fontSize: 10, marginLeft: 8, padding: '1px 8px', borderRadius: 4, background: 'var(--surface-2)', color: 'var(--text-disabled)', border: '1px solid var(--border)' }}>{layer.position}</span>
                    </div>
                  </div>
                  <motion.div style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: 10, fontWeight: 500 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>{layer.question}</motion.div>

                  {showAnswer && (
                    <>
                      <motion.div style={{ marginBottom: 12 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>{layer.visual()}</motion.div>
                      <motion.div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7 }} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>{layer.detail}</motion.div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          )
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: 20 }}>
        {!allRevealed ? (
          <button className="btn btn-secondary" onClick={advance}>
            {revealed === 0
              ? 'Start: The first challenge →'
              : revealed % 2 === 1
              ? `Show the answer: ${LAYERS[Math.floor((revealed - 1) / 2)].label} →`
              : 'Next challenge →'}
          </button>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div style={{ fontSize: 13, color: 'var(--rh-green)', fontWeight: 600, marginBottom: 16 }}>Registry → Discovery → Identity → Tool Control — agents governed as K8s resources</div>
            <button className="btn btn-primary" onClick={onComplete} style={{ background: 'var(--ibm-blue)' }}>See live agent discovery →</button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
