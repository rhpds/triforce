import { useState } from 'react'
import { motion } from 'motion/react'

interface Props {
  onComplete: () => void
}

const TRI_H = 200
const TRI_W = 230
const CX = 300
const TOP_Y = 10
const MID_Y = TOP_Y + TRI_H
const BOT_Y = MID_Y + TRI_H

const TOP_CY = Math.round((TOP_Y + MID_Y + MID_Y) / 3)
const BL_CX = Math.round((CX - TRI_W / 2 + CX - TRI_W + CX) / 3)
const BL_CY = Math.round((MID_Y + BOT_Y + BOT_Y) / 3)
const BR_CX = Math.round((CX + TRI_W / 2 + CX + CX + TRI_W) / 3)
const BR_CY = BL_CY

const TRIANGLES = [
  {
    id: 'redhat',
    points: `${CX},${TOP_Y} ${CX - TRI_W / 2},${MID_Y} ${CX + TRI_W / 2},${MID_Y}`,
    color: '#EE0000',
    logo: '/logos/redhat.svg',
    logoCX: CX, logoCY: TOP_CY - 10, logoW: 120, logoH: 28,
    label: 'COURAGE',
    sub: 'OpenShift · AMQ Streams · Scale',
    labelCX: CX, labelCY: TOP_CY,
  },
  {
    id: 'intel',
    points: `${CX - TRI_W / 2},${MID_Y} ${CX - TRI_W},${BOT_Y} ${CX},${BOT_Y}`,
    color: '#00AEEF',
    logo: '/logos/intel.png',
    logoCX: BL_CX, logoCY: BL_CY - 10, logoW: 100, logoH: 36,
    label: 'POWER',
    sub: 'Xeon 6 · AMX · $0/token',
    labelCX: BL_CX, labelCY: BL_CY,
  },
  {
    id: 'ibm',
    points: `${CX + TRI_W / 2},${MID_Y} ${CX},${BOT_Y} ${CX + TRI_W},${BOT_Y}`,
    color: '#0F62FE',
    logo: '/logos/ibm.png',
    logoCX: BR_CX, logoCY: BR_CY - 10, logoW: 80, logoH: 32,
    label: 'WISDOM',
    sub: 'Kagenti · Governance · Audit',
    labelCX: BR_CX, labelCY: BR_CY,
  },
]

export function TriforceIntro({ onComplete }: Props) {
  const [stage, setStage] = useState<'logos' | 'text' | 'title'>('logos')

  const advance = () => {
    if (stage === 'logos') setStage('text')
    else if (stage === 'text') setStage('title')
    else onComplete()
  }

  return (
    <div style={{ textAlign: 'center', padding: '24px 0', cursor: 'pointer' }} onClick={advance}>
      <svg viewBox={`0 0 600 ${BOT_Y + 80}`} style={{ maxWidth: 560, width: '100%' }}>
        <defs>
          {TRIANGLES.map(t => (
            <filter key={`glow-${t.id}`} id={`glow-${t.id}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          ))}
        </defs>

        {TRIANGLES.map((t, i) => (
          <g key={t.id}>
            {/* Triangle shape — draws slowly, each triangle staggers by 1.2s */}
            <motion.polygon
              points={t.points}
              fill={t.color}
              opacity={0.1}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              transition={{ delay: i * 1.2, duration: 1.0 }}
            />
            <motion.polygon
              points={t.points}
              fill="none"
              stroke={t.color}
              strokeWidth="2"
              filter={`url(#glow-${t.id})`}
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: 1, pathLength: 1 }}
              transition={{ delay: i * 1.2, duration: 1.8, ease: 'easeInOut' }}
            />

            {/* Logo — fades in after its triangle finishes drawing */}
            <motion.image
              href={t.logo}
              x={t.logoCX - t.logoW / 2}
              y={t.logoCY - t.logoH / 2}
              width={t.logoW}
              height={t.logoH}
              initial={{ opacity: 0 }}
              animate={{ opacity: stage === 'logos' ? 0.9 : 0 }}
              transition={{ delay: stage === 'logos' ? i * 1.2 + 1.5 : 0, duration: 0.8 }}
            />

            {/* Text — centered at triangle centroid */}
            <motion.text
              x={t.labelCX}
              y={t.labelCY}
              textAnchor="middle"
              fill={t.color}
              fontFamily="Red Hat Display, sans-serif"
              fontSize="18"
              fontWeight="800"
              letterSpacing="3"
              initial={{ opacity: 0 }}
              animate={{ opacity: stage === 'text' || stage === 'title' ? 1 : 0 }}
              transition={{ delay: stage === 'text' ? 0.1 : 0, duration: 0.4 }}
            >
              {t.label}
            </motion.text>
            <motion.text
              x={t.labelCX}
              y={t.labelCY + 20}
              textAnchor="middle"
              fill={t.color}
              fontFamily="Red Hat Text, sans-serif"
              fontSize="10"
              initial={{ opacity: 0 }}
              animate={{ opacity: stage === 'text' || stage === 'title' ? 0.6 : 0 }}
              transition={{ delay: stage === 'text' ? 0.3 : 0, duration: 0.4 }}
            >
              {t.sub}
            </motion.text>
          </g>
        ))}

        {/* Center negative space */}
        <polygon
          points={`${CX - TRI_W / 2},${MID_Y} ${CX + TRI_W / 2},${MID_Y} ${CX},${BOT_Y}`}
          fill="none"
          stroke="#383838"
          strokeWidth="1"
          opacity={0.25}
        />

        {/* Title — visible in 'title' stage */}
        <motion.text
          x={CX}
          y={BOT_Y + 45}
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Red Hat Display, sans-serif"
          fontSize="32"
          fontWeight="800"
          letterSpacing="5"
          initial={{ opacity: 0 }}
          animate={{ opacity: stage === 'title' ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        >
          TRIFORCE
        </motion.text>
        <motion.text
          x={CX}
          y={BOT_Y + 70}
          textAnchor="middle"
          fill="#a3a3a3"
          fontFamily="Red Hat Text, sans-serif"
          fontSize="11"
          letterSpacing="2"
          initial={{ opacity: 0 }}
          animate={{ opacity: stage === 'title' ? 1 : 0 }}
          transition={{ delay: stage === 'title' ? 0.3 : 0, duration: 0.4 }}
        >
          ENTERPRISE AI ON CPUS YOU ALREADY OWN
        </motion.text>
      </svg>

      <motion.div
        style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 8 }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        {stage === 'logos' ? 'click to continue' : stage === 'text' ? 'click to continue' : 'click to begin'}
      </motion.div>
    </div>
  )
}
