import { ModuleLayout, StepCard } from '../../components/ModuleLayout'

export default function ModuleSpeculative() {
  return (
    <ModuleLayout title="Speculative Decoding" description="A small draft model proposes tokens ahead. The target model verifies them in a single pass. Same output, 2-3x faster. Lossless quality." status="live">
      <StepCard num={1} title="How It Works">
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, alignItems: 'flex-start' }}>
            <div className="card" style={{ padding: 16, width: 180, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--intel-blue)' }}>Standard</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>Generate one token at a time</div>
              <div className="mono" style={{ fontSize: 11, marginTop: 8 }}>T1 → T2 → T3 → T4 → T5</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Each waits for the last</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--rh-orange)', marginTop: 8 }}>~4s</div>
            </div>
            <div style={{ alignSelf: 'center', fontSize: 24, color: 'var(--rh-green)' }}>→</div>
            <div className="card" style={{ padding: 16, width: 220, textAlign: 'center', borderLeft: '3px solid var(--intel-blue)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--intel-blue)' }}>Speculative</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>Draft proposes, target verifies</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                <div style={{ padding: '4px 8px', borderRadius: 4, background: 'var(--intel-cyan-dim)', fontSize: 11 }}>
                  <div style={{ color: 'var(--intel-blue)', fontWeight: 700 }}>Draft (350M)</div>
                  <div className="mono" style={{ color: 'var(--rh-green)' }}>50ms</div>
                </div>
                <div style={{ padding: '4px 8px', borderRadius: 4, background: 'var(--intel-cyan-dim)', fontSize: 11 }}>
                  <div style={{ color: 'var(--intel-blue)', fontWeight: 700 }}>Verify (2B)</div>
                  <div className="mono" style={{ color: 'var(--rh-green)' }}>800ms</div>
                </div>
              </div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--rh-green)', marginTop: 8 }}>~850ms</div>
            </div>
          </div>
        </div>
      </StepCard>

      <StepCard num={2} title="Draft + Target Models">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-dim)' }}>Role</th>
            <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-dim)' }}>Model</th>
            <th style={{ textAlign: 'right', padding: '8px', color: 'var(--text-dim)' }}>Params</th>
            <th style={{ textAlign: 'left', padding: '8px', color: 'var(--text-dim)' }}>Job</th>
          </tr></thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '8px', fontWeight: 600, color: 'var(--intel-blue)' }}>Draft</td>
              <td className="mono" style={{ padding: '8px' }}>granite-350m</td>
              <td className="mono" style={{ padding: '8px', textAlign: 'right' }}>350M</td>
              <td style={{ padding: '8px', color: 'var(--text-dim)' }}>Proposes 5 tokens fast</td>
            </tr>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '8px', fontWeight: 600, color: 'var(--intel-cyan)' }}>Target</td>
              <td className="mono" style={{ padding: '8px' }}>granite-2b-cpu</td>
              <td className="mono" style={{ padding: '8px', textAlign: 'right' }}>2B</td>
              <td style={{ padding: '8px', color: 'var(--text-dim)' }}>Verifies all 5 in one pass</td>
            </tr>
          </tbody>
        </table>
      </StepCard>

      <StepCard num={3} title="Status">
        <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.7 }}>
          Draft model (<code>granite-350m</code>) deployed via OpenVINO.
          Configured as speculative draft for <code>granite-2b-cpu</code> target model.
        </div>
        <div style={{ fontSize: 14, color: 'var(--rh-green)', fontWeight: 600, marginTop: 12 }}>
          Live: 2-3x speedup on CPU, lossless quality. Compounds with INT8 and llm-d.
        </div>
      </StepCard>
    </ModuleLayout>
  )
}
