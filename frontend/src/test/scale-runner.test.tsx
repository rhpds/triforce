import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('F2: ScaleTestRunner', () => {
  it('renders the runner container', async () => {
    const { ScaleTestRunner } = await import('../components/ScaleTestRunner')
    render(<ScaleTestRunner />)
    expect(screen.getByTestId('scale-runner')).toBeInTheDocument()
  })

  it('shows start button', async () => {
    const { ScaleTestRunner } = await import('../components/ScaleTestRunner')
    render(<ScaleTestRunner />)
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
  })

  it('shows target selector', async () => {
    const { ScaleTestRunner } = await import('../components/ScaleTestRunner')
    render(<ScaleTestRunner />)
    expect(screen.getByText(/Healthcare/)).toBeInTheDocument()
    expect(screen.getByText(/FinServ/)).toBeInTheDocument()
  })

  it('shows initial counters at zero', async () => {
    const { ScaleTestRunner } = await import('../components/ScaleTestRunner')
    render(<ScaleTestRunner />)
    expect(screen.getByTestId('counter-processed')).toHaveTextContent('0')
  })
})
