import { useState } from 'react'
import HeroSection from './components/HeroSection.jsx'
import RecordSection from './components/RecordSection.jsx'
import AnalogSection from './components/AnalogSection.jsx'
import SamplingSection from './components/SamplingSection.jsx'
import QuantizationSection from './components/QuantizationSection.jsx'
import BinarySection from './components/BinarySection.jsx'
import PlaybackSection from './components/PlaybackSection.jsx'

export default function App() {
  const [rawSamples, setRawSamples] = useState(null)
  const [sampleRate, setSampleRate] = useState(44100)
  const [displayBitDepth, setDisplayBitDepth] = useState(8)
  const [displaySampleRate, setDisplaySampleRate] = useState(null)

  const handleRecordingComplete = (samples, rate) => {
    setRawSamples(samples)
    setSampleRate(rate)
    setDisplaySampleRate(null)
    setTimeout(() => {
      document.getElementById('analog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
  }

  const locked = !rawSamples

  return (
    <div className="app">
      <HeroSection />

      <div className="main-content">
        <RecordSection onRecordingComplete={handleRecordingComplete} />

        <hr className="section-divider" />
        <AnalogSection rawSamples={rawSamples} sampleRate={sampleRate} locked={locked} />

        <hr className="section-divider" />
        <SamplingSection
          rawSamples={rawSamples}
          sampleRate={sampleRate}
          displaySampleRate={displaySampleRate}
          setDisplaySampleRate={setDisplaySampleRate}
          locked={locked}
        />

        <hr className="section-divider" />
        <QuantizationSection
          rawSamples={rawSamples}
          sampleRate={sampleRate}
          displayBitDepth={displayBitDepth}
          setDisplayBitDepth={setDisplayBitDepth}
          locked={locked}
        />

        <hr className="section-divider" />
        <BinarySection
          rawSamples={rawSamples}
          sampleRate={sampleRate}
          displayBitDepth={displayBitDepth}
          locked={locked}
        />

        <hr className="section-divider" />
        <PlaybackSection
          rawSamples={rawSamples}
          sampleRate={sampleRate}
          displayBitDepth={displayBitDepth}
          displaySampleRate={displaySampleRate}
          locked={locked}
        />
      </div>

      <footer className="site-footer">
        <span>SIGNAL LABORATORY — ADC / DAC EXPLORER</span>
      </footer>
    </div>
  )
}
