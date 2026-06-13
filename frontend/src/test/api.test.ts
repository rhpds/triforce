import { describe, it, expect } from 'vitest'

describe('F2: API Client', () => {
  it('exports healthcare API functions', async () => {
    const api = await import('../api/client')
    expect(api.classifyDocument).toBeDefined()
    expect(api.extractEntities).toBeDefined()
    expect(api.summarizeRecord).toBeDefined()
    expect(api.getHealthcareHealth).toBeDefined()
    expect(api.getHealthcareAgentCard).toBeDefined()
    expect(api.getHealthcareStats).toBeDefined()
  })

  it('exports finserv API functions', async () => {
    const api = await import('../api/client')
    expect(api.scoreTransaction).toBeDefined()
    expect(api.checkCompliance).toBeDefined()
    expect(api.assessRisk).toBeDefined()
  })

  it('exports orchestrator API functions', async () => {
    const api = await import('../api/client')
    expect(api.listAgents).toBeDefined()
    expect(api.startWorkflow).toBeDefined()
    expect(api.listWorkflows).toBeDefined()
    expect(api.getMetrics).toBeDefined()
    expect(api.startSyntheticLoad).toBeDefined()
    expect(api.stopSyntheticLoad).toBeDefined()
  })

  it('types module imports without error', async () => {
    const types = await import('../api/types')
    expect(types).toBeDefined()
  })
})
