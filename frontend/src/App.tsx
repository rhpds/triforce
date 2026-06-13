import { Routes, Route, Navigate } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { InferencePipeline } from './pages/InferencePipeline'
import { CostAnalysis } from './pages/CostAnalysis'
import { WorkflowRunner } from './pages/WorkflowRunner'
import { KafkaMonitor } from './pages/KafkaMonitor'
import { AgentDiscovery } from './pages/AgentDiscovery'
import { InferenceLog } from './pages/InferenceLog'

export default function App() {
  return (
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
  )
}
