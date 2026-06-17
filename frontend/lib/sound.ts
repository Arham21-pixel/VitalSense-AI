/**
 * VitalSense Alert Sound Engine
 * Synthesises notification beeps via the Web Audio API.
 * No audio files required — all sounds are generated programmatically.
 */

type Priority = 'CRITICAL' | 'HIGH' | 'WARNING' | 'NORMAL' | string

let ctx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx || ctx.state === 'closed') {
    try {
      ctx = new AudioContext()
    } catch {
      return null
    }
  }
  return ctx
}

/** Play a single pure tone burst */
function beep(
  audioCtx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  gain: number,
  type: OscillatorType = 'sine',
) {
  const osc = audioCtx.createOscillator()
  const gainNode = audioCtx.createGain()

  osc.connect(gainNode)
  gainNode.connect(audioCtx.destination)

  osc.type = type
  osc.frequency.setValueAtTime(frequency, startTime)

  // Smooth attack + release to avoid clicks
  gainNode.gain.setValueAtTime(0, startTime)
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.015)
  gainNode.gain.setValueAtTime(gain, startTime + duration - 0.02)
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration)

  osc.start(startTime)
  osc.stop(startTime + duration)
}

/**
 * Play a notification sound appropriate to the given alert priority.
 *
 * CRITICAL → urgent triple beep (high-pitched, fast, square wave)
 * HIGH     → double beep (mid-high, sine)
 * WARNING  → single warm beep (mid, sine)
 * NORMAL   → soft single blip (low, sine)
 */
export function playAlertSound(priority: Priority = 'NORMAL'): void {
  const audioCtx = getAudioContext()
  if (!audioCtx) return

  // Resume context if it was suspended (browser autoplay policy)
  const play = () => {
    const now = audioCtx.currentTime

    switch (priority) {
      case 'CRITICAL': {
        // Three rapid high-pitched square-wave beeps — unmissable
        beep(audioCtx, 1046, now + 0.00, 0.12, 0.55, 'square')
        beep(audioCtx, 1318, now + 0.15, 0.12, 0.55, 'square')
        beep(audioCtx, 1046, now + 0.30, 0.18, 0.60, 'square')
        break
      }
      case 'HIGH': {
        // Two medium-high sine beeps
        beep(audioCtx, 880, now + 0.00, 0.14, 0.45, 'sine')
        beep(audioCtx, 880, now + 0.20, 0.14, 0.45, 'sine')
        break
      }
      case 'WARNING': {
        // Single warm mid-tone
        beep(audioCtx, 660, now + 0.00, 0.20, 0.38, 'sine')
        break
      }
      default: {
        // Soft low blip
        beep(audioCtx, 440, now + 0.00, 0.15, 0.28, 'sine')
        break
      }
    }
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(play).catch(() => {})
  } else {
    play()
  }
}

/** Mute / unmute globally — persisted in sessionStorage */
export function isSoundMuted(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem('vs_mute_alerts') === '1'
}

export function toggleSoundMute(): boolean {
  const next = !isSoundMuted()
  sessionStorage.setItem('vs_mute_alerts', next ? '1' : '0')
  return next // returns new muted state
}

/** Convenience wrapper — respects global mute */
export function playAlertSoundIfUnmuted(priority: Priority): void {
  if (!isSoundMuted()) playAlertSound(priority)
}
