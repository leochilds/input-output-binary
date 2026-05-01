export function peakAmplitude(samples) {
  let peak = 0
  for (let i = 0; i < samples.length; i++) {
    const abs = Math.abs(samples[i])
    if (abs > peak) peak = abs
  }
  return peak
}

export function normalize(samples, targetPeak = 0.95) {
  const peak = peakAmplitude(samples)
  if (peak === 0) return { normalized: samples, gainFactor: 1, gainDb: 0 }
  const gainFactor = targetPeak / peak
  const normalized = new Float32Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    normalized[i] = samples[i] * gainFactor
  }
  return { normalized, gainFactor, gainDb: 20 * Math.log10(gainFactor) }
}

export function quantize(samples, bitDepth) {
  const levels = 2 ** bitDepth
  const step = 2 / levels
  const result = new Float32Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1 - 1e-9, samples[i]))
    result[i] = Math.round((clamped + 1) / step) * step - 1
  }
  return result
}

export function resampleForPlayback(samples, originalRate, targetRate) {
  if (targetRate >= originalRate) return samples
  const ratio = originalRate / targetRate
  const up = new Float32Array(samples.length)
  for (let i = 0; i < samples.length; i++) {
    const srcDown = Math.floor(i / ratio)
    up[i] = samples[Math.floor(srcDown * ratio)]
  }
  return up
}

export function toBinary(floatVal, bitDepth) {
  const levels = 2 ** bitDepth
  const uint = Math.max(0, Math.min(levels - 1,
    Math.round(((Math.max(-1, Math.min(1, floatVal)) + 1) / 2) * (levels - 1))
  ))
  return uint.toString(2).padStart(bitDepth, '0')
}

export function toUnsignedInt(floatVal, bitDepth) {
  const levels = 2 ** bitDepth
  return Math.max(0, Math.min(levels - 1,
    Math.round(((Math.max(-1, Math.min(1, floatVal)) + 1) / 2) * (levels - 1))
  ))
}

export function getWindowSamples(samples, windowDurationSec, sampleRate) {
  const windowLen = Math.min(Math.floor(windowDurationSec * sampleRate), samples.length)
  const start = Math.max(0, Math.floor(samples.length / 2) - Math.floor(windowLen / 2))
  return samples.slice(start, start + windowLen)
}

export function getDisplaySamples(samples, count = 2000) {
  if (samples.length <= count) return samples
  const step = samples.length / count
  const result = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    result[i] = samples[Math.floor(i * step)]
  }
  return result
}

export function getEvenlySpacedSamples(samples, count) {
  const result = []
  const step = Math.max(1, Math.floor(samples.length / count))
  for (let i = 0; i < count; i++) {
    const idx = Math.min(Math.floor(i * step), samples.length - 1)
    result.push({ index: idx, value: samples[idx] })
  }
  return result
}
