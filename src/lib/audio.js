export class Recorder {
  constructor() {
    this.stream = null
    this.audioCtx = null
    this.analyser = null
    this.mediaRecorder = null
    this.chunks = []
    this._rafId = null
  }

  async requestPermission() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      this.audioCtx = new AudioContext()
      return true
    } catch {
      return false
    }
  }

  startAnalyser(onFrame) {
    if (!this.stream || !this.audioCtx) return
    const source = this.audioCtx.createMediaStreamSource(this.stream)
    this.analyser = this.audioCtx.createAnalyser()
    this.analyser.fftSize = 1024
    this.analyser.smoothingTimeConstant = 0
    source.connect(this.analyser)

    const data = new Float32Array(this.analyser.frequencyBinCount)
    const tick = () => {
      this._rafId = requestAnimationFrame(tick)
      this.analyser.getFloatTimeDomainData(data)
      onFrame(data)
    }
    tick()
  }

  stopAnalyser() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }
  }

  startRecording() {
    if (!this.stream) return
    this.chunks = []
    const opts = MediaRecorder.isTypeSupported('audio/webm;codecs=pcm')
      ? { mimeType: 'audio/webm;codecs=pcm' }
      : MediaRecorder.isTypeSupported('audio/webm')
      ? { mimeType: 'audio/webm' }
      : {}
    this.mediaRecorder = new MediaRecorder(this.stream, opts)
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data)
    }
    this.mediaRecorder.start(100)
  }

  stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) { reject(new Error('No recorder')); return }
      this.mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(this.chunks, { type: this.mediaRecorder.mimeType || 'audio/webm' })
          const arrayBuffer = await blob.arrayBuffer()
          await this.audioCtx.resume()
          const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer)
          const samples = Float32Array.from(audioBuffer.getChannelData(0))
          resolve({ samples, sampleRate: audioBuffer.sampleRate })
        } catch (err) {
          reject(err)
        }
      }
      this.mediaRecorder.stop()
    })
  }

  destroy() {
    this.stopAnalyser()
    this.stream?.getTracks().forEach((t) => t.stop())
    this.audioCtx?.close()
  }
}

export function playBuffer(samples, sampleRate, onEnd) {
  const ctx = new AudioContext()
  const buf = ctx.createBuffer(1, samples.length, sampleRate)
  buf.copyToChannel(samples instanceof Float32Array ? samples : Float32Array.from(samples), 0)
  const source = ctx.createBufferSource()
  source.buffer = buf
  source.connect(ctx.destination)
  source.onended = () => {
    onEnd?.()
    setTimeout(() => ctx.close(), 200)
  }
  source.start()
  return () => {
    try { source.stop() } catch {}
    setTimeout(() => ctx.close(), 200)
  }
}
