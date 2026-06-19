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

describe('Secure Acts', () => {
  it('Act00 Secure renders triforce intro', async () => {
    const { Act00SecureStory } = await import('../acts/secure/Act00SecureStory')
    render(<Act00SecureStory />)
    expect(screen.getByText(/click to continue/)).toBeInTheDocument()
  })

  it('Act01 TDX renders architecture layers', async () => {
    const { Act01TdxArchitecture } = await import('../acts/secure/Act01TdxArchitecture')
    render(<Act01TdxArchitecture />)
    expect(screen.getByText(/How TDX Protects/)).toBeInTheDocument()
    expect(screen.getByText(/Start: The Vulnerability/)).toBeInTheDocument()
  })

  it('Act02 Attestation renders flow buttons', async () => {
    const { Act02Attestation } = await import('../acts/secure/Act02Attestation')
    render(<Act02Attestation />)
    expect(screen.getByText(/Run with TDX/)).toBeInTheDocument()
    expect(screen.getByText(/Run without TDX/)).toBeInTheDocument()
  })

  it('Act03 OneLine renders YAML comparison', async () => {
    const { Act03OneLine } = await import('../acts/secure/Act03OneLine')
    render(<Act03OneLine />)
    expect(screen.getByText(/One Line Changes Everything/)).toBeInTheDocument()
    expect(screen.getByText(/Standard Deploy/)).toBeInTheDocument()
    expect(screen.getByText(/Confidential Deploy/)).toBeInTheDocument()
  })

  it('Act04 Confidential renders pipeline button', async () => {
    const { Act04ConfidentialInference } = await import('../acts/secure/Act04ConfidentialInference')
    render(<Act04ConfidentialInference />)
    expect(screen.getByText(/Run Confidential Pipeline/)).toBeInTheDocument()
  })

  it('Act05 Secure tradeoff renders comparison', async () => {
    const { Act05SecureTradeoff } = await import('../acts/secure/Act05SecureTradeoff')
    render(<Act05SecureTradeoff />)
    expect(screen.getByText(/The Honest Tradeoff/)).toBeInTheDocument()
    expect(screen.getByText(/AES-256 encrypted/)).toBeInTheDocument()
  })

  it('Act06 Secure punchline renders', async () => {
    const { Act06SecurePunchline } = await import('../acts/secure/Act06SecurePunchline')
    render(<Act06SecurePunchline />)
    expect(screen.getAllByText(/runtimeClassName: kata-cc/).length).toBeGreaterThan(0)
  })
})
