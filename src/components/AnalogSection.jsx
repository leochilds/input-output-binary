import { useMemo } from 'react'
import WaveformCanvas from './WaveformCanvas.jsx'
import { getDisplaySamples, peakAmplitude } from '../lib/dsp.js'

export default function AnalogSection({ rawSamples, sampleRate, gainDb, locked }) {
  const displaySamples = useMemo(() => {
    if (!rawSamples) return null
    return getDisplaySamples(rawSamples, 2000)
  }, [rawSamples])

  const peak = useMemo(() => rawSamples ? peakAmplitude(rawSamples) : null, [rawSamples])

  const durationSec = rawSamples ? (rawSamples.length / sampleRate).toFixed(2) : '—'
  const totalSamples = rawSamples ? rawSamples.length.toLocaleString() : '—'

  return (
    <section className={`section${locked ? ' locked' : ''}`} id="analog">
      <div className="section-header">
        <span className="section-number">02</span>
        <span className="section-title">THE ANALOG WAVE</span>
      </div>

      <p className="section-desc">
        This is your recording rendered as a continuous waveform — the closest digital representation
        of the analog signal. Each point is an amplitude measurement: how far the air pressure
        was from rest at that instant in time.
      </p>

      <div className="canvas-container">
        {displaySamples
          ? <WaveformCanvas samples={displaySamples} mode="analog" height={200} />
          : <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="canvas-placeholder">AWAITING RECORDING</span>
            </div>
        }
      </div>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">SAMPLE RATE</span>
          <span className="stat-value">{sampleRate ? `${(sampleRate / 1000).toFixed(1)} kHz` : '—'}</span>
        </div>
        <div className="stat">
          <span className="stat-label">DURATION</span>
          <span className="stat-value">{durationSec}s</span>
        </div>
        <div className="stat">
          <span className="stat-label">TOTAL SAMPLES</span>
          <span className="stat-value">{totalSamples}</span>
        </div>
        <div className="stat">
          <span className="stat-label">PEAK AFTER NORM.</span>
          <span className="stat-value">{peak !== null ? `±${peak.toFixed(3)}` : '—'}</span>
        </div>
        {gainDb !== null && (
          <div className="stat">
            <span className="stat-label">GAIN APPLIED</span>
            <span className="stat-value stat-value-gain">{gainDb > 0 ? '+' : ''}{gainDb.toFixed(1)} dB</span>
          </div>
        )}
      </div>

      <div className="info-callout">
        <span className="info-icon">⚡</span>
        <p>
          Your browser recorded at <strong>{sampleRate ? `${sampleRate.toLocaleString()} Hz` : '?'}</strong> —
          that's {sampleRate ? sampleRate.toLocaleString() : '?'} measurements every second.
          At this rate, the highest frequency that can be represented is{' '}
          <strong>{sampleRate ? `${(sampleRate / 2000).toFixed(1)} kHz` : '?'}</strong> (Nyquist theorem: half the sample rate).
          {gainDb !== null && gainDb > 0 && (
            <> The raw signal was boosted by <strong>+{gainDb.toFixed(1)} dB</strong> ({(10 ** (gainDb / 20)).toFixed(1)}×) to
            fill the display range — a standard step called <em>peak normalization</em>.</>
          )}
        </p>
      </div>
    </section>
  )
}
