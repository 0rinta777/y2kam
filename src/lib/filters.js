// Filters are made in the admin (catalog table) with sliders.
// Two kinds of settings:
// 1. CSS filter values (brightness, blur...) → work on the live <video> AND the canvas (ctx.filter)
// 2. Extra Y2K effects (tint, vignette, grain) → drawn on top:
//    as overlays on the live camera (FilterEffects.vue) and on the photos (applyEffects below)

// Default slider values for a new filter (= no change)
export const DEFAULT_SETTINGS = {
  brightness: 100,
  saturation: 100,
  contrast: 100,
  hue: 0,
  grayscale: 0,
  sepia: 0,
  blur: 0, // soft focus, in px
  tint: 0, // strength of the colour wash, 0-100
  tintColor: '#ff8fc8',
  vignette: 0, // dark corners, 0-100
  grain: 0, // film grain, 0-100
}

// Turn saved slider values into a CSS filter string
export function toCss(settings) {
  const s = { ...DEFAULT_SETTINGS, ...settings }
  return `brightness(${s.brightness}%) saturate(${s.saturation}%) contrast(${s.contrast}%) hue-rotate(${s.hue}deg) grayscale(${s.grayscale}%) sepia(${s.sepia}%) blur(${s.blur}px)`
}

// Draw the extra effects onto one photo on the strip canvas
// (x, y, w, h = where the photo is on the canvas)
export function applyEffects(ctx, x, y, w, h, settings) {
  const s = { ...DEFAULT_SETTINGS, ...settings }
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip() // only draw on this photo

  // Colour wash: a see-through colour layer (100% = half covered), like a haze
  if (s.tint > 0) {
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = s.tint / 200
    ctx.fillStyle = s.tintColor
    ctx.fillRect(x, y, w, h)
  }

  // Film grain: random grey dots, blended on top
  if (s.grain > 0) {
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = (s.grain / 100) * 0.6
    ctx.fillStyle = ctx.createPattern(noiseTile(), 'repeat')
    ctx.fillRect(x, y, w, h)
  }

  // Dark corners: an oval gradient from clear in the middle to dark at the edges
  if (s.vignette > 0) {
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
    const cx = x + w / 2
    const cy = y + h / 2
    const r = w / Math.SQRT2 // reaches the corners
    ctx.translate(cx, cy)
    ctx.scale(1, h / w) // circle → oval that fits the photo
    const g = ctx.createRadialGradient(0, 0, r * 0.45, 0, 0, r)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(1, `rgba(0,0,0,${s.vignette / 100})`)
    ctx.fillStyle = g
    ctx.fillRect(-w, -w, w * 2, w * 2)
  }

  ctx.restore()
}

// A small square of random grey pixels, repeated as grain
let tile = null
function noiseTile() {
  if (tile) return tile
  tile = document.createElement('canvas')
  tile.width = tile.height = 128
  const tctx = tile.getContext('2d')
  const img = tctx.createImageData(128, 128)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  tctx.putImageData(img, 0, 0)
  return tile
}

// ---- Safari fallback --------------------------------------------------
// Safari ignores ctx.filter on a canvas, so saved strips would have no filter.
// Check once if canvas filters really work (draw red with grayscale and look).
export const canvasFiltersWork = (() => {
  try {
    const c = document.createElement('canvas')
    c.width = c.height = 1
    const x = c.getContext('2d')
    x.filter = 'grayscale(100%)'
    x.fillStyle = '#f00'
    x.fillRect(0, 0, 1, 1)
    const [r, g] = x.getImageData(0, 0, 1, 1).data
    return !(r === 255 && g === 0) // still pure red = the filter was ignored
  } catch {
    return false
  }
})()

// The same colour changes as the CSS filters, done pixel by pixel
// (same order and formulas as the CSS filter spec; blur is skipped)
export function applyCssFallback(ctx, x, y, w, h, settings) {
  const s = { ...DEFAULT_SETTINGS, ...settings }
  const steps = []
  if (s.brightness !== 100) {
    const b = s.brightness / 100
    steps.push([b, 0, 0, 0, b, 0, 0, 0, b])
  }
  if (s.saturation !== 100) steps.push(saturateMatrix(s.saturation / 100))
  if (s.contrast !== 100) steps.push({ contrast: s.contrast / 100 })
  if (s.hue !== 0) steps.push(hueMatrix(s.hue))
  if (s.grayscale > 0) steps.push(grayscaleMatrix(s.grayscale / 100))
  if (s.sepia > 0) steps.push(sepiaMatrix(s.sepia / 100))
  if (!steps.length) return // no colour changes in this filter

  const img = ctx.getImageData(x, y, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i] / 255
    let g = d[i + 1] / 255
    let b = d[i + 2] / 255
    for (const m of steps) {
      if (m.contrast !== undefined) {
        r = (r - 0.5) * m.contrast + 0.5
        g = (g - 0.5) * m.contrast + 0.5
        b = (b - 0.5) * m.contrast + 0.5
      } else {
        const nr = m[0] * r + m[1] * g + m[2] * b
        const ng = m[3] * r + m[4] * g + m[5] * b
        const nb = m[6] * r + m[7] * g + m[8] * b
        r = nr
        g = ng
        b = nb
      }
      r = clamp(r)
      g = clamp(g)
      b = clamp(b)
    }
    d[i] = r * 255
    d[i + 1] = g * 255
    d[i + 2] = b * 255
  }
  ctx.putImageData(img, x, y)
}

const clamp = (v) => Math.min(1, Math.max(0, v))

// Colour matrices from the CSS filter spec
function saturateMatrix(s) {
  return [
    0.213 + 0.787 * s,
    0.715 - 0.715 * s,
    0.072 - 0.072 * s,
    0.213 - 0.213 * s,
    0.715 + 0.285 * s,
    0.072 - 0.072 * s,
    0.213 - 0.213 * s,
    0.715 - 0.715 * s,
    0.072 + 0.928 * s,
  ]
}

function hueMatrix(deg) {
  const a = (deg * Math.PI) / 180
  const c = Math.cos(a)
  const n = Math.sin(a)
  return [
    0.213 + c * 0.787 - n * 0.213,
    0.715 - c * 0.715 - n * 0.715,
    0.072 - c * 0.072 + n * 0.928,
    0.213 - c * 0.213 + n * 0.143,
    0.715 + c * 0.285 + n * 0.14,
    0.072 - c * 0.072 - n * 0.283,
    0.213 - c * 0.213 - n * 0.787,
    0.715 - c * 0.715 + n * 0.715,
    0.072 + c * 0.928 + n * 0.072,
  ]
}

function grayscaleMatrix(amount) {
  const s = 1 - amount
  return [
    0.2126 + 0.7874 * s,
    0.7152 - 0.7152 * s,
    0.0722 - 0.0722 * s,
    0.2126 - 0.2126 * s,
    0.7152 + 0.2848 * s,
    0.0722 - 0.0722 * s,
    0.2126 - 0.2126 * s,
    0.7152 - 0.7152 * s,
    0.0722 + 0.9278 * s,
  ]
}

function sepiaMatrix(amount) {
  const s = 1 - amount
  return [
    0.393 + 0.607 * s,
    0.769 - 0.769 * s,
    0.189 - 0.189 * s,
    0.349 - 0.349 * s,
    0.686 + 0.314 * s,
    0.168 - 0.168 * s,
    0.272 - 0.272 * s,
    0.534 - 0.534 * s,
    0.131 + 0.869 * s,
  ]
}
