import { useState, useEffect } from 'react'
import { getMetrics } from '../api/client'
const TOPICS = [
  { name: 'healthcare.patients.synthetic', dir: 'IN', v: 'Healthcare' },
  { name: 'healthcare.analysis.results', dir: 'OUT', v: 'Healthcare' },
  { name: 'healthcare.alerts', dir: 'OUT', v: 'Healthcare' },
  { name: 'finserv.transactions.synthetic', dir: 'IN', v: 'FinServ' },
  { name: 'finserv.fraud.scores', dir: 'OUT', v: 'FinServ' },
  { name: 'finserv.compliance.decisions', dir: 'OUT', v: 'FinServ' },
  { name: 'finserv.alerts', dir: 'OUT', v: 'FinServ' },
  { name: 'orchestrator.workflows', dir: 'BOTH', v: 'Orchestrator' },
]
export function KafkaMonitor() {
  const [k, setK] = useState({messages_produced:0,messages_consumed:0,consumer_lag:0})
  useEffect(() => { const i = setInterval(()=>getMetrics().then(m=>setK(m.kafka)).catch(()=>{}),5000); getMetrics().then(m=>setK(m.kafka)).catch(()=>{}); return ()=>clearInterval(i) }, [])
  return (
    <div data-testid="page-kafka">
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:4}}>Kafka Event Pipeline</h1>
      <p style={{fontSize:13,color:'#888',marginBottom:24}}>Redpanda event streaming across verticals</p>
      <div style={{display:'flex',gap:16,marginBottom:24}}>
        {[{l:'Produced',v:k.messages_produced,c:'#2ecc71'},{l:'Consumed',v:k.messages_consumed,c:'#00AEEF'},{l:'Lag',v:k.consumer_lag,c:k.consumer_lag>10?'#e74c3c':'#2ecc71'}].map(m=>(
          <div key={m.l} style={{padding:'12px 20px',borderRadius:8,backgroundColor:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
            <div style={{fontSize:10,color:'#888',textTransform:'uppercase'}}>{m.l}</div>
            <div style={{fontSize:24,fontWeight:700,color:m.c}}>{m.v}</div>
          </div>
        ))}
      </div>
      {TOPICS.map(t=>(
        <div key={t.name} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 16px',marginBottom:4,borderRadius:6,backgroundColor:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)'}}>
          <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,backgroundColor:t.dir==='IN'?'rgba(46,204,113,0.15)':'rgba(0,174,239,0.15)',color:t.dir==='IN'?'#2ecc71':'#00AEEF'}}>{t.dir}</span>
          <span style={{fontSize:13,fontFamily:'monospace',flex:1}}>{t.name}</span>
          <span style={{fontSize:11,color:'#888'}}>{t.v}</span>
        </div>
      ))}
    </div>
  )
}
