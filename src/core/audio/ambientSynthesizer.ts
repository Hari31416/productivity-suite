export type AmbientSoundscapeType =
  | 'none'
  | 'white_noise'
  | 'pink_noise'
  | 'brown_noise'
  | 'rain'
  | 'cafe_drone'
  | 'binaural_gamma_40hz'
  | 'binaural_beta_14hz'
  | 'binaural_alpha_8hz'
  | 'ocean_waves'

export interface AmbientSoundscapeInfo {
  id: AmbientSoundscapeType
  label: string
  description: string
  category: 'noise' | 'nature' | 'binaural' | 'ambient'
}

export const AMBIENT_SOUNDSCAPES: AmbientSoundscapeInfo[] = [
  {
    id: 'none',
    label: 'None (Muted)',
    description: 'No ambient audio playback',
    category: 'ambient'
  },
  {
    id: 'white_noise',
    label: 'White Noise',
    description: 'Even distribution across all audible frequencies to mask distractions',
    category: 'noise'
  },
  {
    id: 'pink_noise',
    label: 'Pink Noise',
    description: 'Balanced deeper frequency profile, soothing and natural',
    category: 'noise'
  },
  {
    id: 'brown_noise',
    label: 'Brown Noise',
    description: 'Deep low-frequency rumble, ideal for deep focus and ADHD masking',
    category: 'noise'
  },
  {
    id: 'rain',
    label: 'Rainfall',
    description: 'Procedurally synthesized soothing rain shower',
    category: 'nature'
  },
  {
    id: 'ocean_waves',
    label: 'Ocean Waves',
    description: 'Rhythmic ambient wave swells for calming flow state',
    category: 'nature'
  },
  {
    id: 'cafe_drone',
    label: 'Cafe Atmosphere',
    description: 'Warm ambient resonance resembling a quiet coffee shop space',
    category: 'ambient'
  },
  {
    id: 'binaural_gamma_40hz',
    label: 'Binaural 40Hz (Gamma)',
    description: 'High-focus gamma oscillation for intense problem solving (Use headphones)',
    category: 'binaural'
  },
  {
    id: 'binaural_beta_14hz',
    label: 'Binaural 14Hz (Beta)',
    description: 'Active concentration and cognitive task performance (Use headphones)',
    category: 'binaural'
  },
  {
    id: 'binaural_alpha_8hz',
    label: 'Binaural 8Hz (Alpha)',
    description: 'Calm alertness and creative flow state (Use headphones)',
    category: 'binaural'
  }
]

export class AmbientSynthesizer {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private currentType: AmbientSoundscapeType = 'none'
  private activeNodes: (AudioNode | number)[] = []
  private volume: number = 0.5
  private _isPlaying: boolean = false

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    const AudioCtx =
      window.AudioContext ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitAudioContext

    if (!AudioCtx) return null

