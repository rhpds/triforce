import { useState } from 'react'
import { GraphVisualization } from '../components/GraphVisualization'
import { startWorkflow, listWorkflows } from '../api/client'
export function WorkflowRunner() {
  const [workflows, setWorkflows] = useState<any[]>([])
  const [running, setRunning] = useState(false)
  const run = async () => {
    setRunning(true)
    try {
      await startWorkflow('patient_financial_risk', { text: 'Patient with diabetes on Metformin', customer_id: 'cust-demo' })
      await new Promise(r => setTimeout(r, 10000))
      setWorkflows(await listWorkflows())
    } catch {}
    setRunning(false)
  }
  return (
    <div data-testid="page-workflow">
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:4}}>Cross-Agent Workflows</h1>
      <p style={{fontSize:13,color:'#888',marginBottom:24}}>Orchestrator dispatches multi-agent workflows via A2A</p>
      <button onClick={run} disabled={running} style={{padding:'10px 24px',borderRadius:6,border:'none',backgroundColor:running?'#555':'#2ecc71',color:'#fff',fontSize:14,fontWeight:600,cursor:running?'default':'pointer',marginBottom:24}}>
        {running ? 'Running...' : 'Run Patient Financial Risk Workflow'}
      </button>
      {workflows.map(wf => (
        <div key={wf.id} style={{padding:16,borderRadius:8,marginBottom:12,backgroundColor:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
          <div style={{fontSize:14,fontWeight:600}}>{wf.id} — {wf.status} ({wf.duration_ms}ms)</div>
          <div style={{fontSize:12,color:'#888'}}>Agents: {wf.agents_involved?.join(', ')||'pending'}</div>
          {wf.steps && <GraphVisualization steps={wf.steps.map((s:any) => ({name:s.agent,status:s.status==='completed'?'complete':s.status,latency_ms:s.inference_ms||0,result:s.skill}))} />}
        </div>
      ))}
    </div>
  )
}
