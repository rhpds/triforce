import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Story Acts', () => {
  it('Act00 renders triforce intro', async () => {
    const { Act00Story } = await import('../acts/Act00Story')
    render(<Act00Story />)
    expect(screen.getByText(/click to continue/)).toBeInTheDocument()
  })

  it('Act01 renders architecture with click-through layers', async () => {
    const { Act01Architecture } = await import('../acts/Act01Architecture')
    render(<Act01Architecture />)
    expect(screen.getByText(/Start: Intelligent Routing/)).toBeInTheDocument()
    expect(screen.getByText(/Architecture/)).toBeInTheDocument()
  })

  it('Act02 renders pipeline button and nodes', async () => {
    const { Act02Inference } = await import('../acts/Act02Inference')
    render(<Act02Inference />)
    expect(screen.getByText(/Run Pipeline on Xeon 6/)).toBeInTheDocument()
    expect(screen.getByText('Classify')).toBeInTheDocument()
    expect(screen.getByText('Extract Entities')).toBeInTheDocument()
    expect(screen.getByText('Summarize')).toBeInTheDocument()
  })

  it('Act03 renders cost scale selector', async () => {
    const { Act03Cost } = await import('../acts/Act03Cost')
    render(<Act03Cost />)
    expect(screen.getByText(/Start at 10K records/)).toBeInTheDocument()
    expect(screen.getByText(/Cost at Scale/)).toBeInTheDocument()
  })

  it('Act04 renders scale test buttons', async () => {
    const { Act04Scale } = await import('../acts/Act04Scale')
    render(<Act04Scale />)
    expect(screen.getByText(/Scale & Tradeoffs/)).toBeInTheDocument()
    expect(screen.getByText(/Run 10 records/)).toBeInTheDocument()
  })

  it('Act05 renders efficiency mechanisms', async () => {
    const { Act04Efficiency } = await import('../acts/Act04Efficiency')
    render(<Act04Efficiency />)
    expect(screen.getByText(/The Efficiency Stack/)).toBeInTheDocument()
    expect(screen.getByText(/Show the first layer/)).toBeInTheDocument()
  })

  it('Act06 renders punchline', async () => {
    const { Act05HonestQuestion } = await import('../acts/Act05HonestQuestion')
    render(<Act05HonestQuestion />)
    expect(screen.getByText(/The Punchline/)).toBeInTheDocument()
    expect(screen.getByText(/fast enough at \$0/)).toBeInTheDocument()
  })

  it('App renders start screen', async () => {
    const { default: App } = await import('../App')
    render(<App />)
    expect(screen.getByText(/click to begin/)).toBeInTheDocument()
  })
})
