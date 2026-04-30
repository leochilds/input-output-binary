import { useEffect, useRef, useCallback } from 'react'

const C = {
  bg: '#060d06',
  grid: '#0f1f0f',
  center: '#1a2a1a',
  analog: '#00ff88',
  analogDim: '#0a1f0e',
  blue: '#4488ff',
  blueDot: '#88bbff',
  blueTick: '#1a2a44',
  orange: '#ff6b35',
  orangeDim: '#1a0d06',
  orangeGrid: '#150e05',
}

function drawWaveform(canvas, samples, mode, bitDepth, sampleStride) {
  if (!canvas || !samples || samples.length === 0) return
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height
  if (W === 0 || H === 0) return
  const mid = H / 2
  const amp = mid * 0.85

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  // Graticule grid
  ctx.strokeStyle = C.grid
  ctx.lineWidth = 0.5
  const cols = 10
  const rows = 8
  for (let i = 1; i < cols; i++) {
    ctx.beginPath()
    ctx.moveTo((i / cols) * W, 0)
    ctx.lineTo((i / cols) * W, H)
    ctx.stroke()
  }
  for (let i = 1; i < rows; i++) {
    ctx.beginPath()
    ctx.moveTo(0, (i / rows) * H)
    ctx.lineTo(W, (i / rows) * H)
    ctx.stroke()
  }

  // Center line
  ctx.strokeStyle = C.center
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, mid)
  ctx.lineTo(W, mid)
  ctx.stroke()

  const xOf = (i) => (i / (samples.length - 1)) * W
  const yOf = (v) => mid - v * amp

  if (mode === 'analog' || mode === 'live') {
    ctx.shadowColor = C.analog
    ctx.shadowBlur = 6
    ctx.strokeStyle = C.analog
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(xOf(0), yOf(samples[0]))
    for (let i = 1; i < samples.length; i++) {
      ctx.lineTo(xOf(i), yOf(samples[i]))
    }
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  if (mode === 'sampled') {
    // Dim analog underlay
    ctx.strokeStyle = C.analogDim
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(xOf(0), yOf(samples[0]))
    for (let i = 1; i < samples.length; i++) {
      ctx.lineTo(xOf(i), yOf(samples[i]))
    }
    ctx.stroke()

    const stride = Math.max(1, Math.round(sampleStride))
    const dotR = Math.max(2, Math.min(5, 6 - stride / 10))

    // ZOH step reconstruction
    ctx.shadowColor = C.blue
    ctx.shadowBlur = 5
    ctx.strokeStyle = C.blue
    ctx.lineWidth = 1.5
    ctx.beginPath()
    let prevY = yOf(samples[0])
    ctx.moveTo(0, prevY)
    for (let i = 0; i < samples.length; i += stride) {
      const x = xOf(i)
      const y = yOf(samples[i])
      ctx.lineTo(x, prevY)
      ctx.lineTo(x, y)
      prevY = y
    }
    ctx.lineTo(W, prevY)
    ctx.stroke()
    ctx.shadowBlur = 0

    // Vertical ticks + sample dots
    for (let i = 0; i < samples.length; i += stride) {
      const x = xOf(i)
      const y = yOf(samples[i])

      ctx.strokeStyle = C.blueTick
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()

      ctx.shadowColor = C.blueDot
      ctx.shadowBlur = 8
      ctx.fillStyle = C.blueDot
      ctx.beginPath()
      ctx.arc(x, y, dotR, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }

  if (mode === 'quantized') {
    const levels = 2 ** bitDepth
    const step = 2 / levels
    const qVal = (v) => {
      const c = Math.max(-1, Math.min(1 - 1e-9, v))
      return Math.round((c + 1) / step) * step - 1
    }

    // Dim analog underlay
    ctx.strokeStyle = C.orangeDim
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(xOf(0), yOf(samples[0]))
    for (let i = 1; i < samples.length; i++) {
      ctx.lineTo(xOf(i), yOf(samples[i]))
    }
    ctx.stroke()

    // Quantization level grid (only when levels are visible)
    if (levels <= 64) {
      ctx.strokeStyle = C.orangeGrid
      ctx.lineWidth = 0.5
      for (let i = 0; i <= levels; i++) {
        const v = -1 + i * step
        const y = yOf(v)
        if (y >= 0 && y <= H) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(W, y)
          ctx.stroke()
        }
      }
    }

    // Staircase reconstruction
    ctx.shadowColor = C.orange
    ctx.shadowBlur = 5
    ctx.strokeStyle = C.orange
    ctx.lineWidth = 1.5
    ctx.beginPath()
    let prevQY = yOf(qVal(samples[0]))
    ctx.moveTo(0, prevQY)
    for (let i = 1; i < samples.length; i++) {
      const qy = yOf(qVal(samples[i]))
      ctx.lineTo(xOf(i), prevQY)
      ctx.lineTo(xOf(i), qy)
      prevQY = qy
    }
    ctx.stroke()
    ctx.shadowBlur = 0
  }
}

export default function WaveformCanvas({ samples, mode = 'analog', bitDepth = 8, sampleStride = 1, height = 180 }) {
  const canvasRef = useRef(null)
  const drawRef = useRef(null)

  const draw = useCallback(() => {
    if (canvasRef.current && samples) {
      drawWaveform(canvasRef.current, samples, mode, bitDepth, sampleStride)
    }
  }, [samples, mode, bitDepth, sampleStride])

  drawRef.current = draw

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas && (canvas.width === 0 || canvas.height === 0)) {
      canvas.width = canvas.offsetWidth || 800
      canvas.height = canvas.offsetHeight || height
    }
    draw()
  }, [draw, height])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        canvas.width = Math.floor(entry.contentRect.width)
        canvas.height = Math.floor(entry.contentRect.height)
        drawRef.current()
      }
    })
    ro.observe(canvas)
    return () => ro.disconnect()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: `${height}px` }}
    />
  )
}

export { drawWaveform }
