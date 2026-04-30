import { useMemo } from 'react'
import WaveformCanvas from './WaveformCanvas.jsx'
import { getWindowSamples } from '../lib/dsp.js'

const BIT_PRESETS = [
  { bits: 2,  desc: '4 levels — barely recognisable' },
  { bits: 3,  desc: '8 levels — heavily distorted' },
  { bits: 4,  desc: '16 levels — noisy but intelligible' },
  { bits: 6,  desc: '64 levels — audible hiss' },
  { bits: 8,  desc: '256 levels — old game audio' },
  { bits: 12, desc: '4,096 levels — near transparent' },
  { bits: 16, desc: '65,536 levels — CD quality' },
]

export default function QuantizationSection({ rawSamples, sampleRate, displayBitDepth, setDisplayBitDepth, locked }) {
  const windowSamples = useMemo(() => {
    if (!rawSamples) return null
    return getWindowSamples(rawSamples, 0.05, sampleRate)
  }, [rawSamples, sampleRate])

  const preset = BIT_PRESETS.find(p => p.bits === displayBitDepth) ?? BIT_PRESETS[4]
  const sliderIndex = BIT_PRESETS.findIndex(p => p.bits === displayBitDepth)

  const handleSlider = (e) => {
    setDisplayBitDepth(BIT_PRESETS[Number(e.target.value)].bits)
  }

  const levels = 2 ** displayBitDepth
  const stepSize = (2 / levels).toFixed(6)
  const bytesPerSample = displayBitDepth <= 8 ? 1 : 2

  return (
    <section className={`section${locked ? ' locked' : ''}`} id="quantization">
      <div className="section-header">
        <span className="section-number">04</span>
        <span className="section-title">BIT DEPTH</span>
      </div>

      <p className="section-desc">
        Each sample's amplitude must be stored as a number. <em>Bit depth</em> determines
        how many distinct values are available. With N bits you get 2<sup>N</sup> levels.
        Fewer levels means each sample is rounded to the nearest available step — that
        rounding error is heard as noise and distortion.
      </p>

      <div className="canvas-container">
        {windowSamples
          ? <WaveformCanvas
              samples={windowSamples}
              mode="quantized"
              bitDepth={displayBitDepth}
              height={200}
            />
          : <div style={{ height: 200 }} />
        }
      </div>

      <div className="controls">
        <div className="control-group">
          <div className="control-header">
            <span className="control-label">BIT DEPTH</span>
            <span className="control-value-display">
              <span className="control-value control-value-orange">{preset.bits}-bit</span>
              <span className="control-value-sub">{preset.desc}</span>
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={BIT_PRESETS.length - 1}
            step="1"
            value={sliderIndex}
            onChange={handleSlider}
            className="slider-orange"
            style={{ '--pct': `${(sliderIndex / (BIT_PRESETS.length - 1)) * 100}%` }}
          />
          <div className="slider-ticks">
            {BIT_PRESETS.map((p) => (
              <span key={p.bits} className="slider-tick">{p.bits}-bit</span>
            ))}
          </div>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">BIT DEPTH</span>
          <span className="stat-value stat-value-orange">{displayBitDepth} bits</span>
        </div>
        <div className="stat">
          <span className="stat-label">LEVELS</span>
          <span className="stat-value stat-value-orange">2<sup>{displayBitDepth}</sup> = {levels.toLocaleString()}</span>
        </div>
        <div className="stat">
          <span className="stat-label">STEP SIZE</span>
          <span className="stat-value stat-value-orange">{stepSize}</span>
        </div>
        <div className="stat">
          <span className="stat-label">BYTES / SAMPLE</span>
          <span className="stat-value stat-value-orange">{bytesPerSample}</span>
        </div>
      </div>

      <div className="bit-depth-scale">
        {BIT_PRESETS.map((p) => (
          <div
            key={p.bits}
            className={`bit-scale-item${p.bits === displayBitDepth ? ' active' : ''}`}
            onClick={() => setDisplayBitDepth(p.bits)}
          >
            <span className="bit-scale-bits">{p.bits}-bit</span>
            <span className="bit-scale-levels">{(2 ** p.bits).toLocaleString()}</span>
            <span className="bit-scale-desc">{p.desc.split(' — ')[1]}</span>
          </div>
        ))}
      </div>

      <div className="info-callout info-callout-orange">
        <span className="info-icon">🎛</span>
        <p>
          The orange line is the <strong>quantised reconstruction</strong> — what the computer
          actually stores. The dim line is the original analog signal. Notice the "staircase"
          effect: each sample jumps to the nearest level instead of tracking the smooth curve.
          At {displayBitDepth}-bit depth, the maximum rounding error is ±{(1 / levels).toFixed(6)}.
        </p>
      </div>
    </section>
  )
}
