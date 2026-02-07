import { useState, useEffect, useRef } from 'react'

/**
 * Characters used for scrambling animation effect.
 */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*<>{}[]'

/**
 * Hook that creates a scramble animation effect for text.
 * Gradually reveals characters from the target string while scrambling unrevealed characters.
 *
 * @param target - The target string to reveal
 * @param active - Whether the animation is currently active
 * @param durationMs - Duration of the animation in milliseconds
 * @returns The scrambled display string, or null if not active
 */
export function useScrambleText(target: string | null, active: boolean, durationMs = 900): string | null {
  const [display, setDisplay] = useState<string | null>(null)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (!active || !target) {
      if (!active) setDisplay(null)
      return
    }

    const len = target.length
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / durationMs, 1)
      const revealed = Math.floor(progress * len)

      let out = ''
      for (let i = 0; i < len; i++) {
        if (i < revealed) {
          out += target[i]
        } else {
          out += CHARS[Math.floor(Math.random() * CHARS.length)]
        }
      }
      setDisplay(out)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(target)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, active, durationMs])

  return display
}
