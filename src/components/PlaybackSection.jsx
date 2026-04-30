import { useRef, useState } from 'react'
import { playBuffer } from '../lib/audio.js'
import { quantize, resampleForPlayback } from '../lib/dsp.js'

export default function PlaybackSection({ rawSamples, sampleRate, displayBitDepth, displaySampleRate, locked }) {
  const [state, setState] = useState('idle') // idle | playing-original | playing-processed
  const stopRef = useRef(null)

  const stop = () => {
    stopRef.current?.()
    stopRef.current = null
    setState('idle')
  }

  const playOriginal = () => {
    if (state !== 'idle') stop()
    if (!rawSamples) return
    setState('playing-original')
    stopRef.current = playBuffer(rawSamples, sampleRate, () => setState('idle'))
  }

  const playProcessed = () => {
    if (state !== 'idle') stop()
    if (!rawSamples) return
    setState('playing-processed')

    let processed = quantize(rawSamples, displayBitDepth)
    const targetRate = displaySampleRate ?? sampleRate
    if (targetRate < sampleRate) {
      processed = resampleForPlayback(processed, sampleRate, targetRate)
    }
    stopRef.current = playBuffer(processed, sampleRate, () => setState('idle'))
  }

  const effectiveRate = displaySampleRate ?? sampleRate

  return (
    <section className={`section${locked ? ' locked' : ''}`} id="playback">
      <div className="section-header">
        <span className="section-number">06</span>
        <span className="section-title">DIGITAL → ANALOG</span>
      </div>

      <p className="section-desc">
        To play back digital audio, the computer reads the binary values, converts each to
        a voltage level, and pushes them through a speaker at the sample rate. The speaker
        cone moves in and out at those exact positions — recreating the original pressure wave.
        Compare the original with the processed version to hear the effect of your settings.
      </p>

      <div className="playback-panel">
        <div className={`playback-card${state === 'playing-original' ? ' playing' : ''}`}>
          <div className="playback-card-header">
            <span className="playback-card-tag">ORIGINAL</span>
            <span className="playback-card-indicator" />
          </div>
          <div className="playback-card-spec">
            <div className="playback-spec-row">
              <span className="playback-spec-label">SAMPLE RATE</span>
              <span className="playback-spec-value">{sampleRate ? `${(sampleRate / 1000).toFixed(1)} kHz` : '—'}</span>
            </div>
            <div className="playback-spec-row">
              <span className="playback-spec-label">BIT DEPTH</span>
              <span className="playback-spec-value">32-bit float</span>
            </div>
            <div className="playback-spec-row">
              <span className="playback-spec-label">QUALITY</span>
              <span className="playback-spec-value">Full fidelity</span>
            </div>
          </div>
          <button
            className={`btn playback-btn${state === 'playing-original' ? ' btn-playing' : ' btn-primary'}`}
            onClick={state === 'playing-original' ? stop : playOriginal}
            disabled={!rawSamples}
          >
            {state === 'playing-original' ? '■ STOP' : '▶ PLAY ORIGINAL'}
          </button>
        </div>

        <div className="playback-vs">VS</div>

        <div className={`playback-card playback-card-processed${state === 'playing-processed' ? ' playing' : ''}`}>
          <div className="playback-card-header">
            <span className="playback-card-tag playback-card-tag-orange">PROCESSED</span>
            <span className="playback-card-indicator playback-card-indicator-orange" />
          </div>
          <div className="playback-card-spec">
            <div className="playback-spec-row">
              <span className="playback-spec-label">SAMPLE RATE</span>
              <span className="playback-spec-value playback-spec-orange">
                {(effectiveRate / 1000).toFixed(1)} kHz
              </span>
            </div>
            <div className="playback-spec-row">
              <span className="playback-spec-label">BIT DEPTH</span>
              <span className="playback-spec-value playback-spec-orange">{displayBitDepth}-bit</span>
            </div>
            <div className="playback-spec-row">
              <span className="playback-spec-label">LEVELS</span>
              <span className="playback-spec-value playback-spec-orange">
                {(2 ** displayBitDepth).toLocaleString()}
              </span>
            </div>
          </div>
          <button
            className={`btn playback-btn${state === 'playing-processed' ? ' btn-playing-orange' : ' btn-orange'}`}
            onClick={state === 'playing-processed' ? stop : playProcessed}
            disabled={!rawSamples}
          >
            {state === 'playing-processed' ? '■ STOP' : '▶ PLAY PROCESSED'}
          </button>
        </div>
      </div>

      <div className="playback-tips">
        <div className="tip-row">
          <span className="tip-label">TRY:</span>
          <span className="tip-text">Set bit depth to 2–4 bits to hear heavy quantisation noise (harsh static)</span>
        </div>
        <div className="tip-row">
          <span className="tip-label">TRY:</span>
          <span className="tip-text">Set sample rate to 1–2 kHz to hear muffled, telephone-like audio</span>
        </div>
        <div className="tip-row">
          <span className="tip-label">TRY:</span>
          <span className="tip-text">8-bit at 8 kHz — the classic "old video game" sound</span>
        </div>
      </div>
    </section>
  )
}
