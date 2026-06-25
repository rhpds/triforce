import { ModuleLayout, StepCard } from '../../components/ModuleLayout'

export default function ModuleLlmd() {
  return (
    <ModuleLayout title="llm-d Disaggregated Inference" description="SLO-based scheduler separates prefill (compute-heavy) and decode (memory-bound) across specialized nodes. Each node does what it's best at." status="roadmap">
      <StepCard num={1} title="How It Works">
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, alignItems: 'flex-start' }}>
            <div className="card" style={{ padding: 16, width: 180, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--rh-purple)' }}>Standard</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>One node does everything</div>
              <div className="mono" style={{ fontSize: 11, marginTop: 8 }}>Prompt → Prefill → Decode → Stream</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--rh-orange)', marginTop: 8 }}>7.8s</div>
            </div>
            <div style={{ alignSelf: 'center', fontSize: 24, color: 'var(--rh-green)' }}>→</div>
            <div className="card" style={{ padding: 16, width: 220, textAlign: 'center', borderLeft: '3px solid var(--rh-purple)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--rh-purple)' }}>Disaggregated (llm-d)</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>Specialized nodes per phase</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                <div style={{ padding: '4px 8px', borderRadius: 4, background: 'var(--rh-purple-dim)', fontSize: 11 }}>
                  <div style={{ color: 'var(--rh-purple)', fontWeight: 700 }}>Prefill</div>
                  <div className="mono" style={{ color: 'var(--rh-green)' }}>200ms</div>
                </div>
                <div style={{ padding: '4px 8px', borderRadius: 4, background: 'var(--rh-purple-dim)', fontSize: 11 }}>
                  <div style={{ color: 'var(--rh-purple)', fontWeight: 700 }}>Decode</div>
                  <div className="mono" style={{ color: 'var(--rh-green)' }}>1.2s</div>
                </div>
              </div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--rh-green)', marginTop: 8 }}>1.4s</div>
            </div>
          </div>
        </div>
      </StepCard>

      <StepCard num={2} title="Current Status">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-dim)' }}>Component</th>
            <th style={{ textAlign: 'center', padding: '8px', color: 'var(--text-dim)' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-dim)' }}>Notes</th>
          </tr></thead>
          <tbody>
            {[
              { comp: 'llm-d Planner', status: 'Roadmap', notes: 'Requires RHAIIS + KServe on cluster' },
              { comp: 'vLLM Pools', status: 'Roadmap', notes: 'Prefill pool + decode pool configuration' },
              { comp: 'Inference Gateway', status: 'Manifests', notes: 'infrastructure/llm-d/ in the repo' },
              { comp: 'SLO Routing', status: 'Roadmap', notes: 'Planner routes based on latency targets' },
            ].map(r => (
              <tr key={r.comp} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px', fontWeight: 600 }}>{r.comp}</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  <span className="mono" style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'var(--rh-purple-dim)', color: 'var(--rh-purple)' }}>{r.status}</span>
                </td>
                <td style={{ padding: '8px', color: 'var(--text-dim)' }}>{r.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </StepCard>

      <StepCard num={3} title="Projected Impact">
        <div style={{ fontSize: 14, color: 'var(--rh-green)', fontWeight: 600, lineHeight: 1.7 }}>
          Today's 7.8s pipeline → 1.4s with full disaggregation. The prefill burst goes to high-core nodes.
          Token streaming goes to memory-optimized nodes. The planner routes based on latency SLO targets.
          Same $0/token. This is the future of CPU inference at scale.
        </div>
      </StepCard>
    </ModuleLayout>
  )
}
