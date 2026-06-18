export function Act00Story() {
  return (
    <div className="demo-section">
      <h3><span className="section-num">00</span> Why are we here</h3>

      <div className="triforce-logo">{`            ▲
           ╱ ╲
          ╱   ╲
         ╱ RED ╲
        ╱  HAT  ╲
       ╱ COURAGE ╲
      ╱───────────╲
     ╱ ╲         ╱ ╲
    ╱   ╲       ╱   ╲
   ╱     ╲     ╱     ╲
  ╱ INTEL ╲   ╱  IBM  ╲
 ╱  POWER  ╲ ╱ WISDOM  ╲
╱───────────╳───────────╲`}</div>

      <div className="section-context">
        Every enterprise wants AI. They've seen the demos. They've run the pilots.
        But when the CFO asks "what does it cost at scale?" — the room goes quiet.
        GPU servers cost $120K. Cloud APIs charge per token. AI is stuck in pilot
        because it can't afford to scale.
      </div>

      <div style={{ maxWidth: 700, margin: '24px 0' }}>
        <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>
          Triforce answers three questions:
        </p>

        <div className="step-card">
          <span className="step-num">1</span>
          <strong>Can I afford AI at scale?</strong>
          <div className="step-question">
            Not at GPU prices. But on the CPUs you already own — yes.
          </div>
        </div>

        <div className="step-card">
          <span className="step-num">2</span>
          <strong>Can I run it on hardware I own?</strong>
          <div className="step-question">
            Not if AI needs a separate GPU cluster. But on the same OpenShift, the same Xeon servers — yes.
          </div>
        </div>

        <div className="step-card">
          <span className="step-num">3</span>
          <strong>Can I trust it with my data?</strong>
          <div className="step-question">
            Not if data sits unencrypted. But with TDX hardware encryption and complete audit trails — yes.
          </div>
        </div>
      </div>

      <div className="pillar-grid">
        <div className="pillar-card card-accent-intel">
          <div className="pillar-icon">⚡</div>
          <div className="pillar-name">Intel</div>
          <div className="pillar-role">Power</div>
          <div className="pillar-answer">Xeon 6 with AMX runs inference at $0/token</div>
        </div>
        <div className="pillar-card card-accent-redhat">
          <div className="pillar-icon">🛡️</div>
          <div className="pillar-name">Red Hat</div>
          <div className="pillar-role">Courage</div>
          <div className="pillar-answer">OpenShift + Semantic Router + scale</div>
        </div>
        <div className="pillar-card card-accent-ibm">
          <div className="pillar-icon">🧠</div>
          <div className="pillar-name">IBM</div>
          <div className="pillar-role">Wisdom</div>
          <div className="pillar-answer">Kagenti governance + encryption + audit</div>
        </div>
      </div>
    </div>
  )
}
