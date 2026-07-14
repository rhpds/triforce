import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

describe('Story Acts', () => {
  it('Act00 renders triforce intro', async () => {
    const { Act00Story } = await import('../acts/Act00Story')
    render(<Act00Story />)
    expect(screen.getByText(/click to continue/)).toBeInTheDocument()
  })

  it('Act01 renders architecture with click-through layers', async () => {
    const { Act01Architecture } = await import('../acts/Act01Architecture')
    render(<Act01Architecture />)
    expect(screen.getByText(/Architecture/)).toBeInTheDocument()
  })

  it('Act02 renders pipeline button and nodes', async () => {
    const { Act02Inference } = await import('../acts/Act02Inference')
    render(<MemoryRouter><Act02Inference /></MemoryRouter>)
    expect(screen.getByText(/Run Pipeline on Xeon 6/)).toBeInTheDocument()
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
    render(<MemoryRouter><Act04Efficiency /></MemoryRouter>)
    expect(screen.getByText(/The Efficiency Stack/)).toBeInTheDocument()
    expect(screen.getByText(/Show the first layer/)).toBeInTheDocument()
  })

  it('Act06 renders punchline', async () => {
    const { Act05HonestQuestion } = await import('../acts/Act05HonestQuestion')
    render(<Act05HonestQuestion />)
    expect(screen.getByText(/The Punchline/)).toBeInTheDocument()
    expect(screen.getByText(/system decides for you/)).toBeInTheDocument()
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
    expect(screen.getByText(/The Security Stack/)).toBeInTheDocument()
  })

  it('Act02 Attestation renders handshake steps', async () => {
    const { Act02Attestation } = await import('../acts/secure/Act02Attestation')
    render(<Act02Attestation />)
    expect(screen.getByText(/Attestation Handshake/)).toBeInTheDocument()
    expect(screen.getByText(/Start: Pod Starts/)).toBeInTheDocument()
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

describe('Virt Acts', () => {
  it('Act00 Virt renders intro', async () => {
    const { Act00VirtStory } = await import('../acts/virt/Act00VirtStory')
    render(<Act00VirtStory />)
    expect(screen.getByText(/click to continue/)).toBeInTheDocument()
  })

  it('Act01 Virt renders coexistence stack', async () => {
    const { Act01VirtArchitecture } = await import('../acts/virt/Act01VirtArchitecture')
    render(<Act01VirtArchitecture />)
    expect(screen.getByText(/The Coexistence Stack/)).toBeInTheDocument()
  })

  it('Act02 Virt renders one server', async () => {
    const { Act02OneServer } = await import('../acts/virt/Act02OneServer')
    render(<Act02OneServer />)
    expect(screen.getByText(/One Server, Two Worlds/)).toBeInTheDocument()
    expect(screen.getByText(/Add the legacy VM/)).toBeInTheDocument()
  })

  it('Act03 Virt renders legacy meets AI', async () => {
    const { Act03LegacyMeetsAI } = await import('../acts/virt/Act03LegacyMeetsAI')
    render(<Act03LegacyMeetsAI />)
    expect(screen.getByText(/Legacy Meets AI/)).toBeInTheDocument()
    expect(screen.getByText(/Simulate VM/)).toBeInTheDocument()
  })

  it('Act04 Virt renders migration path', async () => {
    const { Act04MigrationPath } = await import('../acts/virt/Act04MigrationPath')
    render(<Act04MigrationPath />)
    expect(screen.getByText(/The Migration Path/)).toBeInTheDocument()
  })

  it('Act05 Virt renders tradeoff', async () => {
    const { Act05VirtTradeoff } = await import('../acts/virt/Act05VirtTradeoff')
    render(<Act05VirtTradeoff />)
    expect(screen.getByText(/The Honest Tradeoff/)).toBeInTheDocument()
  })

  it('Act06 Virt punchline renders', async () => {
    const { Act06VirtPunchline } = await import('../acts/virt/Act06VirtPunchline')
    render(<Act06VirtPunchline />)
    expect(screen.getByText(/virtualization.enabled=true/)).toBeInTheDocument()
  })
})

