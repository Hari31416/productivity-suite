import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AmbientSynthesizer, AMBIENT_SOUNDSCAPES } from '../ambientSynthesizer'

describe('AmbientSynthesizer', () => {
  let synthesizer: AmbientSynthesizer

  beforeEach(() => {
    synthesizer = new AmbientSynthesizer()
  })

  afterEach(() => {
    synthesizer.stop()
  })

  it('provides the complete list of ambient soundscapes', () => {
    expect(AMBIENT_SOUNDSCAPES.length).toBeGreaterThanOrEqual(8)
    const soundscapeIds = AMBIENT_SOUNDSCAPES.map((s) => s.id)
    expect(soundscapeIds).toContain('none')
    expect(soundscapeIds).toContain('white_noise')
    expect(soundscapeIds).toContain('pink_noise')
    expect(soundscapeIds).toContain('brown_noise')
    expect(soundscapeIds).toContain('rain')
    expect(soundscapeIds).toContain('cafe_drone')
    expect(soundscapeIds).toContain('binaural_gamma_40hz')
    expect(soundscapeIds).toContain('binaural_beta_14hz')
    expect(soundscapeIds).toContain('binaural_alpha_8hz')
    expect(soundscapeIds).toContain('ocean_waves')
  })

  it('initializes with default values', () => {
    expect(synthesizer.getCurrentSoundscape()).toBe('none')
    expect(synthesizer.isPlaying()).toBe(false)
    expect(synthesizer.getVolume()).toBe(0.5)
  })

  it('clamps volume properly between 0 and 1', () => {
    synthesizer.setVolume(0.8)
    expect(synthesizer.getVolume()).toBe(0.8)

    synthesizer.setVolume(1.5)
    expect(synthesizer.getVolume()).toBe(1)

    synthesizer.setVolume(-0.2)
    expect(synthesizer.getVolume()).toBe(0)
  })

  it('changes soundscapes and state correctly', () => {
    synthesizer.setSoundscape('white_noise')
    expect(synthesizer.getCurrentSoundscape()).toBe('white_noise')

    synthesizer.pause()
    expect(synthesizer.isPlaying()).toBe(false)

    synthesizer.stop()
    expect(synthesizer.getCurrentSoundscape()).toBe('none')
    expect(synthesizer.isPlaying()).toBe(false)
  })

  it('handles playback in mock audio context gracefully', () => {
    const mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        setTargetAtTime: vi.fn()
      },
      connect: vi.fn(),
      disconnect: vi.fn()
    }

    const mockBufferSource = {
      buffer: null,
      loop: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    }

    const mockFilter = {
      type: 'lowpass',
      frequency: { setValueAtTime: vi.fn() },
      Q: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn()
    }

    const mockOscillator = {
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    }

    const mockMerger = {
      connect: vi.fn(),
      disconnect: vi.fn()
    }

    const mockBuffer = {
      getChannelData: vi.fn().mockReturnValue(new Float32Array(100))
    }

    const mockAudioContext = vi.fn().mockImplementation(() => ({
      state: 'running',
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      createGain: vi.fn().mockReturnValue(mockGain),
      createBufferSource: vi.fn().mockReturnValue(mockBufferSource),
      createBiquadFilter: vi.fn().mockReturnValue(mockFilter),
      createOscillator: vi.fn().mockReturnValue(mockOscillator),
      createChannelMerger: vi.fn().mockReturnValue(mockMerger),
      createBuffer: vi.fn().mockReturnValue(mockBuffer),
      resume: vi.fn().mockResolvedValue(undefined)
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).AudioContext = mockAudioContext

    const testSynth = new AmbientSynthesizer()
    testSynth.play('rain')
    expect(testSynth.getCurrentSoundscape()).toBe('rain')
    expect(testSynth.isPlaying()).toBe(true)

    testSynth.setSoundscape('binaural_gamma_40hz')
    expect(testSynth.getCurrentSoundscape()).toBe('binaural_gamma_40hz')

    testSynth.pause()
    expect(testSynth.isPlaying()).toBe(false)

    testSynth.stop()
    expect(testSynth.isPlaying()).toBe(false)
    expect(testSynth.getCurrentSoundscape()).toBe('none')
  })
})
