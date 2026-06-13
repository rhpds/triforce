import { describe, it, expect } from 'vitest'

describe('F0: Theme System', () => {
  it('exports intel theme with correct properties', async () => {
    const { intelTheme } = await import('../themes/intel')
    expect(intelTheme.name).toBe('intel')
    expect(intelTheme.displayName).toBe('Intel')
    expect(intelTheme.headline).toContain('GPU')
    expect(intelTheme.mode).toBe('dark')
    expect(intelTheme.colors.primary).toBeDefined()
    expect(intelTheme.colors.background).toBeDefined()
    expect(intelTheme.logo).toBeDefined()
  })

  it('exports redhat theme with correct properties', async () => {
    const { redhatTheme } = await import('../themes/redhat')
    expect(redhatTheme.name).toBe('redhat')
    expect(redhatTheme.displayName).toBe('Red Hat')
    expect(redhatTheme.headline).toContain('platform')
    expect(redhatTheme.mode).toBe('light')
  })

  it('exports ibm theme with correct properties', async () => {
    const { ibmTheme } = await import('../themes/ibm')
    expect(ibmTheme.name).toBe('ibm')
    expect(ibmTheme.displayName).toBe('IBM')
    expect(ibmTheme.headline).toContain('agent')
    expect(ibmTheme.mode).toBe('light')
  })

  it('all themes have consistent shape', async () => {
    const { intelTheme } = await import('../themes/intel')
    const { redhatTheme } = await import('../themes/redhat')
    const { ibmTheme } = await import('../themes/ibm')

    const requiredKeys = ['name', 'displayName', 'headline', 'subheadline', 'mode', 'colors', 'logo', 'pages']
    for (const theme of [intelTheme, redhatTheme, ibmTheme]) {
      for (const key of requiredKeys) {
        expect(theme).toHaveProperty(key)
      }
    }
  })

  it('getTheme returns correct theme by name', async () => {
    const { getTheme } = await import('../themes')
    expect(getTheme('intel').name).toBe('intel')
    expect(getTheme('redhat').name).toBe('redhat')
    expect(getTheme('ibm').name).toBe('ibm')
    expect(getTheme('unknown').name).toBe('intel')
  })

  it('each theme defines page emphasis order', async () => {
    const { intelTheme } = await import('../themes/intel')
    const { redhatTheme } = await import('../themes/redhat')
    const { ibmTheme } = await import('../themes/ibm')

    expect(intelTheme.pages[0]).toBe('pipeline')
    expect(redhatTheme.pages[0]).toBe('dashboard')
    expect(ibmTheme.pages[0]).toBe('agents')
  })
})
