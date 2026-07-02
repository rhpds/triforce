import { useState } from 'react'
import { motion } from 'motion/react'

interface Props { onComplete?: () => void }

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
}

const bulletFade = (delay: number) => ({
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.4, delay },
})

const sourceStyle: React.CSSProperties = {
  fontSize: 9,
  color: 'var(--text-dim)',
  fontStyle: 'italic',
  marginTop: 4,
}

export function Act00Story({ onComplete }: Props) {
  const [beat, setBeat] = useState(0)

  const advance = () => setBeat(b => Math.min(b + 1, 4))

  return (
    <div className="demo-section">
      <h3><span className="section-num">00</span> The Question</h3>

      {/* Beat 0: The Spending */}
      <motion.div {...fadeIn} style={{ marginBottom: 40 }}>
        <div style={{
          fontSize: 48,
          fontWeight: 700,
          fontFamily: 'monospace',
          color: 'var(--text-primary)',
          lineHeight: 1.1,
        }}>
          $684 billion
        </div>
        <div style={{ fontSize: 18, color: 'var(--text-secondary)', marginTop: 8 }}>
          spent on enterprise AI in 2025
        </div>
        <div style={sourceStyle}>Industry aggregate, 2025</div>

        {beat < 1 && (
          <button
            className="btn btn-secondary"
            style={{ marginTop: 24 }}
            onClick={advance}
          >
            Next
          </button>
        )}
      </motion.div>

      {/* Beat 1: The Failure */}
      {beat >= 1 && (
        <motion.div {...fadeIn} style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: 48,
            fontWeight: 700,
            fontFamily: 'monospace',
            color: 'var(--rh-red)',
            lineHeight: 1.1,
          }}>
            $547 billion
          </div>
          <div style={{ fontSize: 18, color: 'var(--rh-red)', marginTop: 8 }}>
            produced no measurable results
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
              80.3% of projects failed to deliver value
            </div>
            <div style={sourceStyle}>RAND Corporation</div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
              95% of pilots delivered zero P&amp;L impact
            </div>
            <div style={sourceStyle}>MIT NANDA, 2025</div>
          </div>

          {beat < 2 && (
            <button
              className="btn btn-secondary"
              style={{ marginTop: 24 }}
              onClick={advance}
            >
              Next
            </button>
          )}
        </motion.div>
      )}

      {/* Beat 2: The Root Cause */}
      {beat >= 2 && (
        <motion.div {...fadeIn} style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 4 }}>
            Not because the models were wrong.
          </div>
          <div style={{
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 20,
          }}>
            Because enterprises didn't <em>right-size</em> the inference.
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <motion.li
              {...bulletFade(0.15)}
              style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10, paddingLeft: 16, borderLeft: '2px solid var(--rh-orange)' }}
            >
              Enterprise servers run at 12–18% CPU utilization — the rest is idle
              <div style={sourceStyle}>McKinsey &amp; Company</div>
            </motion.li>
            <motion.li
              {...bulletFade(0.30)}
              style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10, paddingLeft: 16, borderLeft: '2px solid var(--rh-orange)' }}
            >
              30% of servers are "comatose" — running, drawing power, doing zero work
              <div style={sourceStyle}>NRDC / Stanford</div>
            </motion.li>
            <motion.li
              {...bulletFade(0.45)}
              style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10, paddingLeft: 16, borderLeft: '2px solid var(--rh-red)' }}
            >
              Meanwhile, GPU clusters purchased for AI sit 95% idle
              <div style={sourceStyle}>VentureBeat, Q1 2026</div>
            </motion.li>
            <motion.li
              {...bulletFade(0.60)}
              style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10, paddingLeft: 16, borderLeft: '2px solid var(--rh-red)' }}
            >
              Cloud APIs cost up to 18x more per token than on-premises inference
              <div style={sourceStyle}>Lenovo TCO Study, 2026</div>
            </motion.li>
          </ul>

          <motion.div {...bulletFade(0.75)} style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 12, fontStyle: 'italic' }}>
            GPUs are powerful — for the workloads that need them. But 80% of enterprise AI is classification,
            extraction, and summarization. Tasks a CPU handles in seconds.
          </motion.div>

          {beat < 3 && (
            <button
              className="btn btn-secondary"
              style={{ marginTop: 24 }}
              onClick={advance}
            >
              Next
            </button>
          )}
        </motion.div>
      )}

      {/* Beat 3: The Reframe */}
      {beat >= 3 && (
        <motion.div {...fadeIn} style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: 22,
            fontWeight: 600,
            color: 'var(--rh-green)',
            lineHeight: 1.4,
            marginBottom: 8,
          }}>
            What if you right-sized your inference to the workload?
          </div>
          <div style={{
            fontSize: 16,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginBottom: 8,
          }}>
            CPU for the 80% — classification, extraction, summarization — at $0 per token on hardware you already own.
          </div>
          <div style={{
            fontSize: 16,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}>
            GPU for the 20% that needs it — frontier reasoning, large-scale generation — when the task demands it.
          </div>
          <div style={{
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--rh-green)',
            marginTop: 12,
          }}>
            Both. On the same platform. Routed automatically.
          </div>

          {beat < 4 && (
            <button
              className="btn btn-secondary"
              style={{ marginTop: 24 }}
              onClick={advance}
            >
              Next
            </button>
          )}
        </motion.div>
      )}

      {/* Beat 4: The Proof */}
      {beat >= 4 && (
        <motion.div {...fadeIn} style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: 16,
            color: 'var(--intel-cyan)',
            lineHeight: 1.6,
          }}>
            <div>That's not a pitch.</div>
            <div style={{ fontWeight: 600 }}>That's what you're about to see running live.</div>
            <div style={{ marginTop: 8 }}>On this Intel Xeon 6. Right now.</div>
          </div>

          <button
            className="btn btn-primary"
            style={{ marginTop: 24 }}
            onClick={onComplete}
          >
            Show me &rarr;
          </button>
        </motion.div>
      )}
    </div>
  )
}
