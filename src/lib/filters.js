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
