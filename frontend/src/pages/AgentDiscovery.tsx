import { useState, useEffect } from 'react'
import { listAgents, getHealthcareAgentCard } from '../api/client'
import type { DiscoveredAgent, AgentCard } from '../api/types'
export function AgentDiscovery() {
  const [agents, setAgents] = useState<DiscoveredAgent[]>([])
  const [card, setCard] = useState<AgentCard|null>(null)
  useEffect(() => { listAgents().then(r=>setAgents(r.agents)).catch(()=>{}); getHealthcareAgentCard().then(c=>setCard(c)).catch(()=>{}) }, [])
  return (
    <div data-testid="page-agents">
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:4}}>Agent Discovery</h1>
      <p style={{fontSize:13,color:'#888',marginBottom:24}}>A2A protocol agent cards and MCP tool federation</p>
      <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
        {agents.map(a=>(
          <div key={a.name} style={{padding:20,borderRadius:8,minWidth:280,backgroundColor:'rgba(255,255,255,0.03)',border:`1px solid ${a.status==='active'?'rgba(46,204,113,0.3)':'rgba(255,255,255,0.08)'}`}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <div style={{width:10,height:10,borderRadius:'50%',backgroundColor:a.status==='active'?'#2ecc71':'#888'}} />
              <span style={{fontSize:16,fontWeight:600}}>{a.name}</span>
            </div>
            <div style={{fontSize:12,color:'#888',marginBottom:8}}>{a.url}</div>
            {a.skills.map(s=>(
              <div key={s.id} style={{padding:'4px 8px',marginBottom:4,borderRadius:4,backgroundColor:'rgba(0,113,197,0.1)',fontSize:12}}>
                <strong>{s.name}</strong> — {s.description}
              </div>
            ))}
          </div>
        ))}
      </div>
      {card && <div style={{padding:16,borderRadius:8,backgroundColor:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)'}}>
        <h2 style={{fontSize:14,fontWeight:600,marginBottom:8}}>A2A Agent Card</h2>
        <pre style={{fontSize:12,color:'#aaa',overflow:'auto'}}>{JSON.stringify(card,null,2)}</pre>
      </div>}
    </div>
  )
}
