import { useState } from 'react'

interface Props {
  onStart?: (target: string, concurrency: number, duration: number) => void
  onStop?: () => void
}

export function ScaleTestRunner({ onStart, onStop }: Props) {
  const [target, setTarget] = useState('both')
  const [concurrency, setConcurrency] = useState(3)
  const [duration, setDuration] = useState(60)
  const [running, setRunning] = useState(false)
  const [processed, setProcessed] = useState(0)
  const [throughput, setThroughput] = useState(0)
  const [errors, setErrors] = useState(0)

  const handleStart = () => {
    setRunning(true)
    setProcessed(0)
    setThroughput(0)
    setErrors(0)
    onStart?.(target, concurrency, duration)
  }

  const handleStop = () => {
    setRunning(false)
    onStop?.()
  }

  return (
    <div data-testid="scale-runner">
      {/* Controls */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap' }}>
        {/* Target */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase' }}>
            Target
          </label>
          <div style={{ display: 'flex', gap: 4 }}>
            {['healthcare', 'finserv', 'both'].map(t => (
              <button
                key={t}
                onClick={() => setTarget(t)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 4,
                  border: t === target ? '2px solid #00AEEF' : '1px solid #444',
                  backgroundColor: t === target ? 'rgba(0,174,239,0.1)' : 'transparent',
                  color: t === target ? '#00AEEF' : '#aaa',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: t === target ? 600 : 400,
                }}
              >
                {t === 'healthcare' ? 'Healthcare' : t === 'finserv' ? 'FinServ' : 'Both'}
              </button>
            ))}
          </div>
        </div>

        {/* Concurrency */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase' }}>
            Concurrency: {concurrency}
          </label>
          <input
            type="range" min={1} max={10} value={concurrency}
            onChange={e => setConcurrency(Number(e.target.value))}
            style={{ width: 120 }}
          />
        </div>

        {/* Duration */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase' }}>
            Duration (sec)
          </label>
          <input
            type="number" min={10} max={300} value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            style={{
              width: 80, padding: '6px 10px', borderRadius: 4,
              border: '1px solid #444', backgroundColor: '#132337',
              color: '#fff', fontSize: 13,
            }}
          />
        </div>

        {/* Start/Stop */}
        <button
          onClick={running ? handleStop : handleStart}
          style={{
            padding: '8px 24px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: running ? '#e74c3c' : '#2ecc71',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {running ? 'Stop' : 'Start Scale Test'}
        </button>
      </div>

      {/* Live Counters */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>Processed</div>
          <div data-testid="counter-processed" style={{ fontSize: 32, fontWeight: 700 }}>{processed}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>Throughput</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#00AEEF' }}>
            {throughput.toFixed(1)} <span style={{ fontSize: 14, fontWeight: 400 }}>rec/s</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>Errors</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: errors > 0 ? '#e74c3c' : '#2ecc71' }}>{errors}</div>
        </div>
      </div>

      {/* Status bar */}
      {running && (
        <div style={{
          padding: '8px 16px',
          borderRadius: 6,
          backgroundColor: 'rgba(0,174,239,0.1)',
          border: '1px solid rgba(0,174,239,0.3)',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#00AEEF', animation: 'pulse 1s infinite' }} />
          Running scale test: {target} @ {concurrency}x concurrency for {duration}s
        </div>
      )}
    </div>
  )
}
