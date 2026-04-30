import { useMemo } from 'react'
import { toBinary, toUnsignedInt, getEvenlySpacedSamples } from '../lib/dsp.js'

const SAMPLE_COUNT = 32

export default function BinarySection({ rawSamples, sampleRate, displayBitDepth, locked }) {
  const samples = useMemo(() => {
    if (!rawSamples) return []
    return getEvenlySpacedSamples(rawSamples, SAMPLE_COUNT)
  }, [rawSamples])

  const levels = 2 ** displayBitDepth

  return (
    <section className={`section${locked ? ' locked' : ''}`} id="binary">
      <div className="section-header">
        <span className="section-number">05</span>
        <span className="section-title">BINARY STORAGE</span>
      </div>

      <p className="section-desc">
        Each quantised amplitude becomes an unsigned integer, then stored as binary.
        Below are {SAMPLE_COUNT} evenly-spaced samples from your recording at the current
        bit depth of <strong>{displayBitDepth} bits</strong> ({levels.toLocaleString()} levels).
        Change the bit depth slider above and watch the binary values change.
      </p>

      <div className="binary-grid-header">
        <span className="binary-col-label">SAMPLE #</span>
        <span className="binary-col-label">AMPLITUDE</span>
        <span className="binary-col-label">INTEGER (0–{levels - 1})</span>
        <span className="binary-col-label binary-col-binary">BINARY ({displayBitDepth} BITS)</span>
      </div>

      <div className="binary-grid">
        {samples.map(({ index, value }) => {
          const uint = toUnsignedInt(value, displayBitDepth)
          const bin = toBinary(value, displayBitDepth)
          return (
            <div key={index} className="binary-row">
              <span className="binary-index">{index.toLocaleString()}</span>
              <span className="binary-float">{value >= 0 ? '+' : ''}{value.toFixed(4)}</span>
              <span className="binary-uint">{uint}</span>
              <span className="binary-bits">
                <BinaryDisplay bits={bin} bitDepth={displayBitDepth} />
              </span>
            </div>
          )
        })}
      </div>

      <div className="info-callout">
        <span className="info-icon">💾</span>
        <p>
          At {displayBitDepth}-bit depth with {sampleRate ? sampleRate.toLocaleString() : '?'} samples/sec,
          one second of mono audio takes{' '}
          <strong>{sampleRate ? Math.round(sampleRate * displayBitDepth / 8).toLocaleString() : '?'} bytes</strong>{' '}
          ({sampleRate ? (sampleRate * displayBitDepth / 8 / 1024).toFixed(1) : '?'} KB/s) — before any compression.
          Stereo doubles that. MP3 and AAC compress 10–20× by discarding sounds humans can't easily perceive.
        </p>
      </div>
    </section>
  )
}

function BinaryDisplay({ bits, bitDepth }) {
  const groups = []
  const groupSize = bitDepth <= 8 ? 4 : 8
  for (let i = 0; i < bits.length; i += groupSize) {
    groups.push(bits.slice(i, i + groupSize))
  }

  return (
    <span className="bin-display">
      {groups.map((group, gi) => (
        <span key={gi} className="bin-group">
          {group.split('').map((bit, bi) => {
            const globalIndex = gi * groupSize + bi
            const isMSB = globalIndex < Math.ceil(bitDepth / 4)
            return (
              <span
                key={bi}
                className={`bin-digit ${bit === '1' ? 'bin-one' : 'bin-zero'} ${isMSB ? 'bin-msb' : ''}`}
              >
                {bit}
              </span>
            )
          })}
        </span>
      ))}
    </span>
  )
}
