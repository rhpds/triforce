import { CostChart } from '../components/CostChart'
export function CostAnalysis() {
  return (
    <div data-testid="page-cost">
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:4}}>Cost Analysis</h1>
      <p style={{fontSize:13,color:'#888',marginBottom:24}}>Intel Xeon 6 vs GPU hardware vs cloud API — real RHDP MAAS pricing</p>
      <CostChart />
    </div>
  )
}
