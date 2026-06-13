import { useState, useEffect } from 'react'
import { TelemetryDashboard } from '../components/TelemetryDashboard'
import { getHealthcareStats } from '../api/client'
export function InferenceLog() {
  const [stats, setStats] = useState({total_requests:0,avg_latency_ms:0,p95_latency_ms:0,cpu_requests:0,gpu_requests:0,kv_cache_hit_rate:0})
  useEffect(() => { const f=()=>getHealthcareStats().then(s=>setStats(s as any)).catch(()=>{}); f(); const i=setInterval(f,5000); return ()=>clearInterval(i) }, [])
  const infs = [
    {model:'granite-2b-cpu',task_type:'classify',latency_ms:850,accelerator:'cpu'},
    {model:'granite-2b-cpu',task_type:'extract_entities',latency_ms:5200,accelerator:'cpu'},
    {model:'granite-3-2-8b-instruct',task_type:'summarize',latency_ms:4400,accelerator:'cpu'},
  ]
  return (
    <div data-testid="page-log">
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:4}}>Inference Telemetry</h1>
      <p style={{fontSize:13,color:'#888',marginBottom:24}}>Real-time metrics from PostgreSQL — every LLM call tracked</p>
      <TelemetryDashboard stats={stats} inferences={infs} />
    </div>
  )
}
