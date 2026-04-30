import { useMemo } from 'react'
import WaveformCanvas from './WaveformCanvas.jsx'
import { getWindowSamples } from '../lib/dsp.js'

const RATE_PRESETS = [
  { rate: 500,   label: '500 Hz',   desc: 'Barely intelligible' },
  { rate: 1000,  label: '1 kHz',    desc: 'Very low quality' },
  { rate: 2000,  label: '2 kHz',    desc: 'Telephone (old)' },
  { rate: 4000,  label: '4 kHz',    desc: 'Telephone (PSTN)' },
  { rate: 8000,  label: '8 kHz',    desc: 'Voicemail' },
  { rate: 11025, label: '11 kHz',   desc: 'AM radio' },
  { rate: 22050, label: '22 kHz',   desc: 'FM radio' },
  { rate: null,  label: 'Native',   desc: 'CD quality+' },
]

export default function SamplingSection({ rawSamples, sampleRate, displaySampleRate, setDisplaySampleRate, locked }) {
  const windowSamples = useMemo(() => {
    if (!rawSamples) return null
    return getWindowSamples(rawSamples, 0.05, sampleRate)
  }, [rawSamples, sampleRate])

  const effectiveRate = displaySampleRate ?? sampleRate
  const sampleStride = Math.max(1, Math.round(sampleRate / effectiveRate))

  const preset = RATE_PRESETS.find(p => p.rate === displaySampleRate) ?? RATE_PRESETS[RATE_PRESETS.length - 1]
  const sliderIndex = displaySampleRate === null
    ? RATE_PRESETS.length - 1
    : RATE_PRESETS.findIndex(p => p.rate === displaySampleRate)

  const handleSlider = (e) => {
    const idx = Number(e.target.value)
    setDisplaySampleRate(RATE_PRESETS[idx].rate)
  }

  const totalSamples = rawSamples
    ? Math.round(rawSamples.length * (effectiveRate / sampleRate)).toLocaleString()
    : '—'

  return (
    <section className={`section${locked ? ' locked' : ''}`} id="sampling">
      <div className="section-header">
        <span className="section-number">03</span>
        <span className="section-title">SAMPLING RATE</span>
      </div>

      <p className="section-desc">
        To store a sound digitally, a computer must <em>sample</em> the wave — take a snapshot
        of its amplitude at regular intervals. The sampling rate determines how many snapshots
        are taken per second. More samples = higher fidelity, larger file.
      </p>

      <div className="canvas-container">
        {windowSamples
          ? <WaveformCanvas
              samples={windowSamples}
              mode="sampled"
              sampleStride={sampleStride}
              height={200}
            />
          : <div style={{ height: 200 }} />
        }
      </div>

      <div className="controls">
        <div className="control-group">
          <div className="control-header">
            <span className="control-label">SAMPLE RATE</span>
            <span className="control-value-display">
              <span className="control-value">{preset.label}</span>
              <span className="control-value-sub">{preset.desc}</span>
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={RATE_PRESETS.length - 1}
            step="1"
            value={sliderIndex === -1 ? RATE_PRESETS.length - 1 : sliderIndex}
            onChange={handleSlider}
            className="slider-green"
            style={{ '--pct': `${((sliderIndex === -1 ? RATE_PRESETS.length - 1 : sliderIndex) / (RATE_PRESETS.length - 1)) * 100}%` }}
          />
          <div className="slider-ticks">
            {RATE_PRESETS.map((p) => (
              <span key={p.label} className="slider-tick">{p.label}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">SAMPLES / SEC</span>
          <span className="stat-value">{effectiveRate.toLocaleString()}</span>
        </div>
        <div className="stat">
          <span className="stat-label">INTERVAL</span>
          <span className="stat-value">{(1000000 / effectiveRate).toFixed(1)} µs</span>
        </div>
        <div className="stat">
          <span className="stat-label">TOTAL SAMPLES</span>
          <span className="stat-value">{totalSamples}</span>
        </div>
        <div className="stat">
          <span className="stat-label">MAX FREQ</span>
          <span className="stat-value">{(effectiveRate / 2000).toFixed(1)} kHz</span>
        </div>
      </div>

      <div className="info-callout">
        <span className="info-icon">📡</span>
        <p>
          <strong>Nyquist–Shannon theorem:</strong> to accurately reproduce a frequency,
          you must sample at least twice as fast. At {(effectiveRate / 1000).toFixed(1)} kHz,
          the highest reproducible frequency is {(effectiveRate / 2000).toFixed(1)} kHz.
          Human hearing reaches ~20 kHz — that's why CD audio uses 44.1 kHz.
        </p>
      </div>
    </section>
  )
}
