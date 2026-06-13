import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { TriforceLayout } from './components/TriforceLayout'
import { Dashboard } from './pages/Dashboard'
import { InferencePipeline } from './pages/InferencePipeline'
import { CostAnalysis } from './pages/CostAnalysis'
import { WorkflowRunner } from './pages/WorkflowRunner'
import { KafkaMonitor } from './pages/KafkaMonitor'
import { AgentDiscovery } from './pages/AgentDiscovery'
import { InferenceLog } from './pages/InferenceLog'

export default function App() {
  const [params] = useSearchParams()
  const theme = params.get('theme') || 'intel'

  return (
    <TriforceLayout themeName={theme}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pipeline" element={<InferencePipeline />} />
        <Route path="/cost" element={<CostAnalysis />} />
        <Route path="/workflow" element={<WorkflowRunner />} />
        <Route path="/kafka" element={<KafkaMonitor />} />
        <Route path="/agents" element={<AgentDiscovery />} />
        <Route path="/log" element={<InferenceLog />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </TriforceLayout>
  )
}
