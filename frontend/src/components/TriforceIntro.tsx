import { motion } from 'motion/react'

interface Props {
  onComplete: () => void
}

export function TriforceIntro({ onComplete }: Props) {
  return (
    <div
      style={{ textAlign: 'center', padding: '80px 24px', cursor: 'pointer', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      onClick={onComplete}
    >
      <motion.div
        style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      >
        <img src="/logos/redhat.svg" alt="Red Hat" style={{ height: 28 }} />
        <span style={{ color: 'var(--text-disabled)', fontSize: 24, fontWeight: 300 }}>×</span>
        <img src="/logos/intel.png" alt="Intel" style={{ height: 34 }} />
      </motion.div>

      <motion.div
        style={{ fontSize: 32, fontFamily: "'Red Hat Display', sans-serif", fontWeight: 800, letterSpacing: -1, color: 'var(--text-primary)', marginBottom: 12 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        AI Inference on Intel Xeon 6
      </motion.div>

      <motion.div
        style={{ fontSize: 14, color: 'var(--text-dim)', letterSpacing: 2, textTransform: 'uppercase' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        Enterprise AI on CPUs you already own
      </motion.div>

      <motion.div
        style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 48 }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ repeat: Infinity, duration: 2.5, delay: 2 }}
      >
        click to begin
      </motion.div>
    </div>
  )
}
