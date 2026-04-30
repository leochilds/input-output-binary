import { useState, useRef, useCallback, useEffect } from 'react'
import { Recorder } from '../lib/audio.js'

const PHASES = {
  IDLE: 'idle',
  REQUESTING: 'requesting',
  READY: 'ready',
  RECORDING: 'recording',
  PROCESSING: 'processing',
  DONE: 'done',
  ERROR: 'error',
}

const MAX_DURATION = 3000

export default function RecordSection({ onRecordingComplete }) {
  const [phase, setPhase] = useState(PHASES.IDLE)
  const [elapsed, setElapsed] = useState(0)
  const recorderRef = useRef(null)
  const canvasRef = useRef(null)
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  const drawLive = useCallback((data) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    const mid = H / 2
    const amp = mid * 0.82

    ctx.fillStyle = 'rgba(6, 13, 6, 0.4)'
    ctx.fillRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = '#0f1f0f'
    ctx.lineWidth = 0.5
    for (let i = 1; i < 10; i++) {
      ctx.beginPath(); ctx.moveTo((i / 10) * W, 0); ctx.lineTo((i / 10) * W, H); ctx.stroke()
    }
    for (let i = 1; i < 8; i++) {
      ctx.beginPath(); ctx.moveTo(0, (i / 8) * H); ctx.lineTo(W, (i / 8) * H); ctx.stroke()
    }

    ctx.strokeStyle = '#1a2a1a'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke()

    ctx.shadowColor = '#00ff88'
    ctx.shadowBlur = 7
    ctx.strokeStyle = '#00ff88'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = 0; i < data.length; i++) {
      const x = (i / (data.length - 1)) * W
      const y = mid - data[i] * amp
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.shadowBlur = 0
  }, [])

  const stopRecording = useCallback(async () => {
    clearInterval(timerRef.current)
    setPhase(PHASES.PROCESSING)
    recorderRef.current.stopAnalyser()
    try {
      const { samples, sampleRate } = await recorderRef.current.stopRecording()
      setPhase(PHASES.DONE)
      onRecordingComplete(samples, sampleRate)
    } catch (err) {
      console.error('Recording failed:', err)
      setPhase(PHASES.ERROR)
    }
  }, [onRecordingComplete])

  const startRecording = useCallback(() => {
    setPhase(PHASES.RECORDING)
    setElapsed(0)
    startTimeRef.current = Date.now()
    recorderRef.current.startRecording()

    timerRef.current = setInterval(() => {
      const e = Date.now() - startTimeRef.current
      setElapsed(e)
      if (e >= MAX_DURATION) stopRecording()
    }, 50)
  }, [stopRecording])

  const enableMic = useCallback(async () => {
    setPhase(PHASES.REQUESTING)
    const rec = new Recorder()
    recorderRef.current = rec
    const ok = await rec.requestPermission()
    if (!ok) { setPhase(PHASES.ERROR); return }
    setPhase(PHASES.READY)
    rec.startAnalyser(drawLive)
  }, [drawLive])

  const resetRecording = useCallback(() => {
    recorderRef.current?.destroy()
    recorderRef.current = null
    clearInterval(timerRef.current)
    setPhase(PHASES.IDLE)
    setElapsed(0)
  }, [])

  useEffect(() => {
    return () => {
      recorderRef.current?.destroy()
      clearInterval(timerRef.current)
    }
  }, [])

  // Ensure canvas matches container on mount / resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  const progress = Math.min(1, elapsed / MAX_DURATION)
  const progressPct = (progress * 100).toFixed(0)

  return (
    <section className="section record-section" id="record">
      <div className="section-header">
        <span className="section-number">01</span>
        <span className="section-title">CAPTURE</span>
      </div>

      <p className="section-desc">
        Sound is a wave of air pressure changes, varying thousands of times per second.
        Your microphone converts these vibrations into a continuous electrical signal.
        Record a short sample to begin — speak, hum, or clap.
      </p>

      <div className="canvas-container record-canvas-container">
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '160px' }}
        />
        {(phase === PHASES.IDLE || phase === PHASES.REQUESTING) && (
          <div className="canvas-overlay">
            <span className="canvas-overlay-text">
              {phase === PHASES.REQUESTING ? 'REQUESTING MICROPHONE ACCESS...' : 'MICROPHONE NOT CONNECTED'}
            </span>
          </div>
        )}
        {phase === PHASES.PROCESSING && (
          <div className="canvas-overlay">
            <span className="canvas-overlay-text">DECODING AUDIO DATA...</span>
          </div>
        )}
        {phase === PHASES.DONE && (
          <div className="canvas-overlay done-overlay">
            <span className="canvas-overlay-text done-text">✓ RECORDING CAPTURED</span>
          </div>
        )}
        {phase === PHASES.RECORDING && (
          <div className="record-indicator">
            <span className="record-dot" />
            <span className="record-label">REC</span>
          </div>
        )}
      </div>

      {phase === PHASES.RECORDING && (
        <div className="progress-bar-wrap">
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="progress-label">{(elapsed / 1000).toFixed(1)}s / 3.0s</span>
        </div>
      )}

      <div className="record-controls">
        {phase === PHASES.IDLE && (
          <button className="btn btn-primary" onClick={enableMic}>
            ENABLE MICROPHONE
          </button>
        )}
        {phase === PHASES.REQUESTING && (
          <button className="btn btn-secondary" disabled>
            REQUESTING ACCESS...
          </button>
        )}
        {phase === PHASES.READY && (
          <button className="btn btn-primary btn-pulse" onClick={startRecording}>
            ● START RECORDING
          </button>
        )}
        {phase === PHASES.RECORDING && (
          <button className="btn btn-danger" onClick={stopRecording}>
            ■ STOP RECORDING
          </button>
        )}
        {phase === PHASES.PROCESSING && (
          <button className="btn btn-secondary" disabled>
            PROCESSING...
          </button>
        )}
        {phase === PHASES.DONE && (
          <button className="btn btn-secondary" onClick={resetRecording}>
            ↺ RECORD AGAIN
          </button>
        )}
        {phase === PHASES.ERROR && (
          <div className="error-row">
            <span className="error-text">Microphone access denied or unavailable.</span>
            <button className="btn btn-secondary" onClick={resetRecording}>RETRY</button>
          </div>
        )}
      </div>
    </section>
  )
}
