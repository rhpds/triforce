import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

const STANDARD = [
  { line: 'apiVersion: apps/v1', dim: true },
  { line: 'kind: Deployment', dim: true },
  { line: 'metadata:', dim: true },
  { line: '  name: healthcare-agent', dim: true },
  { line: 'spec:', dim: true },
  { line: '  template:', dim: true },
  { line: '    spec:', dim: true },
  { line: '      containers:', dim: true },
  { line: '        - name: agent', dim: true },
  { line: '          image: triforce/healthcare-agent:latest', dim: true },
]

const CONFIDENTIAL = [
  ...STANDARD.slice(0, 7),
  { line: '      runtimeClassName: kata-cc', dim: false, highlight: true },
  ...STANDARD.slice(7),
]

const COMPARISON = [
  { label: 'Container image', standard: 'Same', confidential: 'Same', changed: false },
  { label: 'Application code', standard: 'Same', confidential: 'Same', changed: false },
  { label: 'AI model', standard: 'Same', confidential: 'Same', changed: false },
  { label: 'API endpoints', standard: 'Same', confidential: 'Same', changed: false },
  { label: 'Runtime class', standard: 'default', confidential: 'kata-cc', changed: true },
  { label: 'Memory encryption', standard: 'None', confidential: 'AES-256 (hardware)', changed: true },
  { label: 'Secret source', standard: 'Environment var', confidential: 'Trustee KBS (attested)', changed: true },
]

export function Act03OneLine({ onComplete }: Props) {
  const [showDiff, setShowDiff] = useState(false)

  return (
    <div className="demo-section">
      <h3><span className="section-num">03</span> One Line Changes Everything</h3>
      <div className="section-context">
        The entire difference between standard deployment and confidential deployment
        is one line in the YAML. Same container. Same code. Same model. Different
        runtime — hardware-encrypted memory.
      </div>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', margin: '24px 0' }}>
        <motion.div style={{ flex: '1 1 300px', maxWidth: 400 }}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
            Standard Deploy
          </div>
          <div style={{ padding: '16px', borderRadius: 10, background: 'var(--surface-1)', border: '1px solid var(--border)', fontFamily: "'Red Hat Mono', monospace", fontSize: 12, lineHeight: 1.8 }}>
            {STANDARD.map((l, i) => (
              <div key={i} style={{ color: 'var(--text-dim)' }}>{l.line}</div>
            ))}
          </div>
        </motion.div>

        <motion.div style={{ flex: '1 1 300px', maxWidth: 400 }}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--intel-cyan)', textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
            Confidential Deploy
          </div>
          <div style={{ padding: '16px', borderRadius: 10, background: 'var(--surface-1)', border: '2px solid var(--intel-cyan)', fontFamily: "'Red Hat Mono', monospace", fontSize: 12, lineHeight: 1.8 }}>
            {CONFIDENTIAL.map((l, i) => (
              <motion.div key={i} style={{
                color: l.highlight ? 'var(--rh-green)' : 'var(--text-dim)',
                background: l.highlight ? 'var(--rh-green-dim)' : 'transparent',
                padding: l.highlight ? '2px 6px' : '0',
                borderRadius: l.highlight ? 4 : 0,
                fontWeight: l.highlight ? 700 : 400,
              }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.05 }}>
                {l.highlight ? '+ ' : ''}{l.line}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {!showDiff && (
        <motion.div style={{ textAlign: 'center', marginTop: 16 }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
          <button className="btn btn-secondary" onClick={() => setShowDiff(true)}>
            What exactly changes? →
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {showDiff && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '24px 0', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 500 }}>Component</th>
                  <th style={{ textAlign: 'center', padding: '10px 16px', color: 'var(--text-dim)', fontWeight: 500 }}>Standard</th>
                  <th style={{ textAlign: 'center', padding: '10px 16px', color: 'var(--intel-cyan)', fontWeight: 600 }}>Confidential</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <motion.tr key={row.label} style={{ borderBottom: '1px solid var(--border)' }}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <td style={{ padding: '10px 16px' }}>{row.label}</td>
                    <td className="mono" style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--text-dim)' }}>{row.standard}</td>
                    <td className="mono" style={{ padding: '10px 16px', textAlign: 'center', color: row.changed ? 'var(--rh-green)' : 'var(--text-dim)', fontWeight: row.changed ? 700 : 400 }}>{row.confidential}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="btn btn-primary" onClick={onComplete}>
                Run confidential inference →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
