import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

describe('F1: Page Routing', () => {
  it('Dashboard page renders', async () => {
    const { Dashboard } = await import('../pages/Dashboard')
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.getByTestId('page-dashboard')).toBeInTheDocument()
  })

  it('InferencePipeline page renders', async () => {
    const { InferencePipeline } = await import('../pages/InferencePipeline')
    render(<MemoryRouter><InferencePipeline /></MemoryRouter>)
    expect(screen.getByTestId('page-pipeline')).toBeInTheDocument()
  })

  it('CostAnalysis page renders', async () => {
    const { CostAnalysis } = await import('../pages/CostAnalysis')
    render(<MemoryRouter><CostAnalysis /></MemoryRouter>)
    expect(screen.getByTestId('page-cost')).toBeInTheDocument()
  })

  it('WorkflowRunner page renders', async () => {
    const { WorkflowRunner } = await import('../pages/WorkflowRunner')
    render(<MemoryRouter><WorkflowRunner /></MemoryRouter>)
    expect(screen.getByTestId('page-workflow')).toBeInTheDocument()
  })

  it('KafkaMonitor page renders', async () => {
    const { KafkaMonitor } = await import('../pages/KafkaMonitor')
    render(<MemoryRouter><KafkaMonitor /></MemoryRouter>)
    expect(screen.getByTestId('page-kafka')).toBeInTheDocument()
  })

  it('AgentDiscovery page renders', async () => {
    const { AgentDiscovery } = await import('../pages/AgentDiscovery')
    render(<MemoryRouter><AgentDiscovery /></MemoryRouter>)
    expect(screen.getByTestId('page-agents')).toBeInTheDocument()
  })

  it('InferenceLog page renders', async () => {
    const { InferenceLog } = await import('../pages/InferenceLog')
    render(<MemoryRouter><InferenceLog /></MemoryRouter>)
    expect(screen.getByTestId('page-log')).toBeInTheDocument()
  })

  it('App component renders without crashing', async () => {
    const { default: App } = await import('../App')
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(document.body).toBeDefined()
  })
})
