import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Story Acts', () => {
  it('Act00 renders three questions', async () => {
    const { Act00Story } = await import('../acts/Act00Story')
    render(<Act00Story />)
    expect(screen.getByText(/Can I afford AI at scale/)).toBeInTheDocument()
    expect(screen.getByText(/Can I run it on hardware I own/)).toBeInTheDocument()
    expect(screen.getByText(/Can I trust it with my data/)).toBeInTheDocument()
  })

  it('Act01 renders architecture', async () => {
    const { Act01Architecture } = await import('../acts/Act01Architecture')
    render(<Act01Architecture />)
    expect(screen.getByText('Semantic Router')).toBeInTheDocument()
    expect(screen.getByText('Healthcare')).toBeInTheDocument()
    expect(screen.getByText('FinServ')).toBeInTheDocument()
  })

  it('Act02 renders inference button', async () => {
    const { Act02Inference } = await import('../acts/Act02Inference')
    render(<Act02Inference />)
    expect(screen.getByText('Classify on Xeon 6')).toBeInTheDocument()
  })

  it('Act03 renders cost bars', async () => {
    const { Act03Cost } = await import('../acts/Act03Cost')
    render(<Act03Cost />)
    expect(screen.getByText('Intel Xeon 6')).toBeInTheDocument()
    expect(screen.getByText('Claude Opus')).toBeInTheDocument()
  })

  it('Act04 renders discover button', async () => {
    const { Act04Platform } = await import('../acts/Act04Platform')
    render(<Act04Platform />)
    expect(screen.getByText('Discover Agents')).toBeInTheDocument()
  })

  it('Act05 renders honest comparison', async () => {
    const { Act05HonestQuestion } = await import('../acts/Act05HonestQuestion')
    render(<Act05HonestQuestion />)
    expect(screen.getByText(/fast enough at 1\/10th the cost/)).toBeInTheDocument()
  })

  it('App renders header', async () => {
    const { default: App } = await import('../App')
    render(<App />)
    expect(screen.getByText('TRIFORCE')).toBeInTheDocument()
  })
})
