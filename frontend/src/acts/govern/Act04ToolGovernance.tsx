import { useState } from 'react'
import { motion } from 'motion/react'

interface Props { onComplete?: () => void }

const FALLBACK_TOOLS = [
  { name: 'fhir_patient_lookup', description: 'Look up patient record by ID' },
  { name: 'drug_interaction_check', description: 'Check drug-drug interactions' },
  { name: 'clinical_code_search', description: 'Search ICD-10/CPT codes' },
  { name: 'score_transaction', description: 'Score transaction for fraud risk' },
  { name: 'check_compliance', description: 'Check regulatory compliance' },
  { name: 'risk_profile_lookup', description: 'Look up customer risk profile' },
  { name: 'sanctions_screening', description: 'Screen against sanctions lists' },
  { name: 'audit_log_query', description: 'Query inference audit trail' },
]

const POLICY: Record<string, Record<string, string>> = {
  fhir_patient_lookup: { healthcare: 'allow', finserv: 'deny', orchestrator: 'allow' },
  drug_interaction_check: { healthcare: 'allow', finserv: 'allow', orchestrator: 'allow' },
  clinical_code_search: { healthcare: 'allow', finserv: 'deny', orchestrator: 'allow' },
  score_transaction: { healthcare: 'deny', finserv: 'allow', orchestrator: 'allow' },
  check_compliance: { healthcare: 'deny', finserv: 'allow', orchestrator: 'allow' },
  risk_profile_lookup: { healthcare: 'deny', finserv: 'allow', orchestrator: 'deny' },
  sanctions_screening: { healthcare: 'deny', finserv: 'restricted', orchestrator: 'deny' },
  audit_log_query: { healthcare: 'allow', finserv: 'allow', orchestrator: 'allow' },
}

export function Act04ToolGovernance({ onComplete }: Props) {
  const [tools, setTools] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [live, setLive] = useState(false)

  const listTools = async () => {
    setLoading(true)
    try {
      const resp = await fetch('/mcp-gateway/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 'list-1', method: 'tools/list', params: {} }),
      })
      const data = await resp.json()
      const result = data.result?.tools || []
      setTools(result.length > 0 ? result : FALLBACK_TOOLS)
      setLive(result.length > 0)
    } catch {
      setTools(FALLBACK_TOOLS)
      setLive(false)
    }
    setDone(true)
    setLoading(false)
  }

  return (
    <div className="demo-section">
      <h3><span className="section-num">04</span> Tool Governance</h3>
      <div className="section-context">
        The MCP Gateway federates tools across agents and enforces access policies.
        Not every agent should access every tool. Policy-as-code decides who can
        call what.
      </div>

      <div className="step-card" style={{ borderLeft: '3px solid var(--ibm-blue)' }}>
        <span className="step-num" style={{ background: 'var(--ibm-blue)' }}>1</span>
        <strong>List Federated Tools</strong>
        <div className="step-question">MCP Gateway → tools/list → show registered tools with access policies</div>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={listTools} disabled={loading}
            style={{ background: 'var(--ibm-blue)' }}>
            {loading ? 'Querying gateway...' : done ? 'Query again' : 'Query MCP Gateway'}
          </button>
        </div>

        {tools.length > 0 && (
          <motion.div style={{ marginTop: 16 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {!live && (
              <div style={{ fontSize: 10, color: 'var(--text-disabled)', textAlign: 'center', marginBottom: 8 }}>
                simulated policy — backend not connected
              </div>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-dim)', fontWeight: 500 }}>Tool</th>
                    <th style={{ textAlign: 'center', padding: '8px 10px', color: 'var(--ibm-blue)', fontWeight: 600 }}>Healthcare</th>
                    <th style={{ textAlign: 'center', padding: '8px 10px', color: 'var(--ibm-blue)', fontWeight: 600 }}>FinServ</th>
                    <th style={{ textAlign: 'center', padding: '8px 10px', color: 'var(--rh-green)', fontWeight: 600 }}>Orchestrator</th>
                  </tr>
                </thead>
                <tbody>
                  {tools.map((tool, i) => {
                    const policy = POLICY[tool.name] || { healthcare: 'deny', finserv: 'deny', orchestrator: 'deny' }
                    return (
                      <motion.tr key={tool.name} style={{ borderBottom: '1px solid var(--border)' }}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                        <td style={{ padding: '8px 10px' }}>
                          <div className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            {tool.name}
                            {!live && <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 4 }}>(simulated)</span>}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-disabled)' }}>{tool.description}</div>
                        </td>
                        {['healthcare', 'finserv', 'orchestrator'].map(agent => {
                          const v = policy[agent] || 'deny'
                          return (
                            <td key={agent} style={{ padding: '8px 10px', textAlign: 'center' }}>
                              <span style={{
                                fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                                background: v === 'allow' ? 'var(--rh-green-dim)' : v === 'deny' ? 'var(--rh-red-dim)' : 'var(--rh-orange-dim)',
                                color: v === 'allow' ? 'var(--rh-green)' : v === 'deny' ? 'var(--rh-red)' : 'var(--rh-orange)',
                              }}>{v.toUpperCase()}</span>
                            </td>
                          )
                        })}
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <motion.div className="card card-accent-ibm" style={{ textAlign: 'center', marginTop: 12 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {tools.length} tools federated · policy enforced per agent · <strong style={{ color: 'var(--ibm-blue)' }}>not permission-by-default</strong>
              </span>
            </motion.div>
          </motion.div>
        )}
      </div>

      {done && (
        <motion.div style={{ textAlign: 'center', marginTop: 24 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <button className="btn btn-primary" onClick={onComplete} style={{ background: 'var(--ibm-blue)' }}>
            The audit trail →
          </button>
        </motion.div>
      )}
    </div>
  )
}
