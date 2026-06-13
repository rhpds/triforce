import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('F2: GraphVisualization', () => {
  const mockSteps = [
    { name: 'Classify', status: 'complete', latency_ms: 850, result: 'discharge_summary' },
    { name: 'Extract Entities', status: 'complete', latency_ms: 5200, result: '6 entities' },
    { name: 'Check Interactions', status: 'skipped', latency_ms: 0, result: 'no medications' },
    { name: 'Summarize', status: 'running', latency_ms: 0, result: '' },
  ]

  it('renders all step nodes', async () => {
    const { GraphVisualization } = await import('../components/GraphVisualization')
    render(<GraphVisualization steps={mockSteps} />)
    expect(screen.getByText('Classify')).toBeInTheDocument()
    expect(screen.getByText('Extract Entities')).toBeInTheDocument()
    expect(screen.getByText('Summarize')).toBeInTheDocument()
  })

  it('shows latency for completed steps', async () => {
    const { GraphVisualization } = await import('../components/GraphVisualization')
    render(<GraphVisualization steps={mockSteps} />)
    expect(screen.getByText(/850ms/)).toBeInTheDocument()
    expect(screen.getByText(/5200ms/)).toBeInTheDocument()
  })

  it('shows result preview for completed steps', async () => {
    const { GraphVisualization } = await import('../components/GraphVisualization')
    render(<GraphVisualization steps={mockSteps} />)
    expect(screen.getByText(/discharge_summary/)).toBeInTheDocument()
  })

  it('renders with empty steps', async () => {
    const { GraphVisualization } = await import('../components/GraphVisualization')
    render(<GraphVisualization steps={[]} />)
    expect(screen.getByTestId('graph-viz')).toBeInTheDocument()
  })
})
