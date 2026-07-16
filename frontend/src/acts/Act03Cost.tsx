import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

interface Props { onComplete?: () => void }

const XEON_ANNUAL = 15000

const PROVIDERS = [
  { name: 'Intel Xeon 6', color: 'var(--intel-cyan)', perRecord: 0, fixed: XEON_ANNUAL },
  { name: 'Claude Haiku', color: 'var(--rh-teal)', perRecord: 0.0084, fixed: 0 },
  { name: 'gpt-4o-mini (Azure)', color: 'var(--rh-blue)', perRecord: 0.012, fixed: 0 },
  { name: 'NVIDIA A100 server', color: '#76B900', perRecord: 0, fixed: 64000 },
  { name: 'Claude Opus', color: 'var(--rh-purple)', perRecord: 0.042, fixed: 0 },
  { name: 'NVIDIA H100 server', color: '#76B900', perRecord: 0, fixed: 119333 },
]

const TIERS = [
  {
    label: '10K records/month',
    monthly: 10000,
    narrative: 'At low volume, the cloud API wins. Claude Haiku costs $1K/year. Your Xeon servers are $15K whether you use them or not. This is honest — if you\'re small, use the API.',
    verdict: 'API wins',
    verdictColor: 'var(--rh-orange)',
  },
  {
    label: '100K records/month',
    monthly: 100000,
    narrative: 'Xeon 6 starts to look competitive. Haiku is still close at $10K, but Opus costs $50K and GPU servers are $64K–$119K. The crossover is near.',
    verdict: 'Getting close',
    verdictColor: 'var(--rh-teal)',
  },
  {
    label: '500K records/month',
    monthly: 500000,
    narrative: 'Now watch the lines diverge. Xeon 6 is still $15K — it doesn\'t scale with volume. Haiku jumped to $50K. GPU servers are $64K–$119K. The APIs just keep climbing.',
    verdict: 'Xeon 6 wins',
    verdictColor: 'var(--rh-green)',
  },
  {
    label: '1M records/month',
    monthly: 1000000,
    narrative: 'At enterprise scale the gap is massive. Xeon 6: $15K. Haiku: $101K. Opus: $504K. Same servers you already own, same $0/token. The flat line wins.',
    verdict: 'Xeon 6 dominates',
    verdictColor: 'var(--intel-cyan)',
  },
]

function annualCost(provider: typeof PROVIDERS[0], monthlyRecords: number): number {
  return provider.fixed + provider.perRecord * monthlyRecords * 12
}

export function Act03Cost({ onComplete }: Props) {
  const [tierIdx, setTierIdx] = useState(-1)

  const advance = () => {
    if (tierIdx < TIERS.length - 1) {
      setTierIdx(prev => prev + 1)
    }
  }

  const currentTier = tierIdx >= 0 ? TIERS[tierIdx] : null
  const allRevealed = tierIdx >= TIERS.length - 1

  return (
    <div className="demo-section">
      <h3><span className="section-num">03</span> The Proof: Cost at Scale <span style={{ fontSize: '0.55em', fontWeight: 400, color: 'var(--text-dim)' }}>(as of July 2026)</span></h3>
      <div className="section-context">
        "Can I afford it?" Click through four volume tiers and watch the lines diverge.
        Xeon 6 is a flat cost — it doesn't scale with volume. Everything else does.
      </div>

      <AnimatePresence mode="wait">
        {currentTier && (
          <motion.div
            key={tierIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 16, flexWrap: 'wrap', gap: 8,
            }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {currentTier.label}
                <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 8 }}>
                  (3 LLM calls per record)
                </span>
              </div>
              <motion.div
                style={{
                  padding: '4px 14px', borderRadius: 6, fontSize: 13, fontWeight: 700,
                  color: currentTier.verdictColor,
                  background: `color-mix(in srgb, ${currentTier.verdictColor} 12%, transparent)`,
                  border: `1px solid ${currentTier.verdictColor}`,
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {currentTier.verdict}
              </motion.div>
            </div>

            {(() => {
              const costs = PROVIDERS.map(p => ({
                ...p,
                annual: annualCost(p, currentTier.monthly),
              }))
              const max = Math.max(...costs.map(c => c.annual))

              return (
                <div style={{ margin: '12px 0' }}>
                  {costs.map((c, i) => (
                    <motion.div
                      className="cost-row"
                      key={c.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.06 }}
                    >
                      <div className="cost-label">{c.name}</div>
                      <div className="cost-track">
                        <motion.div
                          className="cost-fill"
                          style={{ background: c.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max((c.annual / max) * 100, 4)}%` }}
                          transition={{ duration: 0.5, delay: 0.15 + i * 0.06 }}
                        >
                          <span>${c.annual < 1000 ? c.annual.toFixed(0) : Math.round(c.annual / 1000) + 'K'}/yr</span>
                        </motion.div>
                      </div>
                      <div className="cost-delta" style={{
                        color: c.annual <= XEON_ANNUAL ? 'var(--rh-green)'
                          : c.annual < XEON_ANNUAL * 2 ? 'var(--rh-teal)'
                          : 'var(--rh-orange)',
                        fontSize: 12,
                      }}>
                        {c.name === 'Intel Xeon 6'
                          ? '$15K flat'
                          : c.annual < XEON_ANNUAL
                            ? `-$${Math.round((XEON_ANNUAL - c.annual) / 1000)}K cheaper`
                            : `+$${Math.round((c.annual - XEON_ANNUAL) / 1000)}K more`}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            })()}

            <motion.div
              style={{
                fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7,
                padding: '12px 0', maxWidth: 640,
              }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {currentTier.narrative}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!currentTier && (
        <div style={{
          textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)',
          fontSize: 14, lineHeight: 1.7,
        }}>
          Four volume tiers. Watch what happens to the cost as you scale up.
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        {!allRevealed ? (
          <button className="btn btn-secondary" onClick={advance}>
            {tierIdx < 0
              ? 'Start at 10K records/month →'
              : `Scale to ${TIERS[tierIdx + 1].label} →`}
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="card card-accent-intel"
              style={{ marginBottom: 16, textAlign: 'left' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <strong style={{ color: 'var(--intel-cyan)' }}>The flat line wins.</strong>
              <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
                At 1M records/month, APIs cost $101K–$504K/year. GPU servers cost $64K–$119K.
                Xeon 6: $15K. Same hardware you already own. $0/token. No rate limits.
              </span>
            </motion.div>
            <button className="btn btn-primary" onClick={onComplete}>
              Prove it at scale →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
