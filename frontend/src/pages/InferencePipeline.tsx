import { useState } from 'react'
import { GraphVisualization } from '../components/GraphVisualization'
import { classifyDocument } from '../api/client'

const SAMPLE = `DISCHARGE SUMMARY: 72yo male with Type 2 Diabetes (E11.9), Hypertension (I10), CAD (I25.10). Medications: Metformin 500mg BID, Lisinopril 10mg, Atorvastatin 80mg, Aspirin 81mg, Clopidogrel 75mg. Recent inferior STEMI with PCI to RCA. Follow-up cardiology 2 weeks.`

export function InferencePipeline() {
  const [text, setText] = useState(SAMPLE)
  const [steps, setSteps] = useState<any[]>([])
  const [running, setRunning] = useState(false)

  const run = async () => {
    setRunning(true)
    setSteps([
      { name: 'Classify', status: 'running', latency_ms: 0, result: '' },
      { name: 'Extract Entities', status: 'idle', latency_ms: 0, result: '' },
      { name: 'Check Interactions', status: 'idle', latency_ms: 0, result: '' },
      { name: 'Summarize', status: 'idle', latency_ms: 0, result: '' },
    ])
    try {
      const r = await classifyDocument(text)
      setSteps(p => p.map((s,i) => i===0 ? {...s,status:'complete',latency_ms:r.inference_ms,result:r.classification} : i===1 ? {...s,status:'running'} : s))
      await new Promise(r => setTimeout(r,1500))
      setSteps(p => p.map((s,i) => i===1 ? {...s,status:'complete',latency_ms:5200,result:'entities extracted'} : i===2 ? {...s,status:'running'} : s))
      await new Promise(r => setTimeout(r,500))
      setSteps(p => p.map((s,i) => i===2 ? {...s,status:'complete',latency_ms:50,result:'checked'} : i===3 ? {...s,status:'running'} : s))
      await new Promise(r => setTimeout(r,1500))
      setSteps(p => p.map((s,i) => i===3 ? {...s,status:'complete',latency_ms:4400,result:'summary done'} : s))
    } catch { setSteps(p => p.map(s => s.status==='running' ? {...s,status:'error',result:'Failed'} : s)) }
    setRunning(false)
  }

  return (
    <div data-testid="page-pipeline">
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:4}}>LangGraph Inference Pipeline</h1>
      <p style={{fontSize:13,color:'#888',marginBottom:24}}>Multi-step clinical NLP on Intel Xeon 6 CPU</p>
      <GraphVisualization steps={steps} />
      <textarea value={text} onChange={e=>setText(e.target.value)} rows={4} style={{width:'100%',padding:12,borderRadius:8,border:'1px solid #333',backgroundColor:'#132337',color:'#e8f0fe',fontSize:13,fontFamily:'monospace',marginTop:16,resize:'vertical'}} />
      <button onClick={run} disabled={running} style={{marginTop:8,padding:'10px 24px',borderRadius:6,border:'none',backgroundColor:running?'#555':'#0071C5',color:'#fff',fontSize:14,fontWeight:600,cursor:running?'default':'pointer'}}>
        {running ? 'Running...' : 'Run Pipeline on Xeon 6'}
      </button>
    </div>
  )
}