    if (!this.ctx) {
      this.ctx = new AudioCtx()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime)
      this.masterGain.connect(this.ctx.destination)
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // AudioContext resume catch
      })
    }

    return this.ctx
  }

  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol))
    this.volume = clamped
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.05)
    }
  }

  public getVolume(): number {
    return this.volume
  }

  public getCurrentSoundscape(): AmbientSoundscapeType {
    return this.currentType
  }

  public isPlaying(): boolean {
    return this._isPlaying && this.currentType !== 'none'
  }

  public setSoundscape(type: AmbientSoundscapeType): void {
    this.currentType = type
    if (this._isPlaying) {
      this.stopCurrentNodes()
      if (type !== 'none') {
        this.startSoundscape(type)
      }
    }
  }

  public play(type?: AmbientSoundscapeType): void {
    if (type) {
      this.currentType = type
    }
    if (this.currentType === 'none') {
      return
    }

    const ctx = this.initContext()
    if (!ctx) return

    if (ctx.state === 'suspended') {
      ctx
        .resume()
        .then(() => {
          this.stopCurrentNodes()
          this.startSoundscape(this.currentType)
          this._isPlaying = true
        })
        .catch(() => {
          // Audio resume catch
        })
    } else {
      this.stopCurrentNodes()
      this.startSoundscape(this.currentType)
      this._isPlaying = true
    }
  }

  public pause(): void {
    this.stopCurrentNodes()
    this._isPlaying = false
  }

  public stop(): void {
    this.stopCurrentNodes()
    this._isPlaying = false
    this.currentType = 'none'
  }

  private stopCurrentNodes(): void {
    for (const item of this.activeNodes) {
      if (typeof item === 'number') {
        window.clearInterval(item)
      } else {
        try {
          if ('stop' in item && typeof (item as AudioScheduledSourceNode).stop === 'function') {
            ;(item as AudioScheduledSourceNode).stop()
          }
          item.disconnect()
        } catch {
          // Node cleanup catch
        }
      }
    }
    this.activeNodes = []
  }

  private startSoundscape(type: AmbientSoundscapeType): void {
    const ctx = this.ctx
    const master = this.masterGain
    if (!ctx || !master) return

    switch (type) {
      case 'white_noise':
        this.createNoiseGenerator(ctx, master, 'white')
        break
      case 'pink_noise':
        this.createNoiseGenerator(ctx, master, 'pink')
        break
      case 'brown_noise':
        this.createNoiseGenerator(ctx, master, 'brown')
        break
      case 'rain':
        this.createRainGenerator(ctx, master)
        break
      case 'ocean_waves':
        this.createOceanWavesGenerator(ctx, master)
        break
      case 'cafe_drone':
        this.createCafeDroneGenerator(ctx, master)
        break
      case 'binaural_gamma_40hz':
        this.createBinauralBeatGenerator(ctx, master, 200, 240)
        break
      case 'binaural_beta_14hz':
        this.createBinauralBeatGenerator(ctx, master, 200, 214)
        break
      case 'binaural_alpha_8hz':
        this.createBinauralBeatGenerator(ctx, master, 200, 208)
        break
      default:
        break
    }
  }

  private createNoiseGenerator(
    ctx: AudioContext,
    destination: AudioNode,
    variant: 'white' | 'pink' | 'brown'
  ): void {
    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    if (variant === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }
    } else if (variant === 'pink') {
      let b0 = 0
      let b1 = 0
      let b2 = 0
      let b3 = 0
      let b4 = 0
      let b5 = 0
      let b6 = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.969 * b2 + white * 0.153852
        b3 = 0.8665 * b3 + white * 0.3104856
        b4 = 0.55 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.016898
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
        b6 = white * 0.115926
      }
    } else if (variant === 'brown') {
      let lastOut = 0.0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (lastOut + 0.02 * white) / 1.02
        lastOut = data[i]
        data[i] *= 3.5
      }
    }

    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = buffer
    noiseSource.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(variant === 'white' ? 8000 : 3000, ctx.currentTime)

    noiseSource.connect(filter)
    filter.connect(destination)
    noiseSource.start()

    this.activeNodes.push(noiseSource, filter)
  }

  private createRainGenerator(ctx: AudioContext, destination: AudioNode): void {
    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    let lastOut = 0.0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (lastOut + 0.03 * white) / 1.03
      lastOut = data[i]
      data[i] *= 2.5
    }

    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = buffer
    noiseSource.loop = true

    const lowpass = ctx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.setValueAtTime(1400, ctx.currentTime)

    const highpass = ctx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.setValueAtTime(200, ctx.currentTime)

    const rainGain = ctx.createGain()
    rainGain.gain.setValueAtTime(0.8, ctx.currentTime)

    noiseSource.connect(lowpass)
    lowpass.connect(highpass)
    highpass.connect(rainGain)
    rainGain.connect(destination)
    noiseSource.start()

    this.activeNodes.push(noiseSource, lowpass, highpass, rainGain)
  }

  private createOceanWavesGenerator(ctx: AudioContext, destination: AudioNode): void {
    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    let lastOut = 0.0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (lastOut + 0.02 * white) / 1.02
      lastOut = data[i]
      data[i] *= 3.0
    }

    const noiseSource = ctx.createBufferSource()
    noiseSource.buffer = buffer
    noiseSource.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(350, ctx.currentTime)

    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime) // 8-second wave cycle

    const lfoGain = ctx.createGain()
    lfoGain.gain.setValueAtTime(220, ctx.currentTime)

    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)

    const swellGain = ctx.createGain()
    swellGain.gain.setValueAtTime(0.7, ctx.currentTime)

    noiseSource.connect(filter)
    filter.connect(swellGain)
    swellGain.connect(destination)

    noiseSource.start()
    lfo.start()

    this.activeNodes.push(noiseSource, filter, lfo, lfoGain, swellGain)
  }

  private createCafeDroneGenerator(ctx: AudioContext, destination: AudioNode): void {
    const rootFreqs = [174.61, 220.0, 261.63, 329.63] // F3, A3, C4, E4 warm major 7th chord
    const chordGain = ctx.createGain()
    chordGain.gain.setValueAtTime(0.25, ctx.currentTime)

    rootFreqs.forEach((freq) => {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(freq, ctx.currentTime)
      filter.Q.setValueAtTime(4, ctx.currentTime)

      osc.connect(filter)
      filter.connect(chordGain)
      osc.start()
      this.activeNodes.push(osc, filter)
    })

    // Add gentle low-rumble ambient chatter noise
    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let lastOut = 0.0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (lastOut + 0.015 * white) / 1.015
      lastOut = data[i]
      data[i] *= 2.0
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.setValueAtTime(600, ctx.currentTime)
    noiseFilter.Q.setValueAtTime(1.5, ctx.currentTime)

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.4, ctx.currentTime)

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(chordGain)
    noise.start()

    chordGain.connect(destination)
    this.activeNodes.push(noise, noiseFilter, noiseGain, chordGain)
  }

  private createBinauralBeatGenerator(
    ctx: AudioContext,
    destination: AudioNode,
    leftFreq: number,
    rightFreq: number
  ): void {
    // Left channel oscillator
    const oscLeft = ctx.createOscillator()
    oscLeft.type = 'sine'
    oscLeft.frequency.setValueAtTime(leftFreq, ctx.currentTime)

    // Right channel oscillator
    const oscRight = ctx.createOscillator()
    oscRight.type = 'sine'
    oscRight.frequency.setValueAtTime(rightFreq, ctx.currentTime)

    // Stereo Panner or Channel Merger
    const merger = ctx.createChannelMerger(2)
    const gainLeft = ctx.createGain()
    const gainRight = ctx.createGain()
    gainLeft.gain.setValueAtTime(0.35, ctx.currentTime)
    gainRight.gain.setValueAtTime(0.35, ctx.currentTime)

    oscLeft.connect(gainLeft)
    gainLeft.connect(merger, 0, 0) // Left output to Channel 0

    oscRight.connect(gainRight)
    gainRight.connect(merger, 0, 1) // Right output to Channel 1

    merger.connect(destination)

    oscLeft.start()
    oscRight.start()

    this.activeNodes.push(oscLeft, oscRight, gainLeft, gainRight, merger)
  }
}

export const ambientSynthesizer = new AmbientSynthesizer()
