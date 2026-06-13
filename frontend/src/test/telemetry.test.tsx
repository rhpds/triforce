import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('F2: TelemetryDashboard', () => {
  const mockStats = {
    total_requests: 97,
    avg_latency_ms: 3145,
    p95_latency_ms: 6797,
    cpu_requests: 97,
    gpu_requests: 0,
    kv_cache_hit_rate: 0,
  }

  const mockInferences = [
    { model: 'granite-4-0-h-tiny', task_type: 'classify', latency_ms: 850, accelerator: 'cpu' },
    { model: 'granite-4-0-h-tiny', task_type: 'ner', latency_ms: 5200, accelerator: 'cpu' },
    { model: 'granite-3-2-8b-instruct', task_type: 'summarize', latency_ms: 4400, accelerator: 'cpu' },
  ]

  it('renders the dashboard container', async () => {
    const { TelemetryDashboard } = await import('../components/TelemetryDashboard')
    render(<TelemetryDashboard stats={mockStats} inferences={mockInferences} />)
    expect(screen.getByTestId('telemetry-dashboard')).toBeInTheDocument()
  })

  it('shows KPI cards', async () => {
    const { TelemetryDashboard } = await import('../components/TelemetryDashboard')
    render(<TelemetryDashboard stats={mockStats} inferences={mockInferences} />)
    expect(screen.getByText('97')).toBeInTheDocument()
    expect(screen.getByText(/3,145/)).toBeInTheDocument()
  })

  it('shows 100% CPU badge', async () => {
    const { TelemetryDashboard } = await import('../components/TelemetryDashboard')
    render(<TelemetryDashboard stats={mockStats} inferences={mockInferences} />)
    expect(screen.getAllByText(/100%/).length).toBeGreaterThan(0)
  })

  it('shows inference log entries', async () => {
    const { TelemetryDashboard } = await import('../components/TelemetryDashboard')
    render(<TelemetryDashboard stats={mockStats} inferences={mockInferences} />)
    expect(screen.getAllByText('granite-4-0-h-tiny').length).toBeGreaterThan(0)
  })
})
