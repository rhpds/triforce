import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

describe('F2: TriforceLayout', () => {
  it('renders with intel theme', async () => {
    const { TriforceLayout } = await import('../components/TriforceLayout')
    render(
      <MemoryRouter>
        <TriforceLayout themeName="intel"><div>content</div></TriforceLayout>
      </MemoryRouter>
    )
    expect(screen.getByTestId('triforce-layout')).toBeInTheDocument()
  })

  it('displays theme logo text', async () => {
    const { TriforceLayout } = await import('../components/TriforceLayout')
    render(
      <MemoryRouter>
        <TriforceLayout themeName="intel"><div>content</div></TriforceLayout>
      </MemoryRouter>
    )
    expect(screen.getByText(/Xeon/)).toBeInTheDocument()
  })

  it('renders navigation links', async () => {
    const { TriforceLayout } = await import('../components/TriforceLayout')
    render(
      <MemoryRouter>
        <TriforceLayout themeName="redhat"><div>content</div></TriforceLayout>
      </MemoryRouter>
    )
    expect(screen.getByText(/Dashboard/)).toBeInTheDocument()
    expect(screen.getByText(/Pipeline/)).toBeInTheDocument()
  })

  it('renders children', async () => {
    const { TriforceLayout } = await import('../components/TriforceLayout')
    render(
      <MemoryRouter>
        <TriforceLayout themeName="intel"><div data-testid="child">hello</div></TriforceLayout>
      </MemoryRouter>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
