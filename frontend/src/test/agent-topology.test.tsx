import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('F2: AgentTopology', () => {
  const mockAgents = [
    { name: 'Healthcare Agent', status: 'active', url: 'http://localhost:8081', skills: [{ id: 'classify', name: 'Classify', description: 'Classify docs' }] },
    { name: 'Financial Services Agent', status: 'active', url: 'http://localhost:8082', skills: [{ id: 'score', name: 'Score', description: 'Score transactions' }] },
    { name: 'Orchestrator', status: 'active', url: 'http://localhost:8083', skills: [] },
  ]

  it('renders the topology container', async () => {
    const { AgentTopology } = await import('../components/AgentTopology')
    render(<AgentTopology agents={mockAgents} />)
    expect(screen.getByTestId('agent-topology')).toBeInTheDocument()
  })

  it('shows all agent names', async () => {
    const { AgentTopology } = await import('../components/AgentTopology')
    render(<AgentTopology agents={mockAgents} />)
    expect(screen.getByText('Healthcare Agent')).toBeInTheDocument()
    expect(screen.getByText('Financial Services Agent')).toBeInTheDocument()
    expect(screen.getByText('Orchestrator')).toBeInTheDocument()
  })

  it('shows agent status indicators', async () => {
    const { AgentTopology } = await import('../components/AgentTopology')
    render(<AgentTopology agents={mockAgents} />)
    const indicators = screen.getAllByTestId('agent-status')
    expect(indicators.length).toBe(3)
  })

  it('renders with empty agents list', async () => {
    const { AgentTopology } = await import('../components/AgentTopology')
    render(<AgentTopology agents={[]} />)
    expect(screen.getByTestId('agent-topology')).toBeInTheDocument()
  })
})
