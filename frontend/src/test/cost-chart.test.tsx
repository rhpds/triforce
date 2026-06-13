import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('F2: CostChart', () => {
  it('renders the chart container', async () => {
    const { CostChart } = await import('../components/CostChart')
    render(<CostChart />)
    expect(screen.getByTestId('cost-chart')).toBeInTheDocument()
  })

  it('shows Xeon 6 as baseline', async () => {
    const { CostChart } = await import('../components/CostChart')
    render(<CostChart />)
    expect(screen.getAllByText('Intel Xeon 6').length).toBeGreaterThan(0)
  })

  it('shows GPU comparisons', async () => {
    const { CostChart } = await import('../components/CostChart')
    render(<CostChart />)
    expect(screen.getByText('NVIDIA H100')).toBeInTheDocument()
  })

  it('shows API model comparisons', async () => {
    const { CostChart } = await import('../components/CostChart')
    render(<CostChart />)
    expect(screen.getByText('Claude Opus')).toBeInTheDocument()
  })
})
