interface AgentNode {
  name: string
  status: string
  url: string
  skills: { id: string; name: string; description: string }[]
}

interface Props {
  agents: AgentNode[]
  activeWorkflow?: boolean
}

const STATUS_COLORS: Record<string, string> = {
  active: '#2ecc71',
  inactive: '#888',
  error: '#e74c3c',
}

const AGENT_POSITIONS: Record<string, { x: number; y: number; icon: string }> = {
  'Healthcare Agent': { x: 120, y: 80, icon: '🏥' },
  'Financial Services Agent': { x: 420, y: 80, icon: '🏦' },
  'Orchestrator': { x: 270, y: 220, icon: '🔄' },
}

export function AgentTopology({ agents, activeWorkflow }: Props) {
  if (agents.length === 0) {
    return (
      <div data-testid="agent-topology" style={{ padding: 24, textAlign: 'center', color: '#888' }}>
        No agents discovered
      </div>
    )
  }

  return (
    <div data-testid="agent-topology" style={{ position: 'relative' }}>
      <svg width="560" height="300" style={{ display: 'block' }}>
        {/* Connection lines */}
        {agents.length >= 3 && (
          <>
            {/* Orchestrator → Healthcare (A2A) */}
            <line x1="270" y1="200" x2="150" y2="120" stroke="#0071C5" strokeWidth="2" strokeDasharray={activeWorkflow ? 'none' : '6,4'}>
              {activeWorkflow && <animate attributeName="stroke-dashoffset" values="20;0" dur="1s" repeatCount="indefinite" />}
            </line>
            {/* Orchestrator → FinServ (A2A) */}
            <line x1="270" y1="200" x2="420" y2="120" stroke="#0071C5" strokeWidth="2" strokeDasharray={activeWorkflow ? 'none' : '6,4'}>
              {activeWorkflow && <animate attributeName="stroke-dashoffset" values="20;0" dur="1s" repeatCount="indefinite" />}
            </line>
            {/* Healthcare ↔ FinServ (Kafka) */}
            <line x1="180" y1="80" x2="380" y2="80" stroke="#2ecc71" strokeWidth="1.5" strokeDasharray="4,6" />
            {/* Labels */}
            <text x="185" y="170" fontSize="10" fill="#0071C5" fontWeight="600">A2A</text>
            <text x="350" y="170" fontSize="10" fill="#0071C5" fontWeight="600">A2A</text>
            <text x="265" y="70" fontSize="10" fill="#2ecc71" fontWeight="600">Kafka</text>
          </>
        )}
      </svg>

      {/* Agent nodes overlaid on SVG */}
      {agents.map(agent => {
        const pos = AGENT_POSITIONS[agent.name] || { x: 270, y: 150, icon: '🤖' }
        const color = STATUS_COLORS[agent.status] || '#888'

        return (
          <div
            key={agent.name}
            style={{
              position: 'absolute',
              left: pos.x - 50,
              top: pos.y - 30,
              width: 100,
              textAlign: 'center',
            }}
          >
            {/* Node circle */}
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: `3px solid ${color}`,
              backgroundColor: 'rgba(20,30,50,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 6px',
              fontSize: 24,
              boxShadow: agent.status === 'active' ? `0 0 12px ${color}40` : 'none',
            }}>
              {pos.icon}
            </div>

            {/* Status dot */}
            <div
              data-testid="agent-status"
              style={{
                position: 'absolute',
                top: 0,
                right: 18,
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: color,
                border: '2px solid #0A1628',
              }}
            />

            {/* Name */}
            <div style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>
              {agent.name}
            </div>

            {/* Skills count */}
            {agent.skills.length > 0 && (
              <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                {agent.skills.length} skill{agent.skills.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
