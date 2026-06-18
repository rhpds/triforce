export function Act05HonestQuestion() {
  return (
    <div className="demo-section">
      <h3><span className="section-num">05</span> The Hardest Question</h3>
      <div className="section-context">
        "But is it fast enough?" The models are small. The latency is seconds, not
        milliseconds. GPU inference is faster. This is the cave. Here's the honest answer.
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '24px 0' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 500 }}>Task</th>
            <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--intel-cyan)', fontWeight: 600 }}>Xeon 6 (CPU)</th>
            <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 500 }}>GPU (H100)</th>
            <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 500 }}>Cloud API</th>
            <th style={{ textAlign: 'right', padding: '10px 16px', color: 'var(--rh-green)', fontWeight: 600 }}>Cost/record</th>
          </tr>
        </thead>
        <tbody>
          {[
            { task: 'Classification', xeon: '615ms', gpu: '~50ms', api: '~200ms', cost: '$0.00' },
            { task: 'NER', xeon: '6.3s', gpu: '~500ms', api: '~1s', cost: '$0.00' },
            { task: 'Summarization', xeon: '7.6s', gpu: '~800ms', api: '~2s', cost: '$0.00' },
            { task: 'Fraud scoring', xeon: '22ms', gpu: '~5ms', api: '~100ms', cost: '$0.00' },
            { task: 'Full pipeline', xeon: '8.4s', gpu: '~1.5s', api: '~4s', cost: '$0.00' },
          ].map(row => (
            <tr key={row.task} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 16px' }}>{row.task}</td>
              <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: "'Red Hat Mono', monospace", color: 'var(--intel-cyan)' }}>{row.xeon}</td>
              <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: "'Red Hat Mono', monospace", color: 'var(--text-dim)' }}>{row.gpu}</td>
              <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: "'Red Hat Mono', monospace", color: 'var(--text-dim)' }}>{row.api}</td>
              <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: "'Red Hat Mono', monospace", fontWeight: 700, color: 'var(--rh-green)' }}>{row.cost}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="card" style={{ background: 'var(--surface-2)', borderColor: 'var(--intel-cyan)', borderLeft: '3px solid var(--intel-cyan)' }}>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7 }}>
          The question was never <em>"is it the fastest?"</em><br />
          The question is <strong style={{ color: 'var(--intel-cyan)' }}>"is it fast enough at 1/10th the cost?"</strong><br /><br />
          For 80% of enterprise AI — classification, NER, fraud scoring, summarization — <strong>yes</strong>.
        </p>
      </div>
    </div>
  )
}
