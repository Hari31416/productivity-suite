// Lightweight zero-dependency canvas confetti particle burst

interface ConfettiOptions {
  particleCount?: number
  spread?: number
  origin?: { x: number; y: number }
  colors?: string[]
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  radius: number
  alpha: number
  decay: number
  rotation: number
  rotationSpeed: number
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4']

export function fireConfetti(options: ConfettiOptions = {}): void {
  if (typeof window === 'undefined') return

  const {
    particleCount = 40,
    spread = 60,
    origin = { x: 0.5, y: 0.5 },
    colors = DEFAULT_COLORS
  } = options

  const canvas = document.createElement('canvas')
  canvas.style.position = 'fixed'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100vw'
  canvas.style.height = '100vh'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '9999'

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    return
  }

  const originX = origin.x * canvas.width
  const originY = origin.y * canvas.height

  const particles: Particle[] = []
  const radSpread = (spread * Math.PI) / 180

  for (let i = 0; i < particleCount; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * radSpread
    const speed = Math.random() * 8 + 4
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      radius: Math.random() * 4 + 3,
      alpha: 1,
      decay: Math.random() * 0.02 + 0.015,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2
    })
  }

  let animationFrameId: number

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let aliveCount = 0

    for (const p of particles) {
      if (p.alpha <= 0) continue

      p.x += p.vx
      p.y += p.vy
      p.vy += 0.25 // Gravity
      p.vx *= 0.98 // Air resistance
      p.alpha -= p.decay
      p.rotation += p.rotationSpeed

      if (p.alpha > 0) {
        aliveCount++
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 1.5)
        ctx.restore()
      }
    }

    if (aliveCount > 0) {
      animationFrameId = requestAnimationFrame(render)
    } else {
      cancelAnimationFrame(animationFrameId)
      canvas.remove()
    }
  }

  render()
}
