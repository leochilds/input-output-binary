import { useEffect, useRef } from 'react'

export default function HeroSection() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let t = 0

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      const mid = H / 2

      ctx.fillStyle = 'rgba(6, 13, 6, 0.25)'
      ctx.fillRect(0, 0, W, H)

      ctx.shadowColor = '#00ff88'
      ctx.shadowBlur = 4
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.7)'
      ctx.lineWidth = 1.5
      ctx.beginPath()

      for (let x = 0; x < W; x++) {
        const phase = (x / W) * Math.PI * 8
        const y = mid + Math.sin(phase + t) * (mid * 0.35)
          + Math.sin(phase * 0.5 + t * 1.3) * (mid * 0.15)
          + Math.sin(phase * 2 + t * 0.7) * (mid * 0.08)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.shadowBlur = 0

      t += 0.018
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <section className="hero">
      <div className="hero-canvas-wrap">
        <canvas ref={canvasRef} className="hero-canvas" />
      </div>
      <div className="hero-content">
        <div className="hero-eyebrow">
          <span className="hero-tag">SIGNAL LABORATORY</span>
          <span className="hero-divider">—</span>
          <span className="hero-tag">ADC / DAC</span>
        </div>
        <h1 className="hero-title">
          <span className="hero-title-line">SOUND</span>
          <span className="hero-title-arrow">↕</span>
          <span className="hero-title-line">BINARY</span>
        </h1>
        <p className="hero-subtitle">
          Your voice is a continuous wave of pressure — infinite precision, impossible to store.
          <br />
          Discover how it becomes 0s and 1s, and how those numbers become sound again.
        </p>
        <div className="hero-scroll-hint">
          <span>RECORD YOUR VOICE TO BEGIN</span>
          <span className="hero-arrow-down">↓</span>
        </div>
      </div>
    </section>
  )
}
