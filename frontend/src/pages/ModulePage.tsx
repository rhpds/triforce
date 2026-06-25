import { useParams } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const MODULE_PAGES: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'semantic-routing': lazy(() => import('./modules/ModuleSemanticRouting')),
  'conditional-pipeline': lazy(() => import('./modules/ModuleConditionalPipeline')),
  'mcp-tools': lazy(() => import('./modules/ModuleMcpTools')),
  'model-optimization': lazy(() => import('./modules/ModuleModelOptimization')),
  'batch-processing': lazy(() => import('./modules/ModuleBatchProcessing')),
  'replica-scaling': lazy(() => import('./modules/ModuleReplicaScaling')),
  'llmd-inference': lazy(() => import('./modules/ModuleLlmd')),
  'adaptive-cache': lazy(() => import('./modules/ModuleAdaptiveCache')),
  'speculative': lazy(() => import('./modules/ModuleSpeculative')),
  'benchmarking': lazy(() => import('./modules/ModuleBenchmarking')),
  'fusion': lazy(() => import('./modules/ModuleFusion')),
  'heterogeneous': lazy(() => import('./modules/ModuleHeterogeneous')),
  'pipeline': lazy(() => import('./modules/ModulePipeline')),
}

export function ModulePage() {
  const { moduleName } = useParams<{ moduleName: string }>()
  const Component = moduleName ? MODULE_PAGES[moduleName] : null

  if (!Component) {
    return (
      <div className="demo-section" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <h2>Module not found</h2>
        <p style={{ color: 'var(--text-dim)' }}>
          Module "{moduleName}" doesn't have a dedicated page yet.
        </p>
        <a href="/" className="btn btn-secondary">← Back to Demo</a>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="demo-section" style={{ textAlign: 'center', padding: '48px' }}>
        <div style={{ color: 'var(--text-dim)' }}>Loading module...</div>
      </div>
    }>
      <Component />
    </Suspense>
  )
}
