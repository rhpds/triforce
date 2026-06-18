import { Act00Story } from './acts/Act00Story'
import { Act01Architecture } from './acts/Act01Architecture'
import { Act02Inference } from './acts/Act02Inference'
import { Act03Cost } from './acts/Act03Cost'
import { Act04Platform } from './acts/Act04Platform'
import { Act05HonestQuestion } from './acts/Act05HonestQuestion'

export default function App() {
  return (
    <div>
      {/* Header */}
      <div className="demo-header">
        <div className="demo-header-title">
          <span style={{ color: 'var(--intel-cyan)', marginRight: 8 }}>▲</span>
          TRIFORCE
          <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: 13, marginLeft: 12 }}>
            Power · Wisdom · Courage
          </span>
        </div>
        <div className="demo-header-health">
          <div className="health-dot alive" />
          <span>Intel Xeon 6 · granite-2b-cpu</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }} className="content-with-metrics">
        <Act00Story />
        <Act01Architecture />
        <Act02Inference />
        <Act03Cost />
        <Act04Platform />
        <Act05HonestQuestion />

        {/* Footer / Elixir */}
        <div className="demo-section" style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{ fontSize: 18, color: 'var(--text-dim)', marginBottom: 16 }}>
            80% of enterprise AI doesn't need a GPU.
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            That 80% runs today on the CPUs you already own.
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 24 }}>
            <span style={{ color: 'var(--intel-cyan)' }}>Power</span> ·{' '}
            <span style={{ color: 'var(--ibm-blue)' }}>Wisdom</span> ·{' '}
            <span style={{ color: 'var(--rh-red)' }}>Courage</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-disabled)', marginTop: 8 }}>
            github.com/rhpds/triforce
          </div>
        </div>
      </div>
    </div>
  )
}
