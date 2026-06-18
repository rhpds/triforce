export function Act01Architecture() {
  return (
    <div className="demo-section">
      <h3><span className="section-num">01</span> Architecture</h3>
      <div className="section-context">
        Three agents. Three languages. One platform. The Semantic Router classifies
        each request and routes to the right model — simple tasks to the 2B model,
        complex reasoning to the 3.8B model. All on Intel Xeon 6 CPU.
      </div>

      <div className="arch-diagram">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="card card-accent-redhat" style={{ width: 300 }}>
            <div className="pipe-node-label" style={{ color: 'var(--rh-red)' }}>Semantic Router</div>
            <div className="pipe-node-detail">Red Hat · Classifies request complexity</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center' }}>
              <span className="mono" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--rh-green-dim)', color: 'var(--rh-green)' }}>SIMPLE</span>
              <span className="mono" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--rh-blue-dim)', color: 'var(--rh-blue)' }}>MEDIUM</span>
              <span className="mono" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--rh-purple-dim)', color: 'var(--rh-purple)' }}>COMPLEX</span>
            </div>
          </div>

          <div style={{ width: 2, height: 24, background: 'var(--border)' }} />

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div className="card card-accent-ibm" style={{ width: 180 }}>
              <div className="pipe-node-label">Healthcare</div>
              <div className="pipe-node-detail">Python · LangGraph</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Classify · NER · Summarize</div>
            </div>
            <div className="card card-accent-ibm" style={{ width: 180 }}>
              <div className="pipe-node-label">FinServ</div>
              <div className="pipe-node-detail">Java · Quarkus</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Fraud · Compliance · Risk</div>
            </div>
            <div className="card" style={{ width: 180 }}>
              <div className="pipe-node-label">Orchestrator</div>
              <div className="pipe-node-detail">Go · A2A</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Discover · Dispatch · Coordinate</div>
            </div>
          </div>

          <div style={{ width: 2, height: 24, background: 'var(--border)' }} />

          <div className="card card-accent-intel" style={{ width: 400 }}>
            <div className="pipe-node-label" style={{ color: 'var(--intel-cyan)' }}>Intel Xeon 6 · MAAS/LiteLLM</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
              <span className="mono" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--intel-cyan-dim)', color: 'var(--intel-cyan)' }}>granite-2b-cpu</span>
              <span className="mono" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--intel-cyan-dim)', color: 'var(--intel-cyan)' }}>qwen25-3b-cpu</span>
              <span className="mono" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--intel-cyan-dim)', color: 'var(--intel-cyan)' }}>phi3-mini-cpu</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
